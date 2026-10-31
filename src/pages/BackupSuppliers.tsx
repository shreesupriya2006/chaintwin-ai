// Page 3: Backup Suppliers & Sourcing Studio (ChainTwin AI)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Sparkles,
  Mail,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  Shield,
  DollarSign,
  Plus,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useSupplyChainStore } from '../store/useSupplyChainStore';
import { formatDate } from '../../engine';

export const BackupSuppliers: React.FC = () => {
  const navigate = useNavigate();
  const {
    snapshot,
    activeDisruption,
    impact,
    viewDate,
    recordQuoteReply,
    runOptimizer,
  } = useSupplyChainStore();

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('MAT-01');
  const [quoteDraftModalOpen, setQuoteDraftModalOpen] = useState(false);
  const [activeSupplierForQuote, setActiveSupplierForQuote] = useState<any>(null);
  const [draftEmailBody, setDraftEmailBody] = useState<string>('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Record Reply Modal state
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replySupplier, setReplySupplier] = useState<any>(null);
  const [replyPrice, setReplyPrice] = useState<number>(275);
  const [replyLeadTime, setReplyLeadTime] = useState<number>(4);
  const [replyCapacity, setReplyCapacity] = useState<number>(8000);

  if (!snapshot) return null;

  // Filter materials
  const materials = snapshot.materials;
  const currentMaterial = materials.find((m) => m.material_id === selectedMaterialId);

  // Find backup suppliers for this material
  const backupSupplierLinks = snapshot.supplierMaterials.filter(
    (sm) => sm.material_id === selectedMaterialId && sm.role === 'Backup'
  );

  const backupSuppliers = backupSupplierLinks.map((sm) => {
    const supplier = snapshot.suppliers.find((s) => s.supplier_id === sm.supplier_id)!;
    return {
      ...supplier,
      link: sm,
    };
  });

  // Short materials banner during disruption
  const affectedMaterial = impact?.affectedMaterials[0];
  const isMaterialShort = affectedMaterial?.material_id === selectedMaterialId;

  const handleOpenDraftQuote = async (sup: any) => {
    setActiveSupplierForQuote(sup);
    setQuoteDraftModalOpen(true);
    setIsDrafting(true);
    setCopiedNotice(false);

    try {
      const response = await fetch('/api/draft-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: sup,
          material: currentMaterial,
          quantity: 5000,
          deadline: formatDate(viewDate),
          now: formatDate(viewDate),
        }),
      });

      if (!response.ok) throw new Error('Failed to draft quote');
      const data = await response.json();
      setDraftEmailBody(data.body);
    } catch (err) {
      console.warn('Fallback local draft quote:', err);
      setDraftEmailBody(
        `Dear ${sup.contact_person || sup.name},\n\nGreetings from Tiruppur Garments.\n\nDue to scheduled supplier downtime, we require an emergency quotation for:\n- Material: ${currentMaterial?.name}\n- Quantity: 5,000 ${currentMaterial?.unit}\n- Target Arrival: Within 4 days\n\nPlease reply with your confirmed price (INR/${currentMaterial?.unit}), dispatch lead time, and weekly capacity allocation.\n\nRegards,\nOperations Procurement Desk`
      );
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(draftEmailBody);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleOpenRecordReply = (sup: any) => {
    setReplySupplier(sup);
    setReplyPrice(sup.link.unit_price || 275);
    setReplyLeadTime(sup.link.lead_time_days || 4);
    setReplyCapacity(sup.link.weekly_capacity || 8000);
    setReplyModalOpen(true);
  };

  const handleSaveReply = () => {
    if (!replySupplier) return;
    recordQuoteReply(
      replySupplier.supplier_id,
      selectedMaterialId,
      Number(replyPrice),
      Number(replyLeadTime),
      Number(replyCapacity)
    );
    setReplyModalOpen(false);
  };

  const handleUseInPlan = (supId: string) => {
    runOptimizer(true); // force Level 2 with backup suppliers
    navigate('/planner');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-500" />
            Backup Suppliers & Sourcing Studio
          </h2>
          <p className="text-xs text-slate-400">
            Emergency sourcing options, AI quote drafting, and contract-verified substitute materials.
          </p>
        </div>

        {/* Material Selector Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter Material:</span>
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none"
          >
            {materials.map((m) => (
              <option key={m.material_id} value={m.material_id}>
                {m.name} ({m.material_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Disruption Alert Notice */}
      {isMaterialShort && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Needed Now: {currentMaterial?.name} for Knitting Units
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary supplier outage threatens factory buffers. {backupSuppliers.length} backup suppliers can provide emergency relief.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleUseInPlan('all')}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Recovery Plan with Backups</span>
          </button>
        </div>
      )}

      {/* Backup Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {backupSuppliers.map((sup) => {
          const isConfirmed = sup.link.quote_status === 'Confirmed quote';
          const isEstimate = sup.link.quote_status === 'Unconfirmed estimate';
          const isRequested = sup.link.quote_status === 'Requested';

          return (
            <div
              key={sup.supplier_id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                      {sup.supplier_id} • {sup.city}, {sup.state}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {sup.name}
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isConfirmed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isEstimate
                        ? 'bg-amber-500/20 text-amber-400 border border-dashed border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {sup.link.quote_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Price:</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      INR {sup.link.unit_price} /{sup.link.capacity_unit?.split(' ')[0] || 'kg'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Lead Time:</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {sup.link.lead_time_days} Days
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Weekly Capacity:</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {sup.link.weekly_capacity.toLocaleString()} {sup.link.capacity_unit?.split(' ')[0]}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Reliability:</span>
                    <div className="font-mono font-bold text-emerald-500">
                      {sup.reliability_pct}% ({sup.reliability_basis})
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleOpenDraftQuote(sup)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>Request Quote</span>
                </button>

                <button
                  onClick={() => handleOpenRecordReply(sup)}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Record Reply</span>
                </button>

                <button
                  onClick={() => handleUseInPlan(sup.supplier_id)}
                  className="py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
                  title="Include in Recovery Plan"
                >
                  Use
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Material Substitutes Section */}
      <div className="mt-8 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          Material Substitution Framework
        </h3>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          {snapshot.substitutes.map((sub, idx) => (
            <div
              key={idx}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <span>{sub.original_material}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-teal-500">{sub.substitute_material} (Cotton-Poly Blend)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                  {sub.quality_note}
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  Allowed Products: <strong>{sub.allowed_products}</strong> (Men's Basic Tee only)
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Buyer Approval</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-dashed border-amber-500/40">
                    {sub.approval_status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quote Drafting Modal */}
      {quoteDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold">Draft Quote Request to {activeSupplierForQuote?.name}</h3>
              </div>
              <button
                onClick={() => setQuoteDraftModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isDrafting ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span>Drafting formal inquiry with contract lead time terms...</span>
                </div>
              ) : (
                <>
                  <textarea
                    rows={8}
                    value={draftEmailBody}
                    onChange={(e) => setDraftEmailBody(e.target.value)}
                    className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      The app does not send emails directly. Copy to your clipboard or open your default mail client.
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyQuote}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 flex items-center gap-1.5"
                      >
                        {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNotice ? 'Copied' : 'Copy'}</span>
                      </button>

                      <a
                        href={`mailto:${activeSupplierForQuote?.contact_email}?subject=Urgent%20RFQ:%20${currentMaterial?.name}&body=${encodeURIComponent(draftEmailBody)}`}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Mail</span>
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Reply Modal */}
      {replyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="text-sm font-bold">Record Quote Reply from {replySupplier?.name}</h3>
              <button onClick={() => setReplyModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Recording this reply will upgrade the status from <em>Unconfirmed estimate (Assumption)</em> to <strong>Confirmed quote (Known)</strong>.
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Confirmed Price (INR / kg)</label>
                <input
                  type="number"
                  value={replyPrice}
                  onChange={(e) => setReplyPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Lead Time (Days)</label>
                <input
                  type="number"
                  value={replyLeadTime}
                  onChange={(e) => setReplyLeadTime(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Weekly Allocated Capacity (kg)</label>
                <input
                  type="number"
                  value={replyCapacity}
                  onChange={(e) => setReplyCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReply}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save as Confirmed Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
