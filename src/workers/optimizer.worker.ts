// Optimizer Web Worker (ChainTwin AI)
// Runs heavy multi-level optimization and simulation off the main browser thread.

import { generateRecoveryPlans, calculateDisruptionImpact, parseDate } from '../../engine';
import { NetworkSnapshot, Disruption } from '../../engine/types';

export interface WorkerInputMessage {
  type: 'RUN_OPTIMIZER' | 'CALCULATE_IMPACT';
  disruption: Disruption;
  snapshot: NetworkSnapshot;
  now: string; // ISO date string
  options?: {
    forceLevel2?: boolean;
    lossLimitMoneyINR?: number;
    lossLimitLateOrders?: number;
  };
}

self.onmessage = (event: MessageEvent<WorkerInputMessage>) => {
  const { type, disruption, snapshot, now: nowStr, options } = event.data;
  const now = parseDate(nowStr);

  try {
    if (type === 'RUN_OPTIMIZER') {
      // Post progress update
      self.postMessage({ type: 'PROGRESS', progress: 30, step: 'Evaluating baseline ripple effect...' });

      const baselineImpact = calculateDisruptionImpact(disruption, snapshot, now);
      self.postMessage({ type: 'PROGRESS', progress: 60, step: 'Searching candidate internal reallocations...' });

      const result = generateRecoveryPlans(disruption, snapshot, now, options);
      self.postMessage({ type: 'PROGRESS', progress: 90, step: 'Scoring multi-dimensional metrics...' });

      self.postMessage({
        type: 'OPTIMIZER_SUCCESS',
        plans: result.plans,
        baseline: result.baseline,
        escalatedToLevel2: result.escalatedToLevel2,
      });
    } else if (type === 'CALCULATE_IMPACT') {
      const impact = calculateDisruptionImpact(disruption, snapshot, now);
      self.postMessage({
        type: 'IMPACT_SUCCESS',
        impact,
      });
    }
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      error: error.message || 'Worker computation error',
    });
  }
};
