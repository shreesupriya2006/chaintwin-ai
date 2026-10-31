// Page 6: Alerts & History (ChainTwin AI)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  History,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  User,
} from 'lucide-react';
import { useSupplyChainStore } from '../store/useSupplyChainStore';
import { formatDisplayDate } from '../../engine';

export const AlertsHistory: React.FC = () => {
  const navigate = useNavigate();
  const {
    alerts,
    history,
    dismissAlert,
    updateStageProgress,
    undoPlan,
    reportDisruption,
    activeDisruption,
    resolveDisruption,
  } = useSupplyChainStore();

  const [activeTab, setActiveTab] = useState<'alerts' | 'history' | 'patterns'>('alerts');

  const handleConfirmArrival = (orderId: string, stageNo: number) => {
    updateStageProgress(orderId, stageNo, 'Done');
  };

  const handleReportAsDisruption = (alert: any) => {
    if (alert.suggestedDisruption) {
      reportDisruption({
        ...alert.suggestedDisruption,
        reported_at: new Date().toISOString(),
      });
      navigate('/');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-500" />
            Alerts & Audit History
          </h2>
          <p className="text-xs text-slate-400">
            Manager confirmations, early-warning signals, immutable plan audit log, and one-click rollback.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'alerts'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending Signals ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Audit Log ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'patterns'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pattern Insights
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
        {activeTab === 'alerts' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {alerts.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  No Pending Confirmation Signals
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All inbound POs and order stages are progressing on schedule according to the live clock.
                </p>
              </div>
            ) : (
              alerts.map((al) => (
                <div
                  key={al.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        al.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {al.title}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {al.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                        {al.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {al.stageAction && (
                      <button
                        onClick={() =>
                          handleConfirmArrival(al.stageAction!.order_id, al.stageAction!.stage_no)
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Yes, Received</span>
                      </button>
                    )}

                    {al.suggestedDisruption && (
                      <button
                        onClick={() => handleReportAsDisruption(al)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Report as Disruption</span>
                      </button>
                    )}

                    <button
                      onClick={() => dismissAlert(al.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      title="Dismiss Alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {history.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No history events recorded in this session.
              </div>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {h.action.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(h.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {h.details}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Author: {h.user_email}
                      </span>
                    </div>
                  </div>

                  {h.action === 'plan_finalised' && h.previous_snapshot && (
                    <button
                      onClick={() => undoPlan(h.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo Plan</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Autonomous Risk Pattern Insights
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                  <Sparkles className="w-4 h-4" />
                  <span>Single-Source Yarn Vulnerability</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Both Unit 1 and Unit 2 rely on SUP-01 for 100% of combed cotton yarn (MAT-01). Past records show that an outage longer than 5 days invariably breaches Chennai retail SLA windows.
                </p>
                <div className="pt-2 text-[11px] text-teal-500 font-semibold">
                  Recommendation: Retain SUP-06 (Erode Cotton Yarns) on permanent standby contract.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
                  <Sparkles className="w-4 h-4" />
                  <span>Rail Corridor CO2 Optimization</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Transferring finished tees via Rail Route RT-19 (Tiruppur to Chennai DC) emits 9.7 kg CO2/tonne compared to 33.0 kg via road. For non-urgent batches, rail saves 70% transit emissions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
