import React from 'react';
import { AlertCircle, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function FindingCard({ finding }) {
  if (!finding) return null;

  return (
    <div className="bg-slate-950/70 rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-semibold border border-slate-700">
            {finding.rule_id}
          </span>
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            {finding.category}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            +{finding.score} pts
          </span>
          <RiskBadge severity={finding.severity} size="sm" />
        </div>
      </div>

      <h4 className="text-sm font-bold text-slate-100 mb-2">
        {finding.title}
      </h4>

      {/* Technical Evidence */}
      <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          Observed Technical Evidence
        </span>
        <code className="text-amber-300 font-mono block break-words">
          {finding.evidence}
        </code>
      </div>

      {/* Impact Explanation */}
      <div className="mt-3 text-xs text-slate-400 leading-relaxed">
        <span className="text-slate-300 font-medium">Risk Impact: </span>
        {finding.explanation}
      </div>

      {/* Recommended Action */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-emerald-400">Remediation: </span>
          <span className="text-slate-300">{finding.recommendation}</span>
        </div>
      </div>
    </div>
  );
}
