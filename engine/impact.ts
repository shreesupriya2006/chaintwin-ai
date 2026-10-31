// Impact Calculation Engine for Supply Chain Disruptions (Pure TypeScript)
// All dates and timeline logic rely on injected `now` parameter.

import {
  Disruption,
  NetworkSnapshot,
  DisruptionImpact,
  AffectedOrder,
  OrderStatus,
  InboundPO,
  OrderStage,
  Material,
  Supplier,
} from './types';
import {
  formatDate,
  addDaysToDate,
  getDaysDiff,
  isDateBefore,
  isDateAfter,
  isDateOnOrBefore,
  parseDate,
} from './clock';
import { evaluateOrderStages } from './orderProgress';

export function calculateDisruptionImpact(
  disruption: Disruption,
  snapshot: NetworkSnapshot,
  now: Date
): DisruptionImpact {
  const nowStr = formatDate(now);
  const outageStart = disruption.start_date;
  const outageDuration = Math.max(1, disruption.duration_days);
  const outageEnd = addDaysToDate(outageStart, outageDuration);
  const capacityLoss = (disruption.capacity_loss_pct ?? 100) / 100;

  const disruptedSupplier =
    snapshot.suppliers.find((s) => s.supplier_id === disruption.supplier_id) || null;

  // 1. Affected Materials supplied by the disrupted supplier
  const supplierMatLinks = snapshot.supplierMaterials.filter(
    (sm) => sm.supplier_id === disruption.supplier_id
  );
  const affectedMaterialIds = new Set(supplierMatLinks.map((sm) => sm.material_id));
  const affectedMaterials: Material[] = snapshot.materials.filter((m) =>
    affectedMaterialIds.has(m.material_id)
  );

  // 2. Delayed Inbound POs
  // Any PO from this supplier not yet 'Received' whose arrival falls within or after outage start
  const delayedInboundPOs: Array<
    InboundPO & { originalExpected: string; delayedExpected: string; delayDays: number }
  > = [];

  for (const po of snapshot.inboundPOs) {
    if (po.supplier_id === disruption.supplier_id && po.status !== 'Received') {
      const smLink = supplierMatLinks.find((sm) => sm.material_id === po.material_id);
      const leadTime = smLink ? smLink.lead_time_days : 3;

      // Check if PO arrival is impacted
      if (
        isDateOnOrBefore(po.expected_arrival, outageEnd) &&
        isDateAfter(po.expected_arrival, outageStart)
      ) {
        // Delayed: new arrival = max(old arrival, outage end + lead time)
        const delayedDate = addDaysToDate(outageEnd, leadTime);
        const delayDays = Math.max(0, getDaysDiff(delayedDate, po.expected_arrival));

        delayedInboundPOs.push({
          ...po,
          originalExpected: po.expected_arrival,
          delayedExpected: delayedDate,
          delayDays,
        });
      } else if (isDateOnOrBefore(outageStart, po.expected_arrival)) {
        // Orders planned during/after outage start also shift
        const delayedDate = addDaysToDate(outageEnd, leadTime);
        const delayDays = Math.max(0, getDaysDiff(delayedDate, po.expected_arrival));
        if (delayDays > 0) {
          delayedInboundPOs.push({
            ...po,
            originalExpected: po.expected_arrival,
            delayedExpected: delayedDate,
            delayDays,
          });
        }
      }
    }
  }

  // 3. Factory Material Consumption & Days of Cover
  // Factory material daily use = sum of (Production_Rate of product * BOM qty per piece)
  const factoryDailyUse: Record<string, Record<string, number>> = {};
  for (const loc of snapshot.locations.filter((l) => l.type === 'Factory')) {
    factoryDailyUse[loc.location_id] = {};
    for (const mat of snapshot.materials) {
      factoryDailyUse[loc.location_id][mat.material_id] = 0;
    }
  }

  for (const pr of snapshot.productionRates) {
    if (factoryDailyUse[pr.factory_id]) {
      const bomsForProduct = snapshot.bom.filter((b) => b.product_id === pr.product_id);
      for (const b of bomsForProduct) {
        factoryDailyUse[pr.factory_id][b.material_id] =
          (factoryDailyUse[pr.factory_id][b.material_id] || 0) + pr.daily_qty * b.qty_per_piece;
      }
    }
  }

  const factoryStockProjections: DisruptionImpact['factoryStockProjections'] = {};
  const nodeStatuses: Record<string, 'healthy' | 'atRisk' | 'disrupted'> = {};

  // Initialize node statuses
  for (const s of snapshot.suppliers) nodeStatuses[s.supplier_id] = 'healthy';
  for (const l of snapshot.locations) nodeStatuses[l.location_id] = 'healthy';
  for (const c of snapshot.customers) nodeStatuses[c.customer_id] = 'healthy';

  if (disruptedSupplier) {
    nodeStatuses[disruptedSupplier.supplier_id] = 'disrupted';
  }

  // Project factory inventory day by day for 60 days
  for (const factory of snapshot.locations.filter((l) => l.type === 'Factory')) {
    factoryStockProjections[factory.location_id] = {};

    for (const mat of snapshot.materials) {
      const invRecord = snapshot.inventory.find(
        (i) =>
          i.location_id === factory.location_id &&
          i.item_type === 'Material' &&
          i.item_id === mat.material_id
      );
      const startingStock = invRecord ? invRecord.quantity : 0;
      const dailyUse = factoryDailyUse[factory.location_id]?.[mat.material_id] || 0;

      let currentBalance = startingStock;
      let daysOfCover = dailyUse > 0 ? startingStock / dailyUse : 999;
      let stockoutDate: string | null = null;

      // Simulate day by day
      let simDate = now;
      for (let day = 0; day < 60; day++) {
        const simDateStr = addDaysToDate(nowStr, day);
        // Add receipts on this date
        const incomingPOs = snapshot.inboundPOs.filter((po) => {
          if (
            po.to_factory === factory.location_id &&
            po.material_id === mat.material_id &&
            po.status !== 'Received'
          ) {
            // Check if delayed
            const delayed = delayedInboundPOs.find((d) => d.po_id === po.po_id);
            const arrival = delayed ? delayed.delayedExpected : po.expected_arrival;
            return arrival === simDateStr;
          }
          return false;
        });

        for (const inc of incomingPOs) {
          currentBalance += inc.quantity;
        }

        currentBalance -= dailyUse;
        if (currentBalance <= 0 && stockoutDate === null) {
          stockoutDate = simDateStr;
          daysOfCover = day;
          break;
        }
      }

      factoryStockProjections[factory.location_id][mat.material_id] = {
        currentStock: startingStock,
        dailyUse,
        daysOfCover: Math.round(daysOfCover * 10) / 10,
        stockoutDate,
        unit: mat.unit,
      };

      // If affected material stockout is within outage window, flag factory
      if (affectedMaterialIds.has(mat.material_id)) {
        if (daysOfCover < outageDuration) {
          nodeStatuses[factory.location_id] = 'disrupted';
        } else if (daysOfCover < outageDuration + 4) {
          if (nodeStatuses[factory.location_id] !== 'disrupted') {
            nodeStatuses[factory.location_id] = 'atRisk';
          }
        }
      }
    }
  }

  // 4. DC and Store Outflow Projections
  const dcStockProjections: DisruptionImpact['dcStockProjections'] = {};
  for (const dc of snapshot.locations.filter((l) => l.type === 'Distribution Centre')) {
    dcStockProjections[dc.location_id] = {};
    for (const prd of snapshot.products) {
      const invRecord = snapshot.inventory.find(
        (i) =>
          i.location_id === dc.location_id &&
          i.item_type === 'Product' &&
          i.item_id === prd.product_id
      );
      const stock = invRecord ? invRecord.quantity : 0;
      const outflow = invRecord?.daily_outflow || 100;
      const daysOfCover = outflow > 0 ? stock / outflow : 999;
      const stockoutDate =
        daysOfCover < 60 ? addDaysToDate(nowStr, Math.floor(daysOfCover)) : null;

      dcStockProjections[dc.location_id][prd.product_id] = {
        currentStock: stock,
        dailyOutflow: outflow,
        daysOfCover: Math.round(daysOfCover * 10) / 10,
        stockoutDate,
        unit: 'pcs',
      };
    }
  }

  // 5. Evaluate Orders: Safe vs Delayed vs Penalties
  const affectedOrders: AffectedOrder[] = [];
  let slaBreachesCount = 0;
  let lateOrdersCount = 0;
  let protectedOrdersCount = 0;
  let totalPenaltyINR = 0;
  let totalMoneyAtRiskINR = 0;

  for (const order of snapshot.orders) {
    const customer = snapshot.customers.find((c) => c.customer_id === order.customer_id)!;
    const product = snapshot.products.find((p) => p.product_id === order.product_id)!;
    const orderStages = snapshot.orderStages.filter((s) => s.order_id === order.order_id);
    const evaluatedProgress = evaluateOrderStages(orderStages, now);

    const orderValueINR = order.quantity * order.unit_price_inr;
    const isMaterialSafe = evaluatedProgress.isMaterialReceivedDone;

    // Check BOM materials needed for this order
    const orderBoms = snapshot.bom.filter((b) => b.product_id === order.product_id);
    const usesAffectedMaterial = orderBoms.some((b) => affectedMaterialIds.has(b.material_id));

    let status: OrderStatus = 'On track';
    let projectedDeliveryDate = order.promised_date;
    let delayDays = 0;
    let penaltyINR = 0;

    // RULE: If "Material received" stage is already Done, order is SAFE!
    if (isMaterialSafe || !usesAffectedMaterial) {
      status = 'On track';
      protectedOrdersCount++;
    } else {
      // Order needs affected material that hasn't arrived
      // Check if PO for this order is delayed or factory stocks out
      const linkedDelayedPO = delayedInboundPOs.find((p) => p.linked_order === order.order_id);
      const factoryCover =
        factoryStockProjections[order.factory_id]?.[orderBoms[0]?.material_id]?.daysOfCover ?? 999;

      let effectiveDelay = 0;
      if (linkedDelayedPO) {
        effectiveDelay = linkedDelayedPO.delayDays;
      } else if (factoryCover < outageDuration) {
        effectiveDelay = Math.max(0, outageDuration - Math.floor(factoryCover));
      }

      if (effectiveDelay > 0) {
        delayDays = effectiveDelay;
        projectedDeliveryDate = addDaysToDate(order.promised_date, delayDays);

        if (isDateAfter(projectedDeliveryDate, order.promised_date)) {
          status = 'Will be late';
          lateOrdersCount++;
          slaBreachesCount++;

          // Penalty = order value x customer penalty % / 100 x late days
          const dailyPenaltyPct = (customer?.late_penalty_pct_per_day || 1) / 100;
          penaltyINR = Math.round(orderValueINR * dailyPenaltyPct * delayDays);
          totalPenaltyINR += penaltyINR;
          totalMoneyAtRiskINR += orderValueINR;

          // Mark downstream nodes as disrupted/atRisk
          nodeStatuses[order.dc_id] = 'atRisk';
          nodeStatuses[order.store_id] = 'disrupted';
          nodeStatuses[customer.customer_id] = 'disrupted';
        } else {
          status = 'At risk';
          nodeStatuses[order.store_id] = 'atRisk';
        }
      } else {
        protectedOrdersCount++;
      }
    }

    // Trace dependency path
    const dependencyPath = [
      disruption.supplier_id,
      orderBoms[0]?.material_id || 'MAT-01',
      order.factory_id,
      order.dc_id,
      order.store_id,
      order.customer_id,
    ];

    affectedOrders.push({
      order,
      customer,
      product,
      status,
      originalPromisedDate: order.promised_date,
      projectedDeliveryDate,
      delayDays,
      orderValueINR,
      penaltyINR,
      stages: evaluatedProgress.stages,
      dependencyPath,
      isMaterialSafe,
    });
  }

  // Construct impact story sentence
  const primaryMaterial = affectedMaterials[0]?.name || 'raw material';
  const supplierName = disruptedSupplier?.name || disruption.supplier_id;
  const impactStory =
    lateOrdersCount > 0
      ? `${supplierName} outage halts ${primaryMaterial}. Up to ${lateOrdersCount} orders across ${slaBreachesCount} customer delivery windows face SLA breach with INR ${totalPenaltyINR.toLocaleString('en-IN')} in potential late penalties.`
      : `${supplierName} outage impacts ${primaryMaterial}, but existing factory buffers protect near-term customer order commitments.`;

  return {
    disruptedSupplier,
    disruption,
    affectedMaterials,
    delayedInboundPOs,
    factoryStockProjections,
    dcStockProjections,
    affectedOrders,
    nodeStatuses,
    slaBreachesCount,
    totalOrdersCount: snapshot.orders.length,
    lateOrdersCount,
    protectedOrdersCount,
    totalPenaltyINR,
    totalMoneyAtRiskINR,
    recoveryDaysNeeded: outageDuration + 4,
    impactStory,
  };
}
