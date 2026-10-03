import React from 'react';

export default function RiskBadge({ severity, score, size = 'md' }) {
  const sev = (severity || (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW')).toUpperCase();

  const config = {
    CRITICAL: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500 animate-pulse',
      label: 'CRITICAL',
    },
    HIGH: {
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      dot: 'bg-orange-500',
      label: 'HIGH',
    },
    MEDIUM: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-500',
      label: 'MEDIUM',
    },
    LOW: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
      label: 'LOW',
    },
  }[sev] || {
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-500',
    label: sev,
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bg} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
      {score !== undefined && score !== null && (
        <span className="opacity-75 text-[10px]">({score})</span>
      )}
    </span>
  );
}
