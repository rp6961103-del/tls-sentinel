import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

export function RiskDistributionChart({ data }) {
  const chartData = data && data.some(d => d.value > 0) ? data : [
    { name: 'Low', value: 1, color: '#10b981' }
  ];

  return (
    <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Risk Distribution
        </h4>
        <span className="text-[11px] text-slate-400">By Endpoint Severity</span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800/80 text-xs">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-400">{item.name}:</span>
            <span className="font-semibold text-slate-200">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExpiryBarChart({ data }) {
  const chartData = data || [];

  return (
    <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Certificate Expiry Timeline
        </h4>
        <span className="text-[11px] text-slate-400">Remaining Validity Window</span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="range" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.fill || '#38bdf8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>CRITICAL thresholds: &le;7 days & Expired</span>
        <span className="text-rose-400 font-medium">Requires Priority Action</span>
      </div>
    </div>
  );
}
