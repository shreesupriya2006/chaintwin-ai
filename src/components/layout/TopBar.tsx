// Persistent Top Bar with Live Real Clock, Timezone & Projection Controls
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Clock,
  Calendar,
  Sun,
  Moon,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
  RefreshCw,
  X,
} from 'lucide-react';
import { useSupplyChainStore } from '../../store/useSupplyChainStore';
import { formatDate } from '../../../engine';

interface TopBarProps {
  title: string;
  onOpenCommandPalette?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onOpenCommandPalette }) => {
  const {
    now,
    viewDate,
    setViewDate,
    mode,
    timezone,
    setTimezone,
    theme,
    toggleTheme,
    tickClock,
    alerts,
    lastUpdated,
    isLiveConnected,
    dismissAlert,
  } = useSupplyChainStore();

  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false);

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      tickClock();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickClock]);

  const isFutureView = viewDate.getTime() > now.getTime() + 60000;
  const timezonesList = [
    'Asia/Kolkata',
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Singapore',
    'Asia/Tokyo',
  ];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setViewDate(new Date());
    } else {
      const selected = new Date(val);
      setViewDate(selected);
    }
  };

  const handleResetToNow = () => {
    setViewDate(new Date());
  };

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
      {/* Left: Title & Mode Pill */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          {mode === 'LIVE' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LIVE TWIN</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-600/40">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span>SIMULATION MODE</span>
            </div>
          )}

          {isFutureView && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-600/40 border-dashed animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>Projection — based on assumptions</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Search & Command Palette trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors text-xs border border-slate-200 dark:border-slate-700"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search or jump to...</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[10px] font-mono shadow-sm">
          Ctrl+K
        </kbd>
      </button>

      {/* Right: Real Clock, Date Controls, Theme & Alerts */}
      <div className="flex items-center gap-3">
        {/* Real Live Clock & Timezone */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
            {format(now, 'HH:mm:ss')}
          </span>
          <span className="text-slate-400">|</span>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {format(now, 'dd MMM yyyy')}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowTimezoneSelect(!showTimezoneSelect)}
              className="text-[11px] font-mono text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1"
              title="Change Timezone"
            >
              <Globe className="w-3 h-3" />
              <span>{timezone.split('/')[1] || timezone}</span>
            </button>

            {showTimezoneSelect && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Timezone
                </div>
                {timezonesList.map((tz) => (
                  <button
                    key={tz}
                    onClick={() => {
                      setTimezone(tz);
                      setShowTimezoneSelect(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between ${
                      timezone === tz ? 'text-blue-500 font-semibold' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{tz}</span>
                    {timezone === tz && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Date Control ("Now" vs Pick Date) */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={formatDate(viewDate)}
            onChange={handleDateChange}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Pick projection view date"
          />
          {isFutureView && (
            <button
              onClick={handleResetToNow}
              className="px-2 py-1 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
              title="Reset view to real current time"
            >
              Now
            </button>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsMenu(!showAlertsMenu)}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Early Warning Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showAlertsMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800 dark:text-white">
                  Notifications & Early Warnings ({alerts.length})
                </span>
                <button
                  onClick={() => setShowAlertsMenu(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No active alerts. Supply chain is operating normally.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {alert.title}
                        </span>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {alert.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
