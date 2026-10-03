import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Cpu,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { reportsApi } from '../api';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.summary();
      setSummary(res.data);
    } catch (err) {
      alert(`Failed to load report summary: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <p className="text-sm font-medium">Generating executive compliance reports...</p>
      </div>
    );
  }

  const exp = summary?.certificates_expiring_within || {};
  const dist = summary?.risk_distribution || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <FileText className="w-6 h-6 text-sky-400" />
            <span>Compliance & Audit Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Export cryptographic audit telemetry, expiration risk distributions, and compliance summaries.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <a
            href={reportsApi.exportCsvUrl}
            download
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
          <a
            href={reportsApi.exportJsonUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition"
          >
            <FileCode className="w-4 h-4" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* TOP COMPLIANCE STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Endpoints"
          value={summary?.total_endpoints ?? 0}
          subtitle="Inventoried authorized assets"
          color="blue"
        />
        <StatCard
          title="Healthy Endpoints"
          value={summary?.healthy_endpoints ?? 0}
          subtitle="Low risk posture"
          color="emerald"
          badge="Compliant"
        />
        <StatCard
          title="High / Critical Risks"
          value={(summary?.critical_endpoints ?? 0) + (summary?.high_risk_endpoints ?? 0)}
          subtitle={`${summary?.critical_endpoints ?? 0} Critical &bull; ${summary?.high_risk_endpoints ?? 0} High`}
          color="red"
          badge="Attention"
        />
        <StatCard
          title="Legacy TLS & Weak Ciphers"
          value={(summary?.legacy_tls_count ?? 0) + (summary?.weak_cipher_count ?? 0)}
          subtitle={`${summary?.legacy_tls_count ?? 0} TLS &bull; ${summary?.weak_cipher_count ?? 0} Ciphers`}
          color="orange"
          badge="Deprecate"
        />
      </div>

      {/* BREAKDOWN SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certificate Expiry Windows */}
        <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Certificate Expiry Windows</span>
            </h3>
            <span className="text-[11px] text-slate-500">Lifecycle Forecast</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-rose-400 block">Already Expired (&lt; 0 Days)</span>
                <span className="text-[11px] text-slate-500">Immediate outage risk</span>
              </div>
              <span className="text-lg font-mono font-bold text-rose-400">{exp.expired ?? 0}</span>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-rose-400 block">Expiring within 7 Days</span>
                <span className="text-[11px] text-slate-500">Urgent renewal cycle</span>
              </div>
              <span className="text-lg font-mono font-bold text-rose-400">{exp['7_days'] ?? 0}</span>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-orange-400 block">Expiring within 8-15 Days</span>
                <span className="text-[11px] text-slate-500">Approaching cut-off</span>
              </div>
              <span className="text-lg font-mono font-bold text-orange-400">{exp['15_days'] ?? 0}</span>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-400 block">Expiring within 16-30 Days</span>
                <span className="text-[11px] text-slate-500">Standard renewal window</span>
              </div>
              <span className="text-lg font-mono font-bold text-amber-400">{exp['30_days'] ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Protocol & Cipher Posture */}
        <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Risk & Configuration Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-500">Posture Summary</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Critical Risk Severity (Score &ge; 75)</span>
                <span className="text-[11px] text-slate-500">Severely degraded security</span>
              </div>
              <span className="text-lg font-mono font-bold text-rose-400">{dist.CRITICAL ?? 0}</span>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">High Risk Severity (Score 50-74)</span>
                <span className="text-[11px] text-slate-500">Elevated operational risk</span>
              </div>
              <span className="text-lg font-mono font-bold text-orange-400">{dist.HIGH ?? 0}</span>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Legacy TLS Protocols (TLS 1.0/1.1)</span>
                <span className="text-[11px] text-slate-500">RFC 8996 non-compliant</span>
              </div>
              <span className="text-lg font-mono font-bold text-amber-400">{summary?.legacy_tls_count ?? 0}</span>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Weak Ciphers (3DES, RC4, NULL)</span>
                <span className="text-[11px] text-slate-500">Vulnerable cipher algorithms</span>
              </div>
              <span className="text-lg font-mono font-bold text-amber-400">{summary?.weak_cipher_count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
