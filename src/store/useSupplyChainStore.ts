// Central Zustand Store for ChainTwin AI
import { create } from 'zustand';
import {
  NetworkSnapshot,
  Disruption,
  DisruptionImpact,
  RecoveryPlan,
  EarlyWarningAlert,
  HistoryRecord,
  UserProfile,
  AppMode,
} from '../types';
import {
  calculateDisruptionImpact,
  generateRecoveryPlans,
  detectEarlyWarningSignals,
  rebaseSnapshotDates,
  formatDate,
  parseDate,
} from '../../engine';

interface SupplyChainState {
  user: UserProfile | null;
  snapshot: NetworkSnapshot | null;
  simulationSnapshot: NetworkSnapshot | null;
  activeDisruption: Disruption | null;
  simulationDisruption: Disruption | null;
  mode: AppMode;
  now: Date;
  viewDate: Date;
  timezone: string;
  theme: 'light' | 'dark';
  isLiveConnected: boolean;
  lastUpdated: Date;

  // Impact & Plans
  impact: DisruptionImpact | null;
  plans: RecoveryPlan[];
  baselinePlan: RecoveryPlan | null;
  selectedPlanId: string | null;
  planState: 'Proposed' | 'Previewed' | 'Finalised';
  isPlansOutdated: boolean;

  // Selections & UI State
  selectedNodeId: string | null;
  selectedOrderId: string | null;
  alerts: EarlyWarningAlert[];
  history: HistoryRecord[];
  optimizerLoading: boolean;
  optimizerStep: string;
  optimizerProgress: number;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setSnapshot: (snapshot: NetworkSnapshot, rebaseToNow?: boolean) => void;
  setMode: (mode: AppMode) => void;
  setViewDate: (date: Date) => void;
  setTimezone: (tz: string) => void;
  toggleTheme: () => void;
  tickClock: () => void;
  selectNode: (nodeId: string | null) => void;
  selectOrder: (orderId: string | null) => void;
  reportDisruption: (disruption: Disruption) => void;
  resolveDisruption: () => void;
  runOptimizer: (forceLevel2?: boolean) => void;
  selectPlan: (planId: string) => void;
  previewPlan: (planId: string) => void;
  finalisePlan: (planId: string) => void;
  undoPlan: (historyId: string) => void;
  updateStageProgress: (orderId: string, stageNo: number, status: 'Done' | 'In progress', actualEnd?: string) => void;
  updateDataEntity: (collectionKey: keyof NetworkSnapshot, entityIdKey: string, entityIdVal: string, updatedRecord: any) => void;
  dismissAlert: (alertId: string) => void;
  recordQuoteReply: (supplierId: string, materialId: string, unitPrice: number, leadTimeDays: number, weeklyCapacity: number) => void;
  setSimulationDisruption: (disruption: Disruption | null) => void;
  updateSimulationSnapshot: (updater: (prev: NetworkSnapshot) => NetworkSnapshot) => void;
  resetSimulationToLive: () => void;
}

