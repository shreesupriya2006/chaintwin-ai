// Page 1: Live Dashboard (ChainTwin AI)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useSupplyChainStore } from '../store/useSupplyChainStore';
import { TwinGraph } from '../components/graph/TwinGraph';
import { DisruptionModal } from '../components/dashboard/DisruptionModal';
import { formatDisplayDate } from '../../engine';
import { loadSampleDataFromCSV } from '../lib/sampleDataLoader';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    snapshot,
    setSnapshot,
    impact,
    activeDisruption,
    resolveDisruption,
    selectedNodeId,
    selectNode,
    selectedOrderId,
    selectOrder,
    viewDate,
    plans,
    lastUpdated,
  } = useSupplyChainStore();

  const [isDisruptionModalOpen, setIsDisruptionModalOpen] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Auto-load sample data if empty
  useEffect(() => {
    if (!snapshot) {
      handleLoadSample();
    }
  }, [snapshot]);

  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const data = await loadSampleDataFromCSV();
      setSnapshot(data, true); // true = rebase to real current date
    } catch (err) {
      console.error('Failed to load sample data:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  if (!snapshot) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
          <Layers className="w-8 h-8 animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          No Supply Chain Data Loaded
        </h2>
        <p className="text-xs text-slate-400 max-w-md">
          Load the synthetic Tiruppur Cotton T-Shirt dataset to activate real-time telemetry, stage tracking, and disruption simulations.
        </p>
        <button
          onClick={handleLoadSample}
          disabled={isLoadingSample}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          {isLoadingSample ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Load Tiruppur Sample Dataset</span>
        </button>
      </div>
    );
  }

  // Calculate live KPIs
  const totalOrders = snapshot.orders.length;
  const lateOrdersCount = impact ? impact.lateOrdersCount : 0;
  const atRiskCount = impact
    ? impact.affectedOrders.filter((o) => o.status === 'At risk').length
    : 0;
  const onTrackCount = totalOrders - lateOrdersCount - atRiskCount;
  const totalValueInFlight = snapshot.orders.reduce(
    (sum, o) => sum + o.quantity * o.unit_price_inr,
    0
  );

  const selectedNode = selectedNodeId
    ? snapshot.locations.find((l) => l.location_id === selectedNodeId) ||
      snapshot.suppliers.find((s) => s.supplier_id === selectedNodeId) ||
      snapshot.materials.find((m) => m.material_id === selectedNodeId) ||
      snapshot.customers.find((c) => c.customer_id === selectedNodeId)
    : null;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 p-6 space-y-5">
      {/* Top Banner / Status Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Live Network Telemetry as of {formatDisplayDate(viewDate.toISOString())}
            </span>
            <span className="text-[11px] text-slate-400">
              (Updated {lastUpdated.toLocaleTimeString()})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            End-to-end supply chain digital twin: Tiruppur knitwear network
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeDisruption ? (
            <button
              onClick={resolveDisruption}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Resolve Disruption
            </button>
          ) : null}

          <button
            onClick={() => setIsDisruptionModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all active:scale-98"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Report Disruption</span>
          </button>
        </div>
      </div>

      {/* Disruption Alert Notification Banner (Only appears when disruption is active) */}
      {activeDisruption && impact && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/60 border border-rose-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Disruption: {impact.disruptedSupplier?.name || activeDisruption.supplier_id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/30 text-rose-300 font-bold">
                  {activeDisruption.duration_days} Days Outage
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {impact.impactStory}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/planner')}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition-all active:scale-98"
            >
              <Zap className="w-4 h-4" />
              <span>Review Recovery Plans ({plans.length || 3})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Orders On Track
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {onTrackCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Orders At Risk
            </div>
            <div className="text-2xl font-bold text-amber-500 mt-1">
              {atRiskCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              SLA Breaches
            </div>
            <div className="text-2xl font-bold text-rose-500 mt-1">
              {lateOrdersCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Liquidated Penalties
            </div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              INR {(impact ? impact.totalPenaltyINR : 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Value in Flight
            </div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              INR {totalValueInFlight.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Center Area: Digital Twin React Flow Graph + Orders Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0">
        {/* Left 2 Cols: React Flow Digital Twin Graph */}
        <div className="lg:col-span-2 flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Digital Twin Network Topology
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                (Supplier → Material → Factory → DC → Store → Customer)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-500">At Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-500">Disrupted</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative min-h-0">
            <TwinGraph
              snapshot={snapshot}
              impact={impact}
              selectedNodeId={selectedNodeId}
              selectedOrderId={selectedOrderId}
              onSelectNode={selectNode}
            />
          </div>
        </div>

        {/* Right 1 Col: Orders Panel & Stage Progress */}
        <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Active Orders Telemetry ({snapshot.orders.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Click order to trace 6-stage lifecycle on twin
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
            {snapshot.orders.map((ord) => {
              const aff = impact?.affectedOrders.find((a) => a.order.order_id === ord.order_id);
              const status = aff ? aff.status : 'On track';
              const isSelected = selectedOrderId === ord.order_id;
              const stages = snapshot.orderStages.filter((s) => s.order_id === ord.order_id);
              const doneStagesCount = stages.filter((s) => s.status_as_of_file === 'Done').length;

              return (
                <div
                  key={ord.order_id}
                  onClick={() => selectOrder(isSelected ? null : ord.order_id)}
                  className={`pt-2.5 first:pt-0 cursor-pointer p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-500/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {ord.order_id}
                      </span>
                      <span className="text-[11px] text-slate-400">({ord.customer_id})</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        status === 'Will be late'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : status === 'At risk'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* 6-Stage Progress Bar */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Stage {doneStagesCount} of 6</span>
                      <span>Promised: {ord.promised_date}</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1 h-1.5">
                      {[1, 2, 3, 4, 5, 6].map((stageNo) => {
                        const st = stages.find((s) => s.stage_no === stageNo);
                        const isDone = st?.status_as_of_file === 'Done';
                        const isInProgress = st?.status_as_of_file === 'In progress';
                        return (
                          <div
                            key={stageNo}
                            className={`rounded-full h-full ${
                              isDone
                                ? 'bg-emerald-500'
                                : isInProgress
                                ? 'bg-blue-500 animate-pulse'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                            title={`Stage ${stageNo}: ${st?.stage_name}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {aff && aff.delayDays > 0 && (
                    <div className="mt-2 text-[11px] text-rose-500 dark:text-rose-400 flex items-center justify-between font-mono">
                      <span>Late: +{aff.delayDays} days</span>
                      <span>Penalty: INR {aff.penaltyINR.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DisruptionModal
        isOpen={isDisruptionModalOpen}
        onClose={() => setIsDisruptionModalOpen(false)}
      />
    </div>
  );
};
