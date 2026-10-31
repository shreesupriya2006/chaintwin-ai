// Disruption Intake Modal (Form + Plain-Words AI Parser)
import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  Building,
} from 'lucide-react';
import { useSupplyChainStore } from '../../store/useSupplyChainStore';
import { formatDate } from '../../../engine';
import { Disruption } from '../../types';

interface DisruptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDisruption?: Partial<Disruption>;
}

export const DisruptionModal: React.FC<DisruptionModalProps> = ({
  isOpen,
  onClose,
  initialDisruption,
}) => {
  const { snapshot, viewDate, reportDisruption } = useSupplyChainStore();

  const [supplierId, setSupplierId] = useState(initialDisruption?.supplier_id || 'SUP-01');
  const [startDate, setStartDate] = useState(
    initialDisruption?.start_date || formatDate(viewDate)
  );
  const [durationDays, setDurationDays] = useState(initialDisruption?.duration_days || 10);
  const [capacityLossPct, setCapacityLossPct] = useState(
    initialDisruption?.capacity_loss_pct || 100
  );
  const [plainWordsText, setPlainWordsText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const suppliers = snapshot?.suppliers || [];

  const handleParsePlainWords = async () => {
    if (!plainWordsText.trim()) return;
    setIsParsing(true);
    setParseNotice(null);

    try {
      const response = await fetch('/api/parse-disruption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: plainWordsText,
          suppliers: snapshot?.suppliers,
          now: formatDate(viewDate),
        }),
      });

      if (!response.ok) throw new Error('Parsing service unavailable');
      const data = await response.json();

      if (data.supplier_id) setSupplierId(data.supplier_id);
      if (data.start_date) setStartDate(data.start_date);
      if (data.duration_days) setDurationDays(Number(data.duration_days) || 10);
      if (data.capacity_loss_pct) setCapacityLossPct(Number(data.capacity_loss_pct) || 100);

      setParseNotice('Extracted fields populated below. Please review and confirm.');
    } catch (err: any) {
      console.warn('AI parse failed, parsing locally:', err);
      // Fallback local heuristic
      const lower = plainWordsText.toLowerCase();
      const sup = suppliers.find((s) => lower.includes(s.name.toLowerCase()));
      if (sup) setSupplierId(sup.supplier_id);
      const matchDays = lower.match(/(\d+)\s*days?/);
      if (matchDays) setDurationDays(parseInt(matchDays[1], 10));
      setParseNotice('Fields estimated from text. Please verify before submitting.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const disruption: Disruption = {
      supplier_id: supplierId,
      start_date: startDate,
      duration_days: Number(durationDays),
      capacity_loss_pct: Number(capacityLossPct),
      reported_at: new Date().toISOString(),
      notes: plainWordsText || 'Disruption reported by plant manager',
    };

    reportDisruption(disruption);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Report Supply Disruption</h3>
              <p className="text-xs text-slate-400">
                Trigger twin dependency reasoning & recovery plan generation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Plain Words Input Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Natural Language Quick Intake
              </span>
              <span className="text-[10px] text-slate-400">Gemini Powered</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Sri Kumaran spinning mill boiler outage for 10 days"
                value={plainWordsText}
                onChange={(e) => setPlainWordsText(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleParsePlainWords}
                disabled={isParsing || !plainWordsText.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Parse'}
              </button>
            </div>

            {parseNotice && (
              <p className="text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{parseNotice}</span>
              </p>
            )}
          </div>

          {/* Structured Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Disrupted Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_id} — {s.name} ({s.city}, {s.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Outage Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Capacity Loss Percentage
                </label>
                <span className="font-mono text-xs font-bold text-rose-500">
                  {capacityLossPct}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={capacityLossPct}
                onChange={(e) => setCapacityLossPct(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/25 transition-all active:scale-98"
              >
                Simulate Impact & Generate Plans
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
