import React from 'react';
import { ShieldCheck, Plus, Sparkles, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ onOpenAddModal, activeAlertsCount = 0 }) {
  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
        <span className="text-xs font-semibold text-slate-300">
          SOC Environment: <span className="text-emerald-400 font-mono">ACTIVE DEFENSE</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-xs text-slate-400 font-mono hidden md:inline">
          Allowlist: *.demo.local, localhost, sandbox
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/demo"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Demo</span>
        </Link>

        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Endpoint</span>
          </button>
        )}

        <Link
          to="/alerts"
          className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {activeAlertsCount > 9 ? '9+' : activeAlertsCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
