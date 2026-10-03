import React from 'react';
import { CheckSquare, ShieldCheck, AlertCircle, Clock } from 'lucide-react';

export default function RemediationPanel({ findings = [], businessCriticality = 'HIGH' }) {
  if (!findings || findings.length === 0) {
    return (
      <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 text-center">
        <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-200">No Remediation Required</h4>
        <p className="text-xs text-slate-400 mt-1">
          Endpoint conforms to modern TLS 1.2/1.3 standards with valid non-expiring certificates.
        </p>
      </div>
    );
  }

  // Priority mapping helper
  const getPriority = (f) => {
    const r = f.rule_id || '';
    if (['CERT_EXPIRED', 'CERT_EXPIRY_7D', 'LEGACY_SSL_20', 'LEGACY_SSL_30', 'CIPHER_NULL', 'CIPHER_RC4'].includes(r)) {
      return { level: 'P1', label: 'P1 — IMMEDIATE', sla: '24 Hours', color: 'rose' };
    }
    if (['CERT_EXPIRY_15D', 'LEGACY_TLS_10', 'CIPHER_3DES', 'CERT_HOSTNAME_MISMATCH'].includes(r)) {
      if (businessCriticality === 'CRITICAL') {
        return { level: 'P1', label: 'P1 — IMMEDIATE (Critical Asset)', sla: '24 Hours', color: 'rose' };
      }
      return { level: 'P2', label: 'P2 — HIGH', sla: '3-5 Days', color: 'orange' };
    }
    if (['CERT_EXPIRY_30D', 'LEGACY_TLS_11'].includes(r)) {
      return { level: 'P3', label: 'P3 — PLANNED', sla: '14 Days', color: 'amber' };
    }
    return { level: 'P4', label: 'P4 — INFORMATIONAL', sla: 'Routine', color: 'sky' };
  };

  // Group or sort findings by priority
  const items = findings.map((f) => ({
    ...f,
    priorityMeta: getPriority(f),
  }));

  const orderMap = { P1: 1, P2: 2, P3: 3, P4: 4 };
  items.sort((a, b) => orderMap[a.priorityMeta.level] - orderMap[b.priorityMeta.level]);

  return (
    <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
          <CheckSquare className="w-4 h-4 text-sky-400" />
          <span>Prioritized Remediation Action Plan</span>
        </div>
        <span className="text-xs text-slate-400">
          Ranked by cryptographic severity & asset criticality
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const meta = item.priorityMeta;
          const badgeClass = {
            rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
            orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
            amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
            sky: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          }[meta.color];

          return (
            <div
              key={idx}
              className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded font-bold border text-[11px] ${badgeClass}`}>
                    {meta.label}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px] font-semibold">{item.rule_id}</span>
                </div>
                <h5 className="font-bold text-slate-100 text-sm">{item.title}</h5>
                <p className="text-slate-200 font-medium leading-relaxed">
                  <strong className="text-sky-400">Action: </strong>
                  {item.recommendation}
                </p>
                <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  <strong className="text-slate-300">Why this action was prioritized: </strong>
                  <span>{item.explanation}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Observed Evidence: <span className="font-mono text-amber-300/90">{item.evidence}</span>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between gap-1 text-[11px] shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Target SLA</span>
                <span className="font-mono font-bold text-slate-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>{meta.sla}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