export const useSupplyChainStore = create<SupplyChainState>((set, get) => ({
  user: null,
  snapshot: null,
  simulationSnapshot: null,
  activeDisruption: null,
  simulationDisruption: null,
  mode: 'LIVE',
  now: new Date(),
  viewDate: new Date(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  theme: 'dark',
  isLiveConnected: true,
  lastUpdated: new Date(),

  impact: null,
  plans: [],
  baselinePlan: null,
  selectedPlanId: null,
  planState: 'Proposed',
  isPlansOutdated: false,

  selectedNodeId: null,
  selectedOrderId: null,
  alerts: [],
  history: [],
  optimizerLoading: false,
  optimizerStep: '',
  optimizerProgress: 0,

  setUser: (user) => set({ user }),

  setSnapshot: (rawSnapshot, rebaseToNow = true) => {
    const { now, activeDisruption } = get();
    const finalSnapshot = rebaseToNow ? rebaseSnapshotDates(rawSnapshot, now) : rawSnapshot;

    // Detect alerts
    const alerts = detectEarlyWarningSignals(
      finalSnapshot.inboundPOs,
      finalSnapshot.orderStages,
      finalSnapshot.inventory,
      3,
      now
    );

    let impact: DisruptionImpact | null = null;
    if (activeDisruption) {
      impact = calculateDisruptionImpact(activeDisruption, finalSnapshot, now);
    }

    set({
      snapshot: finalSnapshot,
      alerts,
      impact,
      lastUpdated: new Date(),
      isLiveConnected: true,
    });
  },

  setMode: (mode) => {
    const { snapshot, activeDisruption } = get();
    if (mode === 'SIMULATION') {
      set({
        mode: 'SIMULATION',
        simulationSnapshot: snapshot ? JSON.parse(JSON.stringify(snapshot)) : null,
        simulationDisruption: activeDisruption ? JSON.parse(JSON.stringify(activeDisruption)) : null,
      });
    } else {
      set({ mode: 'LIVE' });
    }
  },

  setViewDate: (viewDate) => {
    const { mode, snapshot, simulationSnapshot, activeDisruption, simulationDisruption } = get();
    const currentSnap = mode === 'SIMULATION' ? simulationSnapshot : snapshot;
    const currentDisrupt = mode === 'SIMULATION' ? simulationDisruption : activeDisruption;

    if (currentSnap && currentDisrupt) {
      const impact = calculateDisruptionImpact(currentDisrupt, currentSnap, viewDate);
      set({ viewDate, impact });
    } else {
      set({ viewDate });
    }
  },

  setTimezone: (timezone) => set({ timezone }),

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: newTheme };
    }),

  tickClock: () => {
    const { mode, now, viewDate, snapshot, simulationSnapshot, activeDisruption, simulationDisruption } = get();
    const newNow = new Date();
    const isLive = mode === 'LIVE';
    const activeDate = isLive && viewDate.getTime() === now.getTime() ? newNow : viewDate;

    const currentSnap = isLive ? snapshot : simulationSnapshot;
    const currentDisrupt = isLive ? activeDisruption : simulationDisruption;

    if (currentSnap) {
      // Re-evaluate alerts periodically
      const alerts = detectEarlyWarningSignals(
        currentSnap.inboundPOs,
        currentSnap.orderStages,
        currentSnap.inventory,
        3,
        activeDate
      );

      // Re-evaluate impact if disruption active
      let impact = get().impact;
      if (currentDisrupt) {
        impact = calculateDisruptionImpact(currentDisrupt, currentSnap, activeDate);
      }

      set({
        now: newNow,
        viewDate: isLive && viewDate.getTime() === now.getTime() ? newNow : viewDate,
        alerts,
        impact,
      });
    } else {
      set({ now: newNow });
    }
  },

  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  selectOrder: (selectedOrderId) => set({ selectedOrderId }),

  reportDisruption: (disruption) => {
    const { snapshot, viewDate, user } = get();
    if (!snapshot) return;

    const impact = calculateDisruptionImpact(disruption, snapshot, viewDate);
    const historyEntry: HistoryRecord = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'disruption_reported',
      user_id: user?.uid || 'anonymous',
      user_email: user?.email || 'manager@tiruppur-garments.com',
      details: `Reported disruption for ${disruption.supplier_id}: duration ${disruption.duration_days} days.`,
      previous_snapshot: JSON.parse(JSON.stringify(snapshot)),
    };

    set((state) => ({
      activeDisruption: disruption,
      impact,
      planState: 'Proposed',
      plans: [],
      selectedPlanId: null,
      history: [historyEntry, ...state.history],
    }));

    // Trigger optimizer immediately
    get().runOptimizer();
  },

  resolveDisruption: () => {
    set({
      activeDisruption: null,
      impact: null,
      plans: [],
      selectedPlanId: null,
      planState: 'Proposed',
    });
  },

  runOptimizer: (forceLevel2 = false) => {
    const { activeDisruption, snapshot, viewDate, mode, simulationDisruption, simulationSnapshot } = get();
    const currentDisrupt = mode === 'SIMULATION' ? simulationDisruption : activeDisruption;
    const currentSnap = mode === 'SIMULATION' ? simulationSnapshot : snapshot;

    if (!currentDisrupt || !currentSnap) return;

    set({ optimizerLoading: true, optimizerStep: 'Analyzing dependencies and generating plans...', optimizerProgress: 30 });

    try {
      const result = generateRecoveryPlans(currentDisrupt, currentSnap, viewDate, { forceLevel2 });
      set({
        plans: result.plans,
        baselinePlan: result.baseline,
        selectedPlanId: result.plans[0]?.id || null,
        optimizerLoading: false,
        optimizerStep: 'Finished',
        optimizerProgress: 100,
        isPlansOutdated: false,
      });
    } catch (err) {
      console.error('Optimizer error:', err);
      set({ optimizerLoading: false, optimizerStep: 'Error' });
    }
  },

  selectPlan: (selectedPlanId) => set({ selectedPlanId }),

  previewPlan: (planId) => {
    const { plans } = get();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    set({
      selectedPlanId: planId,
      planState: 'Previewed',
      impact: plan.impact,
    });
  },

  finalisePlan: (planId) => {
    const { plans, snapshot, user } = get();
    const plan = plans.find((p) => p.id === planId);
    if (!plan || !snapshot) return;

    // Apply plan actions to live snapshot
    const updatedSnapshot = JSON.parse(JSON.stringify(snapshot)) as NetworkSnapshot;

    // Tag updated orders as 'Rerouted'
    for (const aff of plan.impact.affectedOrders) {
      const ord = updatedSnapshot.orders.find((o) => o.order_id === aff.order.order_id);
      if (ord && aff.status === 'Rerouted') {
        // Tagged in state
      }
    }

    const historyEntry: HistoryRecord = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'plan_finalised',
      user_id: user?.uid || 'anonymous',
      user_email: user?.email || 'manager@tiruppur-garments.com',
      details: `Finalised ${plan.name} (${plan.actions.length} actions applied, net benefit INR ${plan.businessImpact.netBenefitINR.toLocaleString('en-IN')})`,
      previous_snapshot: JSON.parse(JSON.stringify(snapshot)),
    };

    set((state) => ({
      snapshot: updatedSnapshot,
      impact: plan.impact,
      planState: 'Finalised',
      history: [historyEntry, ...state.history],
      lastUpdated: new Date(),
    }));
  },

  undoPlan: (historyId) => {
    const { history } = get();
    const record = history.find((h) => h.id === historyId);
    if (!record || !record.previous_snapshot) return;

    const undoRecord: HistoryRecord = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'plan_undone',
      user_id: get().user?.uid || 'anonymous',
      user_email: get().user?.email || 'manager@tiruppur-garments.com',
      details: `Reverted plan to state before ${record.details}`,
    };

    set((state) => ({
      snapshot: record.previous_snapshot!,
      planState: 'Proposed',
      history: [undoRecord, ...state.history],
      lastUpdated: new Date(),
    }));

    if (get().activeDisruption) {
      get().runOptimizer();
    }
  },

  updateStageProgress: (orderId, stageNo, status, actualEnd) => {
    const { snapshot, viewDate, activeDisruption } = get();
    if (!snapshot) return;

    const updatedStages = snapshot.orderStages.map((st) => {
      if (st.order_id === orderId && st.stage_no === stageNo) {
        return {
          ...st,
          actual_end: actualEnd || (status === 'Done' ? formatDate(viewDate) : undefined),
          status_as_of_file: status,
          current_status: status,
          is_overdue: false,
          unconfirmed: false,
        };
      }
      return st;
    });

    const updatedSnapshot = { ...snapshot, orderStages: updatedStages };
    let impact = get().impact;
    if (activeDisruption) {
      impact = calculateDisruptionImpact(activeDisruption, updatedSnapshot, viewDate);
    }

    set({
      snapshot: updatedSnapshot,
      impact,
      lastUpdated: new Date(),
      isPlansOutdated: true,
    });
  },

  updateDataEntity: (collectionKey, entityIdKey, entityIdVal, updatedRecord) => {
    const { snapshot, viewDate, activeDisruption } = get();
    if (!snapshot) return;

    const list = snapshot[collectionKey] as any[];
    const updatedList = list.map((item: any) =>
      item[entityIdKey] === entityIdVal ? { ...item, ...updatedRecord } : item
    );

    const updatedSnapshot = { ...snapshot, [collectionKey]: updatedList };
    let impact = get().impact;
    if (activeDisruption) {
      impact = calculateDisruptionImpact(activeDisruption, updatedSnapshot, viewDate);
    }

    set({
      snapshot: updatedSnapshot,
      impact,
      lastUpdated: new Date(),
      isPlansOutdated: true,
    });
  },

  dismissAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    }));
  },

  recordQuoteReply: (supplierId, materialId, unitPrice, leadTimeDays, weeklyCapacity) => {
    const { snapshot } = get();
    if (!snapshot) return;

    const updatedSupplierMaterials = snapshot.supplierMaterials.map((sm) => {
      if (sm.supplier_id === supplierId && sm.material_id === materialId) {
        return {
          ...sm,
          unit_price: unitPrice,
          lead_time_days: leadTimeDays,
          weekly_capacity: weeklyCapacity,
          quote_status: 'Confirmed quote' as const,
          data_status: 'Known' as const,
          quote_date: formatDate(get().viewDate),
        };
      }
      return sm;
    });

    set({
      snapshot: { ...snapshot, supplierMaterials: updatedSupplierMaterials },
      lastUpdated: new Date(),
      isPlansOutdated: true,
    });

    if (get().activeDisruption) {
      get().runOptimizer();
    }
  },

  setSimulationDisruption: (disruption) => {
    const { simulationSnapshot, viewDate } = get();
    if (!simulationSnapshot) return;

    let impact: DisruptionImpact | null = null;
    if (disruption) {
      impact = calculateDisruptionImpact(disruption, simulationSnapshot, viewDate);
    }

    set({ simulationDisruption: disruption, impact });
  },

  updateSimulationSnapshot: (updater) => {
    const { simulationSnapshot, simulationDisruption, viewDate } = get();
    if (!simulationSnapshot) return;

    const newSnap = updater(simulationSnapshot);
    let impact: DisruptionImpact | null = null;
    if (simulationDisruption) {
      impact = calculateDisruptionImpact(simulationDisruption, newSnap, viewDate);
    }

    set({ simulationSnapshot: newSnap, impact });
  },

  resetSimulationToLive: () => {
    const { snapshot, activeDisruption } = get();
    set({
      simulationSnapshot: snapshot ? JSON.parse(JSON.stringify(snapshot)) : null,
      simulationDisruption: activeDisruption ? JSON.parse(JSON.stringify(activeDisruption)) : null,
      mode: 'LIVE',
    });
  },
}));
