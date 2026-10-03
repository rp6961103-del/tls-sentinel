import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Server, 
  Bell, 
  FileText, 
  Sparkles,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/endpoints', label: 'Endpoints', icon: Server },
    { to: '/alerts', label: 'Alerts', icon: Bell },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/demo', label: 'Demo Scenario', icon: Sparkles, highlight: true },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
        <div className="h-9 w-9 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-white block leading-none">
            TLS Sentinel
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
            Certificate & Risk Monitor
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Operations
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    : item.highlight
                    ? 'text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Live
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Security Boundary Info Card */}
      <div className="p-4 m-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
          <Lock className="w-3.5 h-3.5" />
          <span>Defensive Boundary</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Only authorized or sandboxed endpoints may be inspected. Mass scanning and external subnet probes are strictly prohibited.
        </p>
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <span>Engine: RFC 8996 Baseline</span>
          <span className="text-emerald-500 font-mono">ENFORCED</span>
        </div>
      </div>
    </aside>
  );
}
