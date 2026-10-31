// Page 5: Recovery Planner & Approval Engine (ChainTwin AI)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitFork,
  Sparkles,
  CheckCircle2,
  Clock,
  DollarSign,
  Shield,
  Layers,
  ArrowRight,
  TrendingDown,
  ChevronRight,
  Sliders,
  Check,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Info,
  Loader2,
} from 'lucide-react';
import { useSupplyChainStore } from '../store/useSupplyChainStore';
import { RecoveryPlan, PlanAction } from '../../engine/types';

export const RecoveryPlanner: React.FC = () => {
  const navigate = useNavigate();
  const {
    snapshot,
    plans,
    baselinePlan,
    selectedPlanId,
    selectPlan,
    previewPlan,
    finalisePlan,
    planState,
    isPlansOutdated,
    runOptimizer,
    optimizerLoading,
    optimizerStep,
    mode,
    activeDisruption,
    simulationDisruption,
  } = useSupplyChainStore();

  const [explainDrawerOpen, setExplainDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'manual' | 'weights'>('plans');
  const [sourceType, setSourceType] = useState<'live' | 'simulation'>(
    mode === 'SIMULATION' ? 'simulation' : 'live'
  );

  // Auto-run optimizer if no plans exist yet
  useEffect(() => {
    if (plans.length === 0 && (activeDisruption || simulationDisruption)) {
      runOptimizer();
    }
  }, [plans.length, activeDisruption, simulationDisruption]);

  const activePlan =
    plans.find((p) => p.id === selectedPlanId) || plans[0] || baselinePlan;

  const isSimulation = sourceType === 'simulation';

  const handleFinalise = () => {
    if (!activePlan) return;
    if (isSimulation) {
      alert('Cannot finalise a plan generated in Simulation mode into live Firestore. Switch to Live disruption first.');
      return;
    }
    finalisePlan(activePlan.id);
    navigate('/');
  };

  if (!activePlan) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
          <GitFork className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          No Active Disruption to Recover From
        </h2>
        <p className="text-xs text-slate-400 max-w-md">
          Report a supplier outage on the Live Dashboard or create a scenario in the What-If Simulator to generate multi-tier recovery plans.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
        >
          Go to Live Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 p-6 space-y-4">
      {/* Top Header & Source Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <GitFork className="w-5 h-5 text-teal-500" />
              Recovery Planner & Multi-Tier Optimizer
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                planState === 'Finalised'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : planState === 'Previewed'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'bg-slate-500/20 text-slate-400'
              }`}
            >
              State: {planState}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Compare Level 1 internal mitigations with Level 2 emergency backup sourcing.
          </p>
        </div>

        {/* Source Switch Pill & Recalculate */}
        <div className="flex items-center gap-2">
          {isPlansOutdated && (
            <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Data changed — Plans outdated</span>
            </div>
          )}

          <button
            onClick={() => runOptimizer(false)}
            disabled={optimizerLoading}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            {optimizerLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>Recalculate Plans</span>
          </button>
        </div>
      </div>

      {/* Plan Selector Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 shrink-0 no-scrollbar">
        {plans.map((p) => {
          const isSelected = selectedPlanId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => selectPlan(p.id)}
              className={`px-4 py-3 rounded-2xl border text-left transition-all shrink-0 min-w-[230px] flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-teal-950/60 via-slate-900 to-blue-950/60 border-teal-500/60 shadow-lg ring-1 ring-teal-500/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-teal-400">
                  {p.tag}
                </span>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  Score: {p.scores.overallScore}/100
                </span>
              </div>
              <div className="font-bold text-xs text-slate-800 dark:text-slate-100 mt-1 truncate">
                {p.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>{p.actions.length} actions</span>
                <span className="font-mono text-emerald-500 font-semibold">
                  +INR {p.businessImpact.netBenefitINR.toLocaleString('en-IN')} net
                </span>
              </div>
            </button>
          );
        })}

        {baselinePlan && (
          <button
            onClick={() => selectPlan(baselinePlan.id)}
            className={`px-4 py-3 rounded-2xl border text-left transition-all shrink-0 min-w-[200px] flex flex-col justify-between ${
              selectedPlanId === baselinePlan.id
                ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="text-[10px] font-mono uppercase font-bold text-rose-400">
              No Intervention
            </span>
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-1">
              Do Nothing Baseline
            </div>
            <div className="text-[11px] text-rose-500 mt-1 font-mono">
              Late Loss: INR {baselinePlan.impact.totalPenaltyINR.toLocaleString('en-IN')}
            </div>
          </button>
        )}
      </div>

      {/* Main Plan Detail Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0">
        {/* Left 2 Cols: Action List & Business Impact Counters */}
        <div className="lg:col-span-2 flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Plan Description & Before/After Counters */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activePlan.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {activePlan.description}
                </p>
              </div>

              <button
                onClick={() => setExplainDrawerOpen(!explainDrawerOpen)}
                className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Why this plan?</span>
              </button>
            </div>

            {/* Before / After Impact Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Orders Protected:</span>
                <div className="text-lg font-bold text-emerald-500 mt-0.5">
                  {activePlan.businessImpact.ordersProtected} Orders
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Late Avoided:</span>
                <div className="text-lg font-bold text-teal-400 mt-0.5">
                  {activePlan.businessImpact.lateDeliveriesAvoided} Deliveries
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Loss Avoided:</span>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  INR {activePlan.businessImpact.lossAvoidedINR.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Net Benefit:</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  INR {activePlan.businessImpact.netBenefitINR.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Action List Section */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Intervention Action Pipeline ({activePlan.actions.length} Steps)
            </h4>

            {activePlan.actions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No interventions active for this baseline.
              </div>
            ) : (
              activePlan.actions.map((act, idx) => (
                <div
                  key={act.id || idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2 hover:border-teal-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold text-[10px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {act.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {act.isAssumption && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-dashed border-amber-500/40">
                          Assumption
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {act.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-7 leading-relaxed">
                    {act.description}
                  </p>

                  <div className="flex items-center gap-4 pl-7 text-[11px] font-mono text-slate-400">
                    <span>Extra Cost: INR {(act.costINR || 0).toLocaleString('en-IN')}</span>
                    {act.co2Kg > 0 && <span>CO2: +{act.co2Kg} kg</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: 6-Dimension Score Radar/Bars & Action Approval */}
        <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                6-Dimension Scorecard
              </h4>
              <span className="text-xs font-bold font-mono text-teal-400">
                {activePlan.scores.overallScore} / 100
              </span>
            </div>

            {/* 6 Score Progress Bars with Real Units */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Cost Efficiency</span>
                  <span className="font-mono font-bold">{activePlan.scores.costScore}/100</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${activePlan.scores.costScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Customer SLA Delivery</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {activePlan.scores.slaScore}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${activePlan.scores.slaScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Cycle Recovery Time</span>
                  <span className="font-mono font-bold">
                    {activePlan.scores.raw.recoveryDays} Days
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full"
                    style={{ width: `${activePlan.scores.recoveryTimeScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Customer Impact (Tier Weighted)</span>
                  <span className="font-mono font-bold">
                    {activePlan.scores.customerImpactScore}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${activePlan.scores.customerImpactScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Operational Reliability (Risk)</span>
                  <span className="font-mono font-bold">
                    {activePlan.scores.riskScore}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${activePlan.scores.riskScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Transport Sustainability (CO2)</span>
                  <span className="font-mono font-bold">
                    {activePlan.scores.sustainabilityScore}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${activePlan.scores.sustainabilityScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Three-State Approval Execution Flow */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="text-[11px] text-slate-400">
              Three-State Approval: <strong>Proposed → Previewed → Finalised</strong>. Preview tests impact on dashboard without saving; Finalise commits to live telemetry.
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => previewPlan(activePlan.id)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-sm"
              >
                Choose to Preview
              </button>

              <button
                onClick={handleFinalise}
                disabled={isSimulation}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/25 transition-all disabled:opacity-40"
              >
                Finalise Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* "Why This Plan?" Slide-Over Explainability Drawer */}
      {explainDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Explainability Briefing
                </h3>
              </div>
              <button
                onClick={() => setExplainDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>{activePlan.explanation}</p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Grounding & Guardrails
                </span>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>[KNOWN] All monetary penalties derived from Customer Tier contract rates.</li>
                  <li>[KNOWN] Primary supplier contract commits 18,000 kg capacity at 3 days lead time.</li>
                  <li>[ASSUMPTION] Backup supplier quotes verified against current spot price sheets.</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Cites Standard Operating Playbook Section 2.2</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setExplainDrawerOpen(false)}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            Close Briefing
          </button>
        </div>
      )}
    </div>
  );
};
