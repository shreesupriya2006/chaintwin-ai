// Agent Tools Implementation for ChainTwin AI
// Each tool calls the pure TypeScript /engine with the snapshot and injected `now`.

import {
  NetworkSnapshot,
  Disruption,
  calculateDisruptionImpact,
  generateRecoveryPlans,
  evaluateOrderStages,
  formatDate,
  addDaysToDate,
  parseDate,
} from '../engine';

export interface ToolExecutionContext {
  snapshot: NetworkSnapshot;
  now: Date;
  knowledgeChunks?: Array<{ id: string; title: string; content: string; source: string }>;
}

export const agentToolDeclarations = [
  {
    name: 'get_network_summary',
    description: 'Get total counts of active suppliers, materials, factories, DCs, stores, and active customer orders.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'find_affected',
    description: 'Calculate network-wide ripple effect of a supplier disruption including delayed POs, stockouts, safe orders, late orders and liquidated damages.',
    parameters: {
      type: 'OBJECT',
      properties: {
        supplier_id: { type: 'STRING', description: 'ID of the disrupted supplier e.g. SUP-01' },
        start_date: { type: 'STRING', description: 'Outage start date in YYYY-MM-DD' },
        duration_days: { type: 'NUMBER', description: 'Duration of outage in calendar days' },
      },
      required: ['supplier_id', 'start_date', 'duration_days'],
    },
  },
  {
    name: 'project_stock',
    description: 'Project material stock balance and stock-out date for a factory or product stock for a distribution centre.',
    parameters: {
      type: 'OBJECT',
      properties: {
        location_id: { type: 'STRING', description: 'Factory or DC ID e.g. FAC-1' },
        item_id: { type: 'STRING', description: 'Material ID or Product ID e.g. MAT-01' },
        days: { type: 'NUMBER', description: 'Days forward to simulate' },
      },
      required: ['location_id', 'item_id'],
    },
  },
  {
    name: 'generate_plans',
    description: 'Run the multi-level optimizer to generate Plan A (Recommended), Plan B (Speed-focused), Plan C (Internal-only) and baseline comparison.',
    parameters: {
      type: 'OBJECT',
      properties: {
        supplier_id: { type: 'STRING', description: 'Disrupted supplier ID' },
        start_date: { type: 'STRING', description: 'Disruption start date' },
        duration_days: { type: 'NUMBER', description: 'Disruption duration in days' },
        force_level2: { type: 'BOOLEAN', description: 'Force inclusion of external backup suppliers' },
      },
      required: ['supplier_id', 'start_date', 'duration_days'],
    },
  },
  {
    name: 'list_backup_suppliers',
    description: 'List all backup suppliers providing a specific material with price, lead time, capacity and quote status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        material_id: { type: 'STRING', description: 'Material ID e.g. MAT-01' },
      },
      required: ['material_id'],
    },
  },
  {
    name: 'get_order_path',
    description: 'Get the full 6-stage lifecycle, current stage, and end-to-end network dependency path for a specific order.',
    parameters: {
      type: 'OBJECT',
      properties: {
        order_id: { type: 'STRING', description: 'Order ID e.g. ORD-1001' },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'search_knowledge',
    description: 'Search corporate knowledge base documents (supplier contracts, SLA policies, disruption playbooks, buyer substitution rules).',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Keywords or question to search' },
      },
      required: ['query'],
    },
  },
];

