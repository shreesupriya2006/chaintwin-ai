// Order Stage Progress & Overdue Stage Evaluation (Pure TypeScript)

import { OrderStage, StageStatus, EarlyWarningAlert, InboundPO, InventoryItem } from './types';
import { formatDate, isDateBefore, isDateAfter, isDateOnOrBefore, getDaysDiff } from './clock';

export interface EvaluatedOrderStage extends OrderStage {
  current_status: StageStatus;
  is_overdue: boolean;
  unconfirmed: boolean;
  daysLate: number;
}

export interface EvaluatedOrderProgress {
  orderId: string;
  currentStageNo: number;
  currentStageName: string;
  isCompleted: boolean;
  hasOverdueStage: boolean;
  stages: EvaluatedOrderStage[];
  isMaterialReceivedDone: boolean;
}

/**
 * Computes the real-time stage status of an order against the injected `now`.
 */
export function evaluateOrderStages(stages: OrderStage[], now: Date): EvaluatedOrderProgress {
  if (!stages || stages.length === 0) {
    return {
      orderId: '',
      currentStageNo: 1,
      currentStageName: 'Supplier dispatch',
      isCompleted: false,
      hasOverdueStage: false,
      stages: [],
      isMaterialReceivedDone: false,
    };
  }

  const sortedStages = [...stages].sort((a, b) => a.stage_no - b.stage_no);
  const nowStr = formatDate(now);
  const orderId = sortedStages[0].order_id;

  let previousStageDone = true;
  let hasOverdueStage = false;
  let currentStageNo = 6;
  let currentStageName = sortedStages[sortedStages.length - 1].stage_name;
  let foundCurrent = false;

  const evaluatedStages: EvaluatedOrderStage[] = sortedStages.map((st) => {
    let status: StageStatus = 'Waiting';
    let isOverdue = false;
    let unconfirmed = false;
    let daysLate = 0;

    // Check if explicitly marked Done in actual data
    if (st.actual_end || st.status_as_of_file === 'Done') {
      status = 'Done';
      previousStageDone = true;
    } else {
      // Evaluate status based on dates
      if (isDateBefore(nowStr, st.planned_start)) {
        status = 'Waiting';
      } else if (isDateOnOrBefore(nowStr, st.planned_end)) {
        status = 'In progress';
      } else {
        // Current date is after planned_end and no actual_end
        status = 'In progress';
        isOverdue = true;
        unconfirmed = true;
        hasOverdueStage = true;
        daysLate = Math.max(0, getDaysDiff(nowStr, st.planned_end));
      }

      if (!foundCurrent) {
        currentStageNo = st.stage_no;
        currentStageName = st.stage_name;
        foundCurrent = true;
      }
      previousStageDone = false;
    }

    return {
      ...st,
      current_status: status,
      is_overdue: isOverdue,
      unconfirmed,
      daysLate,
    };
  });

  const isCompleted = evaluatedStages.every((s) => s.current_status === 'Done');
  const matReceivedStage = evaluatedStages.find((s) => s.stage_no === 2);
  const isMaterialReceivedDone = matReceivedStage?.current_status === 'Done';

  return {
    orderId,
    currentStageNo: isCompleted ? 6 : currentStageNo,
    currentStageName: isCompleted ? 'Delivered to customer' : currentStageName,
    isCompleted,
    hasOverdueStage,
    stages: evaluatedStages,
    isMaterialReceivedDone,
  };
}

/**
 * Scans POs, Stages and Inventory to detect early-warning signals for the plant manager.
 * Signals are MANAGER-CONFIRMED — the AI alerts, the manager confirms.
 */
export function detectEarlyWarningSignals(
  inboundPOs: InboundPO[],
  orderStages: OrderStage[],
  inventory: InventoryItem[],
  stockCoverWarningDays: number = 3,
  now: Date
): EarlyWarningAlert[] {
  const alerts: EarlyWarningAlert[] = [];
  const nowStr = formatDate(now);

  // 1. Detect Overdue Inbound Purchase Orders
  for (const po of inboundPOs) {
    if (po.status !== 'Received' && isDateAfter(nowStr, po.expected_arrival)) {
      const overdueDays = Math.max(1, getDaysDiff(nowStr, po.expected_arrival));
      alerts.push({
        id: `alert-po-${po.po_id}`,
        type: 'overdue_po',
        severity: overdueDays >= 3 ? 'critical' : 'warning',
        title: `Overdue PO: ${po.po_id} (${po.material_id})`,
        message: `Inbound PO ${po.po_id} from ${po.supplier_id} was expected on ${po.expected_arrival} (${overdueDays} days overdue). Possible supplier disruption signal.`,
        timestamp: new Date(now).toISOString(),
        suggestedDisruption: {
          supplier_id: po.supplier_id,
          start_date: po.expected_arrival,
          duration_days: Math.max(7, overdueDays + 5),
          capacity_loss_pct: 100,
          material_id: po.material_id,
        },
      });
    }
  }

  // 2. Detect Overdue Order Stages Needing Confirmation
  const stagesByOrder: Record<string, OrderStage[]> = {};
  for (const st of orderStages) {
    if (!stagesByOrder[st.order_id]) stagesByOrder[st.order_id] = [];
    stagesByOrder[st.order_id].push(st);
  }

  for (const orderId in stagesByOrder) {
    const evaluated = evaluateOrderStages(stagesByOrder[orderId], now);
    for (const st of evaluated.stages) {
      if (st.is_overdue && st.unconfirmed) {
        alerts.push({
          id: `alert-stage-${orderId}-${st.stage_no}`,
          type: 'overdue_stage',
          severity: 'warning',
          title: `Confirmation Needed: ${orderId} - ${st.stage_name}`,
          message: `${st.stage_name} for order ${orderId} was planned to end on ${st.planned_end}. Has it been completed?`,
          timestamp: new Date(now).toISOString(),
          stageAction: {
            order_id: orderId,
            stage_no: st.stage_no,
            stage_name: st.stage_name,
          },
        });
      }
    }
  }

  return alerts;
}
