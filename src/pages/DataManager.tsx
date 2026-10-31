// Page 2: Data Manager (ChainTwin AI)
import React, { useState } from 'react';
import {
  Database,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSupplyChainStore } from '../store/useSupplyChainStore';
import { NetworkSnapshot } from '../../engine/types';
import { loadSampleDataFromCSV } from '../lib/sampleDataLoader';
import { formatDate } from '../../engine';

export const DataManager: React.FC = () => {
  const { snapshot, setSnapshot, updateDataEntity, viewDate } = useSupplyChainStore();
  const [activeTab, setActiveTab] = useState<keyof NetworkSnapshot>('suppliers');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [rebasingPromptOpen, setRebasingPromptOpen] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<NetworkSnapshot | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!snapshot) return null;

  const tabs: Array<{ key: keyof NetworkSnapshot; label: string }> = [
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'materials', label: 'Materials' },
    { key: 'supplierMaterials', label: 'Supplier Materials' },
    { key: 'products', label: 'Products' },
    { key: 'bom', label: 'BOM' },
    { key: 'locations', label: 'Locations (Fac/DC/Store)' },
    { key: 'productionRates', label: 'Production Rates' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'customers', label: 'Customers' },
    { key: 'orders', label: 'Orders' },
    { key: 'orderStages', label: 'Order Stages' },
    { key: 'inboundPOs', label: 'Inbound POs' },
    { key: 'routes', label: 'Routes' },
    { key: 'substitutes', label: 'Substitutes' },
    { key: 'settings', label: 'Settings' },
  ];

  const currentList = (snapshot[activeTab] as any[]) || [];

  // Filter based on search
  const filteredList = currentList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(searchQuery.toLowerCase());
  });

  const getEntityIdKey = (tab: keyof NetworkSnapshot): string => {
    switch (tab) {
      case 'suppliers':
        return 'supplier_id';
      case 'materials':
        return 'material_id';
      case 'products':
        return 'product_id';
      case 'locations':
        return 'location_id';
      case 'customers':
        return 'customer_id';
      case 'orders':
        return 'order_id';
      case 'inboundPOs':
        return 'po_id';
      case 'routes':
        return 'route_id';
      case 'settings':
        return 'key';
      default:
        return Object.keys(currentList[0] || {})[0] || 'id';
    }
  };

  const handleStartEdit = (item: any) => {
    const idKey = getEntityIdKey(activeTab);
    setEditingId(item[idKey]);
    setEditForm({ ...item });
  };

  const handleSaveEdit = () => {
    const idKey = getEntityIdKey(activeTab);
    updateDataEntity(activeTab, idKey, editingId!, editForm);
    setEditingId(null);
    setEditForm({});
    setStatusMessage('Record updated in real-time Firestore state.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    tabs.forEach(({ key, label }) => {
      const data = snapshot[key] as any[];
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, label.substring(0, 31));
    });
    XLSX.writeFile(wb, `ChainTwin_SupplyChainData_${formatDate(viewDate)}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Basic check for sheets
        setStatusMessage(`Uploaded workbook with ${wb.SheetNames.length} sheets.`);
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err) {
        console.error('File parsing error:', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 p-6 space-y-4">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Supply Chain Data Manager
          </h2>
          <p className="text-xs text-slate-400">
            Schema-driven universal table editor. All changes sync in real-time across tabs and sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {statusMessage && (
            <div className="px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          <label className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel/CSV</span>
            <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 shrink-0 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setEditingId(null);
              setSearchQuery('');
            }}
            className={`px-3 py-2 text-xs font-medium rounded-t-xl transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label} ({(snapshot[tab.key] as any[])?.length || 0})
          </button>
        ))}
      </div>

      {/* Search & Table Wrapper */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Showing {filteredList.length} of {currentList.length} records
          </span>
        </div>

        {/* Dynamic Schema Table */}
        <div className="flex-1 overflow-auto">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching records found in {activeTab}.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] tracking-wider z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {Object.keys(filteredList[0] || {}).map((col) => (
                    <th key={col} className="px-3.5 py-2.5">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {filteredList.map((item, idx) => {
                  const idKey = getEntityIdKey(activeTab);
                  const isEditing = editingId === item[idKey];

                  return (
                    <tr
                      key={item[idKey] || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {Object.keys(item).map((col) => (
                        <td key={col} className="px-3.5 py-2 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm[col] !== undefined ? editForm[col] : ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, [col]: e.target.value })
                              }
                              className="px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-blue-400 rounded focus:outline-none w-full min-w-[80px]"
                            />
                          ) : col === 'data_status' ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                item[col] === 'Assumption'
                                  ? 'bg-amber-500/20 text-amber-400 border border-dashed border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {item[col]}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {String(item[col] ?? '')}
                            </span>
                          )}
                        </td>
                      ))}

                      {/* Action Cell */}
                      <td className="px-3.5 py-2 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-400"
                              title="Save Changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 rounded text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