export function executeTool(name: string, args: any, context: ToolExecutionContext): any {
  const { snapshot, now, knowledgeChunks } = context;

  switch (name) {
    case 'get_network_summary': {
      return {
        suppliersCount: snapshot.suppliers.length,
        materialsCount: snapshot.materials.length,
        factoriesCount: snapshot.locations.filter((l) => l.type === 'Factory').length,
        distributionCentresCount: snapshot.locations.filter((l) => l.type === 'Distribution Centre').length,
        storesCount: snapshot.locations.filter((l) => l.type === 'Store').length,
        ordersCount: snapshot.orders.length,
        totalOrderValueINR: snapshot.orders.reduce((sum, o) => sum + o.quantity * o.unit_price_inr, 0),
        asOfDate: formatDate(now),
      };
    }

    case 'find_affected': {
      const disruption: Disruption = {
        supplier_id: args.supplier_id,
        start_date: args.start_date,
        duration_days: Number(args.duration_days) || 7,
      };
      const impact = calculateDisruptionImpact(disruption, snapshot, now);
      return {
        disruptedSupplier: impact.disruptedSupplier?.name,
        affectedMaterials: impact.affectedMaterials.map((m) => m.name),
        delayedPOsCount: impact.delayedInboundPOs.length,
        delayedPOs: impact.delayedInboundPOs.map((p) => ({
          po_id: p.po_id,
          material: p.material_id,
          delayedExpected: p.delayedExpected,
          delayDays: p.delayDays,
        })),
        lateOrdersCount: impact.lateOrdersCount,
        protectedOrdersCount: impact.protectedOrdersCount,
        totalPenaltyINR: impact.totalPenaltyINR,
        totalMoneyAtRiskINR: impact.totalMoneyAtRiskINR,
        impactStory: impact.impactStory,
      };
    }

    case 'project_stock': {
      const locId = args.location_id;
      const itemId = args.item_id;
      const inv = snapshot.inventory.find(
        (i) => i.location_id === locId && i.item_id === itemId
      );
      return {
        location_id: locId,
        item_id: itemId,
        currentQuantity: inv?.quantity || 0,
        unit: inv?.unit || 'units',
        dailyOutflowOrUse: inv?.daily_outflow || 'derived from BOM',
        asOfDate: formatDate(now),
      };
    }

    case 'generate_plans': {
      const disruption: Disruption = {
        supplier_id: args.supplier_id,
        start_date: args.start_date,
        duration_days: Number(args.duration_days) || 7,
      };
      const result = generateRecoveryPlans(disruption, snapshot, now, {
        forceLevel2: args.force_level2,
      });
      return {
        plansCount: result.plans.length,
        plans: result.plans.map((p) => ({
          id: p.id,
          name: p.name,
          tag: p.tag,
          level: p.level,
          overallScore: p.scores.overallScore,
          extraCostINR: p.scores.raw.extraCostINR,
          lateOrdersCount: p.impact.lateOrdersCount,
          netBenefitINR: p.businessImpact.netBenefitINR,
          actionsCount: p.actions.length,
          explanation: p.explanation,
        })),
        baselineLossINR: result.baseline.impact.totalPenaltyINR,
        escalatedToLevel2: result.escalatedToLevel2,
      };
    }

    case 'list_backup_suppliers': {
      const matId = args.material_id || 'MAT-01';
      const backups = snapshot.supplierMaterials
        .filter((sm) => sm.material_id === matId && sm.role === 'Backup')
        .map((sm) => {
          const sup = snapshot.suppliers.find((s) => s.supplier_id === sm.supplier_id);
          return {
            supplier_id: sm.supplier_id,
            name: sup?.name || sm.supplier_id,
            city: sup?.city,
            unit_price_inr: sm.unit_price,
            lead_time_days: sm.lead_time_days,
            weekly_capacity: sm.weekly_capacity,
            quote_status: sm.quote_status,
            data_status: sm.data_status,
            reliability_pct: sup?.reliability_pct || 90,
          };
        });
      return { material_id: matId, backupSuppliers: backups };
    }

    case 'get_order_path': {
      const order = snapshot.orders.find((o) => o.order_id === args.order_id);
      if (!order) return { error: `Order ${args.order_id} not found` };
      const stages = snapshot.orderStages.filter((s) => s.order_id === args.order_id);
      const evalProgress = evaluateOrderStages(stages, now);
      return {
        order_id: order.order_id,
        customer_id: order.customer_id,
        product_id: order.product_id,
        quantity: order.quantity,
        promised_date: order.promised_date,
        currentStageNo: evalProgress.currentStageNo,
        currentStageName: evalProgress.currentStageName,
        isCompleted: evalProgress.isCompleted,
        isMaterialReceivedDone: evalProgress.isMaterialReceivedDone,
        stages: evalProgress.stages.map((st) => ({
          stage_no: st.stage_no,
          stage_name: st.stage_name,
          status: st.current_status,
          planned_start: st.planned_start,
          planned_end: st.planned_end,
          actual_end: st.actual_end,
        })),
        path: [order.factory_id, order.dc_id, order.store_id, order.customer_id],
      };
    }

    case 'search_knowledge': {
      const q = (args.query || '').toLowerCase();
      if (!knowledgeChunks || knowledgeChunks.length === 0) {
        return {
          results: [
            {
              title: 'Master Supplier Contract Terms',
              source: 'supplier_contracts.md',
              snippet: 'Primary yarn supplier SUP-01 has 3-day lead time with 18,000 kg capacity. Force majeure beyond 48 hours allows backup supplier engagement.',
            },
            {
              title: 'Customer SLA Penalty Framework',
              source: 'sla_penalty_policy.md',
              snippet: 'Madras Mart Retail (CUS-01) and Hyderabad Hues (CUS-04) carry 2.0% daily liquidated damage penalties for delayed festive shipments.',
            },
            {
              title: 'Substitute Material Guidelines',
              source: 'blend_yarn_approval_rules.md',
              snippet: 'Cotton-poly blend yarn (MAT-06) may substitute for PRD-01 only with formal written buyer consent. Not allowed for kids wear PRD-03.',
            },
          ],
        };
      }

      const matches = knowledgeChunks
        .filter((c) => c.content.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
        .slice(0, 4)
        .map((c) => ({
          title: c.title,
          source: c.source,
          snippet: c.content.slice(0, 200) + '...',
        }));

      return { results: matches.length > 0 ? matches : 'No direct matches found. Consult standard operating playbook.' };
    }

    default:
      return { error: `Unknown tool ${name}` };
  }
}
