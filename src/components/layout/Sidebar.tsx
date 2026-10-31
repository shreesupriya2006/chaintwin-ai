// Left Navigation Sidebar for ChainTwin AI
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Truck,
  FlaskConical,
  GitFork,
  BellRing,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useSupplyChainStore } from '../../store/useSupplyChainStore';
import { signOut, auth } from '../../lib/firebase';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, setUser, mode, alerts } = useSupplyChainStore();

  const pendingAlertsCount = alerts.length;

  const handleSignOut = async () => {
    try {
      if (auth) await signOut(auth);
      setUser(null);
    } catch (err) {
      console.warn('Sign out error:', err);
      setUser(null);
    }
  };

  const navItems = [
    { name: 'Live Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Data Manager', path: '/data', icon: Database },
    { name: 'Backup Suppliers', path: '/suppliers', icon: Truck },
    { name: 'What-If Simulator', path: '/simulator', icon: FlaskConical },
    { name: 'Recovery Planner', path: '/planner', icon: GitFork },
    {
      name: 'Alerts & History',
      path: '/alerts',
      icon: BellRing,
      badge: pendingAlertsCount > 0 ? pendingAlertsCount : undefined,
    },
    { name: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen transition-all duration-300 border-r z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      } bg-navy-900 border-slate-800 text-slate-200`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-blue-600 to-teal-400 p-[2px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ChainTwin<span className="text-teal-400"> AI</span>
              </span>
              <span className="block text-[10px] font-medium text-slate-400 -mt-0.5 tracking-wider uppercase">
                Autonomous Twin
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-blue-600 to-teal-400 p-[2px]">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-teal-400" />
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Mode Indicator Bar */}
      <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-950/40">
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide ${
            mode === 'LIVE'
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
              : 'bg-purple-950/40 text-purple-400 border border-purple-500/30'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                mode === 'LIVE' ? 'bg-emerald-400' : 'bg-purple-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                mode === 'LIVE' ? 'bg-emerald-500' : 'bg-purple-500'
              }`}
            />
          </span>
          {!collapsed && <span>MODE: {mode} TWIN</span>}
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {!collapsed && item.badge !== undefined && (
                <span className="ml-auto px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center font-bold text-sm text-white shrink-0">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'M'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.displayName || 'Plant Manager'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || 'manager@tiruppur.com'}
              </p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
