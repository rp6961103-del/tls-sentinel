import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  Server, 
  ShieldAlert, 
  Clock, 
  CheckCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import CertificateDetails from '../components/CertificateDetails';
import TLSDetails from '../components/TLSDetails';
import FindingCard from '../components/FindingCard';
import EvidencePanel from '../components/EvidencePanel';
import RemediationPanel from '../components/RemediationPanel';
import { endpointsApi } from '../api';

export default function EndpointDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, evidence, remediation, history

  const fetchEndpoint = async () => {
    setLoading(true);
    try {
      const res = await endpointsApi.get(id);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch endpoint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoint();
  }, [id]);

  const handleScanNow = async () => {
    setScanning(true);
    try {
      await endpointsApi.scan(id);
      await fetchEndpoint();
    } catch (err) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <p className="text-sm font-medium">Inspecting endpoint security posture...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
          <h4 className="font-bold text-base mb-1">Error Loading Endpoint</h4>
          <p className="text-xs">{error || 'Endpoint not found.'}</p>
          <Link
            to="/endpoints"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-sky-400 hover:text-sky-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Inventory</span>
          </Link>
        </div>
      </div>
    );
  }

  const ep = data.endpoint;
  const scan = data.latest_scan;
  const cert = scan?.certificate;
  const findings = scan?.findings || [];
  const recentScans = data.recent_scans || [];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/endpoints"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-mono font-bold text-slate-100 tracking-tight">
                {ep.hostname}
              </h1>
              <span className="text-base text-slate-500 font-mono">:{ep.port}</span>
              <RiskBadge severity={scan?.severity || 'LOW'} score={scan?.risk_score ?? 0} size="md" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-sans">
              <span className="capitalize px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {ep.environment}
              </span>
              <span>&bull;</span>
              <span>Owner: {ep.owner}</span>
              <span>&bull;</span>
              <span>Asset Criticality: <strong className="text-slate-200">{ep.business_criticality}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScanNow}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Inspecting...' : 'Scan Endpoint Now'}</span>
          </button>
        </div>
      </div>

      {/* QUICK HIGHLIGHT BANNER: Overall Risk Score + Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Risk Gauge (1 col) */}
        <div className="lg:col-span-1">
          <RiskGauge
            score={scan?.risk_score ?? 0}
            severity={scan?.severity || 'LOW'}
            size={160}
          />
        </div>

        {/* Quick summary stats (3 cols) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Certificate Expiry</span>
            <div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {cert?.days_remaining !== undefined && cert?.days_remaining !== null 
                  ? `${cert.days_remaining} Days` 
                  : 'N/A'}
              </div>
              <span className="text-[11px] text-slate-500">
                {cert?.valid_until ? `Expires ${new Date(cert.valid_until).toLocaleDateString()}` : 'No certificate on file'}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              {cert?.days_remaining <= 7 ? (
                <span className="text-rose-400 font-bold">Immediate renewal mandatory</span>
              ) : cert?.days_remaining <= 30 ? (
                <span className="text-amber-400 font-medium">Renewal cycle active</span>
              ) : (
                <span className="text-emerald-400 font-medium">Certificate healthy</span>
              )}
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Protocol Security</span>
            <div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {scan?.tls_version || 'Unknown'}
              </div>
              <span className="text-[11px] text-slate-500 truncate block">
                {scan?.negotiated_cipher || 'None'}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              {['TLS 1.0', 'TLS 1.1', 'SSL'].some(x => (scan?.tls_version || '').includes(x)) ? (
                <span className="text-rose-400 font-bold">Non-compliant legacy version</span>
              ) : (
                <span className="text-emerald-400 font-medium">RFC 8996 compliant</span>
              )}
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Security Findings</span>
            <div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {findings.length}
              </div>
              <span className="text-[11px] text-slate-500">
                {findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length} Critical/High findings
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              Last scanned: {ep.last_scan_at ? new Date(ep.last_scan_at).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="border-b border-slate-800 flex items-center gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition relative ${
            activeTab === 'overview'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Cryptographic Details
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-3 transition relative flex items-center gap-1.5 ${
            activeTab === 'evidence'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Explain Risk & Audit Evidence</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-sky-400">
            {scan?.factors?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('remediation')}
          className={`pb-3 transition relative flex items-center gap-1.5 ${
            activeTab === 'remediation'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Remediation Action Plan</span>
          {findings.length > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-[10px] font-mono text-rose-400 font-bold">
              {findings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 transition relative ${
            activeTab === 'history'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Scan History ({recentScans.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW (Certificate + TLS Specs + Findings list) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <CertificateDetails certificate={cert} />
          <TLSDetails tlsVersion={scan?.tls_version} cipher={scan?.negotiated_cipher} />

          {/* Granular Findings */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Active Security Findings ({findings.length})
            </h3>
            {findings.length === 0 ? (
              <div className="p-8 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                No active security findings detected for this endpoint.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {findings.map((f) => (
                  <FindingCard key={f.id} finding={f} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXPLAIN RISK & EVIDENCE PANEL */}
      {activeTab === 'evidence' && (
        <EvidencePanel scan={scan} endpoint={ep} />
      )}

      {/* TAB 3: REMEDIATION ACTION PLAN */}
      {activeTab === 'remediation' && (
        <RemediationPanel findings={findings} businessCriticality={ep.business_criticality} />
      )}

      {/* TAB 4: SCAN HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Scan ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Protocol</th>
                <th className="py-3 px-4">Cipher</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentScans.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">#{s.id}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(s.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{s.tls_version || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono text-[11px] truncate max-w-xs">{s.negotiated_cipher || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono font-bold">{s.risk_score}</td>
                  <td className="py-3 px-4">
                    <RiskBadge severity={s.severity} score={s.risk_score} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
