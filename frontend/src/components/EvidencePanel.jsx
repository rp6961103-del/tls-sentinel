import React from 'react';
import { Terminal, Shield, Calculator, CheckCircle2, AlertOctagon, Info } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function EvidencePanel({ scan, endpoint }) {
  if (!scan) return null;

  const factors = scan.factors || [];
  const cert = scan.certificate;
  const score = scan.risk_score ?? 0;
  const severity = scan.severity || 'LOW';

  return (
    <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Diagnostic Evidence & Explainable Audit Log
            </h3>
            <p className="text-[11px] text-slate-500">
              Cryptographic provenance and rule-by-rule risk determination
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400">
            Scan #{scan.id} &bull; {new Date(scan.timestamp).toLocaleString()}
          </span>
          <RiskBadge severity={severity} score={score} />
        </div>
      </div>

      {/* Target Asset Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Target Endpoint</span>
          <span className="font-mono text-slate-200 font-bold">{endpoint?.hostname || 'Unknown'}:{endpoint?.port || 443}</span>
        </div>
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Days Remaining</span>
          <span className={`font-mono font-bold ${cert?.days_remaining <= 7 ? 'text-rose-400' : cert?.days_remaining <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {cert?.days_remaining !== undefined && cert?.days_remaining !== null ? `${cert.days_remaining} Days` : 'N/A'}
          </span>
        </div>
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Protocol Inspected</span>
          <span className="font-mono text-slate-200 font-bold">{scan.tls_version || 'None'}</span>
        </div>
        <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Cipher Suite</span>
          <span className="font-mono text-slate-200 text-[11px] truncate block font-bold" title={scan.negotiated_cipher}>
            {scan.negotiated_cipher || 'None'}
          </span>
        </div>
      </div>

      {/* EXPLAIN RISK BANNER: FINAL RISK SCORE */}
      <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
            FINAL RISK SCORE
          </span>
          <div className="flex items-baseline gap-3">
            <span className={`text-4xl font-black font-mono tracking-tight ${
              score >= 75 ? 'text-rose-400' : score >= 50 ? 'text-orange-400' : score >= 25 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {score} / 100
            </span>
            <span className={`text-sm font-extrabold uppercase px-2.5 py-0.5 rounded border ${
              score >= 75 ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
              score >= 50 ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
              score >= 25 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
              'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}>
              {severity}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-400 max-w-sm sm:text-right flex items-center sm:justify-end gap-2">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Every point is derived deterministically from verifiable cryptographic evidence rather than an opaque AI prediction.</span>
        </div>
      </div>

      {/* DETERMINISTIC RISK LEDGER */}
      <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Calculator className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Risk Ledger & Evidence Breakdown
            </h4>
          </div>
          <span className="text-xs font-mono text-slate-400">{factors.length} Rules Contributed</span>
        </div>

        {factors.length === 0 ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero security violations detected. Endpoint meets all baseline cryptographic security thresholds. Score: 0/100 (LOW).</span>
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            <div className="divide-y divide-slate-800/80">
              {factors.map((factor, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-100 font-bold text-sm">{factor.rule}</span>
                      <span className="text-[10px] text-sky-400 px-1.5 py-0.2 bg-slate-800 rounded font-sans">
                        {factor.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-sans">
                      Evidence: <strong className="text-amber-300 font-mono">{factor.evidence}</strong>
                    </div>
                  </div>
                  <span className="text-rose-400 font-black text-base shrink-0">
                    +{factor.score}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Equation Footer */}
            <div className="pt-3 mt-2 border-t-2 border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between font-bold text-sm gap-2">
              <span className="text-slate-300 font-sans">TOTAL EQUATION</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">
                  {factors.map(f => f.score).join(' + ')} =
                </span>
                <span className={`text-base font-mono ${
                  score >= 75 ? 'text-rose-400' : score >= 50 ? 'text-orange-400' : score >= 25 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {score} / 100 ({severity})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
