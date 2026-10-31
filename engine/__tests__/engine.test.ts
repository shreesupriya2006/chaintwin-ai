// Unit Tests for ChainTwin AI Pure TypeScript Engine (Vitest)
import { describe, it, expect } from 'vitest';
import {
  NetworkSnapshot,
  Disruption,
  calculateDisruptionImpact,
  generateRecoveryPlans,
  evaluateOrderStages,
  rebaseSnapshotDates,
  parseDate,
} from '../index';

// Minimal synthetic test snapshot matching the schema
const sampleSnapshot: NetworkSnapshot = {
  settings: [
    { key: 'as_of_date', value: '2026-10-31', description: 'Snapshot date', data_status: 'Known' },
    { key: 'currency', value: 'INR', description: 'Currency', data_status: 'Known' },
    { key: 'loss_limit_money_inr', value: '500000', description: 'Loss limit', data_status: 'Known' },
    { key: 'loss_limit_late_orders', value: '2', description: 'Late orders limit', data_status: 'Known' },
    { key: 'loss_limit_no_high_priority_late', value: 'TRUE', description: 'No high pri late', data_status: 'Known' },
    { key: 'weight_cost', value: '0.25', description: 'Cost weight', data_status: 'Known' },
    { key: 'weight_sla', value: '0.25', description: 'SLA weight', data_status: 'Known' },
    { key: 'weight_recovery_time', value: '0.15', description: 'Recovery weight', data_status: 'Known' },
    { key: 'weight_customer_impact', value: '0.15', description: 'Customer weight', data_status: 'Known' },
    { key: 'weight_risk', value: '0.1', description: 'Risk weight', data_status: 'Known' },
    { key: 'weight_sustainability', value: '0.1', description: 'CO2 weight', data_status: 'Known' },
  ],
  suppliers: [
    {
      supplier_id: 'SUP-01',
      name: 'Sri Kumaran Spinning Mills',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      type: 'Primary',
      contact_person: 'Ravi Shankar',
      contact_email: 'sales@srikumaran.example',
      reliability_pct: 94,
      reliability_basis: 'Delivery history',
      distance_to_tiruppur_km: 50,
    },
    {
      supplier_id: 'SUP-06',
      name: 'Erode Cotton Yarns Pvt Ltd',
      city: 'Erode',
      state: 'Tamil Nadu',
      type: 'Backup',
      contact_person: 'S. Murugan',
      contact_email: 'sales@erode-yarns.example',
      reliability_pct: 91,
      reliability_basis: 'Assumption',
      distance_to_tiruppur_km: 55,
    },
  ],
  materials: [
    { material_id: 'MAT-01', name: 'Cotton Yarn 30s Combed', unit: 'kg', category: 'Raw material', note: 'Main yarn' },
  ],
  supplierMaterials: [
    {
      supplier_id: 'SUP-01',
      material_id: 'MAT-01',
      role: 'Primary',
      unit_price: 265,
      price_unit: 'INR per kg',
      lead_time_days: 3,
      weekly_capacity: 18000,
      capacity_unit: 'kg per week',
      quote_status: 'Contract',
      data_status: 'Known',
    },
    {
      supplier_id: 'SUP-06',
      material_id: 'MAT-01',
      role: 'Backup',
      unit_price: 278,
      price_unit: 'INR per kg',
      lead_time_days: 4,
      weekly_capacity: 8000,
      capacity_unit: 'kg per week',
      quote_status: 'Confirmed quote',
      data_status: 'Known',
    },
  ],
  products: [
    { product_id: 'PRD-01', name: "Men's Basic Tee", packed_weight_kg: 0.25, selling_price_inr: 145 },
  ],
  bom: [
    { product_id: 'PRD-01', material_id: 'MAT-01', qty_per_piece: 0.24 },
  ],
  locations: [
    { location_id: 'FAC-1', name: 'Tiruppur Unit 1', type: 'Factory', city: 'Tiruppur', state: 'Tamil Nadu', normal_capacity_pcs_per_day: 6000, max_capacity_pcs_per_day: 7500 },
    { location_id: 'FAC-2', name: 'Tiruppur Unit 2', type: 'Factory', city: 'Palladam', state: 'Tamil Nadu', normal_capacity_pcs_per_day: 4500, max_capacity_pcs_per_day: 5500 },
    { location_id: 'DC-CHN', name: 'Chennai DC', type: 'Distribution Centre', city: 'Chennai', state: 'Tamil Nadu' },
    { location_id: 'ST-01', name: 'Madras Mart Store', type: 'Store', city: 'Chennai', state: 'Tamil Nadu', customer_id: 'CUS-01' },
  ],
  productionRates: [
    { factory_id: 'FAC-1', product_id: 'PRD-01', daily_qty: 4000, from_date: '2026-10-26', to_date: '2026-11-30' },
  ],
  inventory: [
    { location_id: 'FAC-1', item_type: 'Material', item_id: 'MAT-01', quantity: 8800, unit: 'kg', as_of_date: '2026-10-31' },
    { location_id: 'FAC-2', item_type: 'Material', item_id: 'MAT-01', quantity: 5100, unit: 'kg', as_of_date: '2026-10-31' },
    { location_id: 'DC-CHN', item_type: 'Product', item_id: 'PRD-01', quantity: 6000, unit: 'pcs', daily_outflow: 900, as_of_date: '2026-10-31' },
  ],
  customers: [
    { customer_id: 'CUS-01', name: 'Madras Mart Retail', city: 'Chennai', priority: 'High', late_penalty_pct_per_day: 2, note: 'Festive season delivery' },
  ],
  orders: [
    {
      order_id: 'ORD-1001',
      customer_id: 'CUS-01',
      store_id: 'ST-01',
      dc_id: 'DC-CHN',
      factory_id: 'FAC-1',
      product_id: 'PRD-01',
      quantity: 12000,
      unit_price_inr: 145,
      order_date: '2026-10-05',
      promised_date: '2026-11-07',
    },
    {
      order_id: 'ORD-1003',
      customer_id: 'CUS-01',
      store_id: 'ST-01',
      dc_id: 'DC-CHN',
      factory_id: 'FAC-1',
      product_id: 'PRD-01',
      quantity: 15000,
      unit_price_inr: 145,
      order_date: '2026-10-12',
      promised_date: '2026-11-14',
    },
  ],
  orderStages: [
    // ORD-1001: Stage 2 (Material received) is ALREADY Done -> MUST BE SAFE!
    { order_id: 'ORD-1001', stage_no: 1, stage_name: 'Supplier dispatch', planned_start: '2026-10-08', planned_end: '2026-10-09', actual_end: '2026-10-09', status_as_of_file: 'Done' },
    { order_id: 'ORD-1001', stage_no: 2, stage_name: 'Material received', planned_start: '2026-10-10', planned_end: '2026-10-11', actual_end: '2026-10-11', status_as_of_file: 'Done' },
    { order_id: 'ORD-1001', stage_no: 3, stage_name: 'Production', planned_start: '2026-10-23', planned_end: '2026-11-02', status_as_of_file: 'In progress' },
    { order_id: 'ORD-1001', stage_no: 4, stage_name: 'At distribution centre', planned_start: '2026-11-03', planned_end: '2026-11-04', status_as_of_file: 'Waiting' },
    { order_id: 'ORD-1001', stage_no: 5, stage_name: 'At store', planned_start: '2026-11-05', planned_end: '2026-11-05', status_as_of_file: 'Waiting' },
    { order_id: 'ORD-1001', stage_no: 6, stage_name: 'Delivered to customer', planned_start: '2026-11-06', planned_end: '2026-11-06', status_as_of_file: 'Waiting' },

    // ORD-1003: Stage 2 is NOT Done -> Will be affected if PO delayed!
    { order_id: 'ORD-1003', stage_no: 1, stage_name: 'Supplier dispatch', planned_start: '2026-10-30', planned_end: '2026-11-02', status_as_of_file: 'In progress' },
    { order_id: 'ORD-1003', stage_no: 2, stage_name: 'Material received', planned_start: '2026-11-03', planned_end: '2026-11-03', status_as_of_file: 'Waiting' },
    { order_id: 'ORD-1003', stage_no: 3, stage_name: 'Production', planned_start: '2026-11-04', planned_end: '2026-11-09', status_as_of_file: 'Waiting' },
    { order_id: 'ORD-1003', stage_no: 4, stage_name: 'At distribution centre', planned_start: '2026-11-10', planned_end: '2026-11-11', status_as_of_file: 'Waiting' },
    { order_id: 'ORD-1003', stage_no: 5, stage_name: 'At store', planned_start: '2026-11-12', planned_end: '2026-11-12', status_as_of_file: 'Waiting' },
    { order_id: 'ORD-1003', stage_no: 6, stage_name: 'Delivered to customer', planned_start: '2026-11-13', planned_end: '2026-11-13', status_as_of_file: 'Waiting' },
  ],
  inboundPOs: [
    { po_id: 'PO-Y-1001', supplier_id: 'SUP-01', material_id: 'MAT-01', quantity: 2880, unit: 'kg', to_factory: 'FAC-1', po_date: '2026-10-06', expected_arrival: '2026-10-10', status: 'Received', linked_order: 'ORD-1001', data_status: 'Known' },
    { po_id: 'PO-Y-1003', supplier_id: 'SUP-01', material_id: 'MAT-01', quantity: 3600, unit: 'kg', to_factory: 'FAC-1', po_date: '2026-10-26', expected_arrival: '2026-11-03', status: 'In transit', linked_order: 'ORD-1003', data_status: 'Known' },
  ],
  routes: [
    { route_id: 'RT-01', from_id: 'FAC-1', to_id: 'DC-CHN', mode: 'Road', distance_km: 440, transit_days: 2, cost_per_tonne_inr: 1540, co2_kg_per_tonne: 33, status: 'Active', data_status: 'Known' },
  ],
  substitutes: [],
};

