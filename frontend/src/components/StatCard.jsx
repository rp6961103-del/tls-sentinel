import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', badge }) {
  const colorMap = {
    red: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      iconBg: 'bg-rose-500/20 text-rose-400',
    },
    orange: {
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      iconBg: 'bg-orange-500/20 text-orange-400',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      iconBg: 'bg-amber-500/20 text-amber-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
    blue: {
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      iconBg: 'bg-sky-500/20 text-sky-400',
    },
    indigo: {
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      iconBg: 'bg-indigo-500/20 text-indigo-400',
    },
  }[color] || {
    bg: 'bg-slate-800 text-slate-200 border-slate-700',
    iconBg: 'bg-slate-700 text-slate-300',
  };

  return (
    <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-100 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colorMap.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{subtitle}</span>
        {badge && (
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${colorMap.bg}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
