import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ExternalLink, ShieldAlert, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function EndpointTable({ endpoints = [], onScan, scanningId = null }) {
  if (!endpoints || endpoints.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-xl p-12 border border-slate-800 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-300">No Endpoints Found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No authorized endpoints match the filter criteria. Add a host within the defensive allowlist to begin monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Endpoint</th>
              <th className="py-3 px-4">Environment</th>
              <th className="py-3 px-4">Certificate Expiry</th>
              <th className="py-3 px-4">TLS Version</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Alerts</th>
              <th className="py-3 px-4">Last Scanned</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {endpoints.map((ep) => {
              const scan = ep.latest_scan;
              const cert = scan?.certificate;
              const daysRemaining = cert?.days_remaining;

              // Format expiry display
              let expiryBadge = null;
              if (daysRemaining !== undefined && daysRemaining !== null) {
                if (daysRemaining < 0) {
                  expiryBadge = (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Expired ({Math.abs(daysRemaining)}d ago)</span>
                    </span>
                  );
                } else if (daysRemaining <= 7) {
                  expiryBadge = (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{daysRemaining} days remaining</span>
                    </span>
                  );
                } else if (daysRemaining <= 15) {
                  expiryBadge = (
                    <span className="inline-flex items-center gap-1 text-orange-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{daysRemaining} days remaining</span>
                    </span>
                  );
                } else if (daysRemaining <= 30) {
                  expiryBadge = (
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <span>{daysRemaining} days</span>
                    </span>
                  );
                } else {
                  expiryBadge = (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{daysRemaining} days</span>
                    </span>
                  );
                }
              } else {
                expiryBadge = <span className="text-slate-500 italic">Not Scanned</span>;
              }

              // TLS badge
              const tlsVersion = scan?.tls_version || 'N/A';
              const isLegacyTls = ['TLS 1.0', 'TLS 1.1', 'SSL'].some((x) =>
                tlsVersion.toUpperCase().includes(x)
              );

              return (
                <tr key={ep.id} className="hover:bg-slate-800/30 transition">
                  {/* Endpoint Hostname & Port */}
                  <td className="py-3 px-4 font-mono font-medium text-slate-100">
                    <Link
                      to={`/endpoints/${ep.id}`}
                      className="hover:text-sky-400 transition flex items-center gap-1.5"
                    >
                      <span>{ep.hostname}</span>
                      <span className="text-slate-500 font-normal">:{ep.port}</span>
                    </Link>
                    <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                      {ep.owner} &bull; <span className="uppercase text-[10px] font-semibold text-slate-400">{ep.business_criticality}</span>
                    </div>
                  </td>

                  {/* Environment */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                      {ep.environment}
                    </span>
                  </td>

                  {/* Expiry */}
                  <td className="py-3 px-4">{expiryBadge}</td>

                  {/* TLS Version */}
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded ${
                        isLegacyTls
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {tlsVersion}
                    </span>
                  </td>

                  {/* Risk Level */}
                  <td className="py-3 px-4">
                    <RiskBadge
                      severity={scan?.severity || 'LOW'}
                      score={scan?.risk_score ?? 0}
                      size="sm"
                    />
                  </td>

                  {/* Alerts */}
                  <td className="py-3 px-4">
                    {ep.open_alerts_count > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        {ep.open_alerts_count} Open
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">0</span>
                    )}
                  </td>

                  {/* Last Scanned */}
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    {ep.last_scan_at
                      ? new Date(ep.last_scan_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : 'Never'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onScan && onScan(ep.id)}
                      disabled={scanningId === ep.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 transition"
                      title="Inspect now"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${scanningId === ep.id ? 'animate-spin text-sky-400' : ''}`}
                      />
                      <span className="text-[11px] font-medium">Scan</span>
                    </button>
                    <Link
                      to={`/endpoints/${ep.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition text-[11px] font-medium"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