describe('ChainTwin AI Calculation Engine', () => {
  const testNow = parseDate('2026-10-31');

  it('correctly evaluates order stage statuses against now', () => {
    const ord1001Stages = sampleSnapshot.orderStages.filter(s => s.order_id === 'ORD-1001');
    const progress = evaluateOrderStages(ord1001Stages, testNow);

    expect(progress.isMaterialReceivedDone).toBe(true);
    expect(progress.stages.find(s => s.stage_no === 1)?.current_status).toBe('Done');
    expect(progress.stages.find(s => s.stage_no === 2)?.current_status).toBe('Done');
    expect(progress.stages.find(s => s.stage_no === 3)?.current_status).toBe('In progress');
  });

  it('rebases snapshot dates forward accurately', () => {
    const futureDate = parseDate('2026-11-10'); // 10 days shift
    const rebased = rebaseSnapshotDates(sampleSnapshot, futureDate);

    const asOf = rebased.settings.find(s => s.key === 'as_of_date')?.value;
    expect(asOf).toBe('2026-11-10');

    const po1 = rebased.inboundPOs.find(p => p.po_id === 'PO-Y-1001');
    expect(po1?.expected_arrival).toBe('2026-10-20'); // 2026-10-10 + 10 days
  });

  it('calculates disruption impact accurately and respects safe order rule', () => {
    const disruption: Disruption = {
      supplier_id: 'SUP-01',
      start_date: '2026-11-01',
      duration_days: 10,
      capacity_loss_pct: 100,
    };

    const impact = calculateDisruptionImpact(disruption, sampleSnapshot, testNow);

    // Affected supplier
    expect(impact.disruptedSupplier?.supplier_id).toBe('SUP-01');
    expect(impact.affectedMaterials[0]?.material_id).toBe('MAT-01');

    // ORD-1001 has Material received Done -> MUST BE SAFE!
    const ord1001 = impact.affectedOrders.find(o => o.order.order_id === 'ORD-1001');
    expect(ord1001?.isMaterialSafe).toBe(true);
    expect(ord1001?.status).toBe('On track');

    // ORD-1003 has pending inbound PO PO-Y-1003 delayed -> WILL BE LATE!
    const ord1003 = impact.affectedOrders.find(o => o.order.order_id === 'ORD-1003');
    expect(ord1003?.isMaterialSafe).toBe(false);
    expect(ord1003?.status).toBe('Will be late');
    expect(ord1003?.delayDays).toBeGreaterThan(0);
    expect(ord1003?.penaltyINR).toBeGreaterThan(0);

    // Nodes marked properly
    expect(impact.nodeStatuses['SUP-01']).toBe('disrupted');
  });

  it('generates diverse recovery plans with scores and business impact', () => {
    const disruption: Disruption = {
      supplier_id: 'SUP-01',
      start_date: '2026-11-01',
      duration_days: 10,
    };

    const { plans, baseline, escalatedToLevel2 } = generateRecoveryPlans(disruption, sampleSnapshot, testNow);

    expect(plans.length).toBeGreaterThanOrEqual(3);
    expect(baseline.id).toBe('plan-baseline');

    const planA = plans.find(p => p.id === 'plan-a');
    expect(planA).toBeDefined();
    expect(planA?.tag).toBe('Uses backup supplier');
    expect(planA?.businessImpact.netBenefitINR).toBeDefined();
    expect(planA?.scores.overallScore).toBeGreaterThanOrEqual(0);
  });
});
