import React from 'react';

export default function RiskGauge({ score = 0, severity = 'LOW', size = 140 }) {
  const cleanScore = Math.min(100, Math.max(0, score || 0));
  
  // Color selection
  const getColor = (s) => {
    if (s >= 75) return { stroke: '#ef4444', text: 'text-rose-400', label: 'CRITICAL RISK' };
    if (s >= 50) return { stroke: '#f97316', text: 'text-orange-400', label: 'HIGH RISK' };
    if (s >= 25) return { stroke: '#f59e0b', text: 'text-amber-400', label: 'MEDIUM RISK' };
    return { stroke: '#10b981', text: 'text-emerald-400', label: 'LOW RISK' };
  };

  const style = getColor(cleanScore);
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 240 degree arc gauge
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * cleanScore) / 100;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg
          className="transform rotate-[135deg] overflow-visible"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={style.stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className={`text-4xl font-extrabold tracking-tight ${style.text}`}>
            {cleanScore}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>

      <div className="text-center mt-1">
        <span className={`text-xs font-bold tracking-wider px-2 py-0.5 rounded ${style.text} bg-slate-800/80 border border-slate-700`}>
          {style.label}
        </span>
      </div>
    </div>
  );
}
