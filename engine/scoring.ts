// Multi-Dimensional Plan Scoring & Business Impact Comparison (Pure TypeScript)

import {
  PlanScores,
  PlanAction,
  DisruptionImpact,
  BusinessImpactComparison,
  Setting,
  Customer,
} from './types';

export interface ScoreWeights {
  cost: number;
  sla: number;
  recoveryTime: number;
  customerImpact: number;
  risk: number;
  sustainability: number;
}

export function extractWeightsFromSettings(settings: Setting[]): ScoreWeights {
  const getWeight = (key: string, defaultVal: number): number => {
    const s = settings.find((item) => item.key === key);
    if (!s) return defaultVal;
    const n = parseFloat(s.value);
    return isNaN(n) ? defaultVal : n;
  };

  return {
    cost: getWeight('weight_cost', 0.25),
    sla: getWeight('weight_sla', 0.25),
    recoveryTime: getWeight('weight_recovery_time', 0.15),
    customerImpact: getWeight('weight_customer_impact', 0.15),
    risk: getWeight('weight_risk', 0.1),
    sustainability: getWeight('weight_sustainability', 0.1),
  };
}

/**
 * Calculates raw metrics and normalized (0-100) scores for a recovery scenario.
 */
export function calculatePlanScores(
  actions: PlanAction[],
  impact: DisruptionImpact,
  weights: ScoreWeights,
  customers: Customer[]
): PlanScores {
  // 1. Cost Calculations
  const extraActionCost = actions.reduce((sum, a) => sum + (a.costINR || 0), 0);
  const totalLatePenalty = impact.totalPenaltyINR;
  const totalCost = extraActionCost + totalLatePenalty;

  // Cost Score: 100 for 0 extra cost, scaling down
  // Benchmark INR 1,000,000 as 0 score
  const costScore = Math.max(0, Math.min(100, Math.round(100 - (totalCost / 1000000) * 100)));

  // 2. SLA Score: percentage of orders on track
  const totalOrders = Math.max(1, impact.totalOrdersCount);
  const onTimeOrders = Math.max(0, totalOrders - impact.lateOrdersCount);
  const slaPct = Math.round((onTimeOrders / totalOrders) * 100);
  const slaScore = slaPct;

  // 3. Recovery Time Score: faster recovery is better
  const recoveryDays = impact.recoveryDaysNeeded;
  // 0-3 days = 100, 30 days = 0
  const recoveryTimeScore = Math.max(0, Math.min(100, Math.round(100 - (recoveryDays / 30) * 100)));

  // 4. Customer Impact Score: weighted penalty by priority
  // High = 3x, Medium = 2x, Low = 1x
  let weightedLateScore = 0;
  for (const aff of impact.affectedOrders) {
    if (aff.status === 'Will be late') {
      const priorityWeight =
        aff.customer.priority === 'High' ? 3 : aff.customer.priority === 'Medium' ? 2 : 1;
      weightedLateScore += priorityWeight * (aff.delayDays || 1);
    }
  }
  const customerImpactScore = Math.max(0, Math.min(100, Math.round(100 - weightedLateScore * 4)));

  // 5. Operational Risk Score:
  // Penalize unconfirmed quotes, unapproved substitutes, high factory load
  let riskRating = 20; // baseline operational friction
  const assumptionActions = actions.filter((a) => a.isAssumption).length;
  riskRating += assumptionActions * 15;

  const hasSubstitute = actions.some((a) => a.type === 'material_substitute');
  if (hasSubstitute) riskRating += 15;

  const riskScore = Math.max(0, Math.min(100, 100 - Math.min(100, riskRating)));

  // 6. Sustainability (CO2) Score:
  const totalCo2 = actions.reduce((sum, a) => sum + (a.co2Kg || 0), 0);
  // Benchmark 2000kg CO2
  const sustainabilityScore = Math.max(0, Math.min(100, Math.round(100 - (totalCo2 / 2000) * 100)));

  // 7. Overall Weighted Score
  const totalWeight =
    weights.cost +
    weights.sla +
    weights.recoveryTime +
    weights.customerImpact +
    weights.risk +
    weights.sustainability;

  const overallScore = Math.round(
    (costScore * weights.cost +
      slaScore * weights.sla +
      recoveryTimeScore * weights.recoveryTime +
      customerImpactScore * weights.customerImpact +
      riskScore * weights.risk +
      sustainabilityScore * weights.sustainability) /
      (totalWeight || 1)
  );

  return {
    costScore,
    slaScore,
    recoveryTimeScore,
    customerImpactScore,
    riskScore,
    sustainabilityScore,
    overallScore,
    raw: {
      extraCostINR: totalCost,
      slaPct,
      recoveryDays,
      weightedLateScore,
      riskRating,
      co2Kg: totalCo2,
    },
  };
}

/**
 * Calculates Business Impact vs "Do Nothing" baseline.
 */
export function calculateBusinessImpact(
  baselineImpact: DisruptionImpact,
  planImpact: DisruptionImpact,
  extraCostINR: number
): BusinessImpactComparison {
  const ordersProtected = Math.max(
    0,
    planImpact.protectedOrdersCount - baselineImpact.protectedOrdersCount
  );
  const lateDeliveriesAvoided = Math.max(
    0,
    baselineImpact.lateOrdersCount - planImpact.lateOrdersCount
  );
  const lossAvoidedINR = Math.max(
    0,
    baselineImpact.totalPenaltyINR - planImpact.totalPenaltyINR
  );
  const netBenefitINR = Math.round(lossAvoidedINR - extraCostINR);
  const recoveryDays = planImpact.recoveryDaysNeeded;

  return {
    ordersProtected,
    lateDeliveriesAvoided,
    lossAvoidedINR,
    extraCostINR,
    netBenefitINR,
    recoveryDays,
  };
}
