// Page 4: What-If Simulator & Time Travel (ChainTwin AI)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Play,
  RotateCcw,
  FastForward,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Clock,
  Layers,
  Send,
  Calendar,
} from 'lucide-react';
import { useSupplyChainStore } from '../store/useSupplyChainStore';
import { TwinGraph } from '../components/graph/TwinGraph';
import { formatDisplayDate, formatDate, addDaysToDate, parseDate } from '../../engine';

export const WhatIfSimulator: React.FC = () => {
  const navigate = useNavigate();
  const {
    snapshot,
    simulationSnapshot,
    simulationDisruption,
    setMode,
    setSimulationDisruption,
    updateSimulationSnapshot,
    resetSimulationToLive,
    reportDisruption,
    impact,
    viewDate,
    setViewDate,
  } = useSupplyChainStore();

  const [simDaysAhead, setSimDaysAhead] = useState(0);
  const [simSupplierId, setSimSupplierId] = useState('SUP-01');
  const [simDurationDays, setSimDurationDays] = useState(12);

  // Initialize simulation mode on mount
  useEffect(() => {
    setMode('SIMULATION');
    if (!simulationDisruption) {
      setSimulationDisruption({
        supplier_id: 'SUP-01',
        start_date: formatDate(new Date()),
        duration_days: 12,
        capacity_loss_pct: 100,
      });
    }
    return () => {
      // Don't auto-revert if navigating to recovery planner with simulation source
    };
  }, []);

  const currentSnap = simulationSnapshot || snapshot;
  if (!currentSnap) return null;

  const handleTimeTravelChange = (days: number) => {
    setSimDaysAhead(days);
    const future = parseDate(addDaysToDate(formatDate(new Date()), days));
    setViewDate(future);
  };

  const handleUpdateDisruption = () => {
    setSimulationDisruption({
      supplier_id: simSupplierId,
      start_date: formatDate(new Date()),
      duration_days: Number(simDurationDays),
      capacity_loss_pct: 100,
    });
  };

  const handleReportAsReal = () => {
    if (confirm('Deploy this simulation disruption to the LIVE supply chain network?')) {
      reportDisruption({
        supplier_id: simSupplierId,
        start_date: formatDate(new Date()),
        duration_days: Number(simDurationDays),
        capacity_loss_pct: 100,
      });
      setMode('LIVE');
      navigate('/');
    }
  };

  const handleSeeRecoveryPlans = () => {
    navigate('/planner');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 p-6 space-y-4">
      {/* Prominent Purple Simulation Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <FlaskConical className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                What-If Sandbox Simulation Active
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/30 text-purple-300">
                Sandboxed Copy
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Live enterprise data is strictly protected. Edits here affect only this test environment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={resetSimulationToLive}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Live</span>
          </button>

          <button
            onClick={handleReportAsReal}
            className="px-3.5 py-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-xs font-bold text-rose-300 flex items-center gap-1.5 transition-colors"
          >
            <span>Report This as Real</span>
          </button>

          <button
            onClick={handleSeeRecoveryPlans}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>See Recovery Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Time Travel Slider Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Time Travel Projection</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400">
                +{simDaysAhead} Days Forward ({formatDisplayDate(viewDate.toISOString())})
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Drag slider to watch material consumption, factory stock depletion and order delay cascades.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-md">
          <span className="text-[11px] font-mono text-slate-400 shrink-0">Day 0 (Now)</span>
          <input
            type="range"
            min="0"
            max="30"
            value={simDaysAhead}
            onChange={(e) => handleTimeTravelChange(Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
          <span className="text-[11px] font-mono text-slate-400 shrink-0">Day +30</span>
        </div>
      </div>

      {/* Main Simulation Twin View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-5 min-h-0">
        {/* Simulation Controls Left Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Simulated Disruption
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Supplier
              </label>
              <select
                value={simSupplierId}
                onChange={(e) => setSimSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {currentSnap.suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_id} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Outage Duration
                </label>
                <span className="font-mono text-xs font-bold text-purple-400">
                  {simDurationDays} Days
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="30"
                value={simDurationDays}
                onChange={(e) => setSimDurationDays(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <button
              onClick={handleUpdateDisruption}
              className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              Apply to Simulation
            </button>
          </div>

          {/* Impact Stats */}
          {impact && (
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-500/20 space-y-2 text-xs font-mono">
              <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                Projected Impact
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Late Orders:</span>
                <strong className="text-rose-500">{impact.lateOrdersCount} / {currentSnap.orders.length}</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total Penalties:</span>
                <strong className="text-slate-900 dark:text-white">INR {impact.totalPenaltyINR.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Right 3 Cols: React Flow Digital Twin Graph */}
        <div className="lg:col-span-3 flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Simulated Network Graph
            </span>
            <span className="text-[11px] text-purple-400 font-mono">
              (Live connections insulated)
            </span>
          </div>

          <div className="flex-1 relative min-h-0">
            <TwinGraph
              snapshot={currentSnap}
              impact={impact}
              selectedNodeId={null}
              selectedOrderId={null}
              onSelectNode={() => {}}
              isSimulation={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
