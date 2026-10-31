// Global Command Palette (Ctrl+K) for ChainTwin AI
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Database,
  Truck,
  FlaskConical,
  GitFork,
  BellRing,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { useSupplyChainStore } from '../../store/useSupplyChainStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDisruptionModal?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenDisruptionModal,
}) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { toggleTheme, runOptimizer, snapshot } = useSupplyChainStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pages = [
    { name: 'Live Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Data Manager', path: '/data', icon: Database },
    { name: 'Backup Suppliers', path: '/suppliers', icon: Truck },
    { name: 'What-If Simulator', path: '/simulator', icon: FlaskConical },
    { name: 'Recovery Planner', path: '/planner', icon: GitFork },
    { name: 'Alerts & History', path: '/alerts', icon: BellRing },
    { name: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
  ];

  const actions = [
    {
      name: 'Report Disruption',
      icon: AlertTriangle,
      action: () => {
        onClose();
        if (onOpenDisruptionModal) onOpenDisruptionModal();
      },
    },
    {
      name: 'Recompute Recovery Plans (Optimizer)',
      icon: RefreshCw,
      action: () => {
        runOptimizer();
        onClose();
        navigate('/planner');
      },
    },
    {
      name: 'Toggle Dark / Light Theme',
      icon: Sun,
      action: () => {
        toggleTheme();
        onClose();
      },
    },
  ];

  const filteredPages = pages.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredActions = actions.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search pages, orders, suppliers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-300 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Actions
              </div>
              <div className="mt-1 space-y-1">
                {filteredActions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.name}
                      onClick={act.action}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-blue-500" />
                        <span>{act.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Pages */}
          {filteredPages.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Navigation
              </div>
              <div className="mt-1 space-y-1">
                {filteredPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.path}
                      onClick={() => {
                        navigate(page.path);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-indigo-500" />
                        <span>{page.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredActions.length === 0 && filteredPages.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching commands or pages found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
