import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  CalendarClock, 
  ShieldAlert, 
  Cpu, 
  AlertOctagon, 
  Calculator, 
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import RiskGauge from '../components/RiskGauge';
import RiskBadge from '../components/RiskBadge';
import { demoApi, endpointsApi } from '../api';

export default function DemoScenario() {
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [endpointId, setEndpointId] = useState(null);
  
  // Track "What changed?" deltas for the judge
  const [lastChange, setLastChange] = useState({
    title: 'Baseline Loaded',
    parameter: 'Certificate validity: 90 days | TLS 1.3 | Strong Cipher',
    rule: 'None (Compliant)',
    contribution: '0 pts',
    explanation: 'Initial healthy condition. All RFC 8996 cryptographic baselines satisfied.'
  });

  const fetchCurrentDemo = async () => {
    try {
      const epListRes = await endpointsApi.list({ search: 'payment.demo.local' });
      if (epListRes.data && epListRes.data.length > 0) {
        const ep = epListRes.data[0];
        setEndpointId(ep.id);
        const epDetailRes = await endpointsApi.get(ep.id);
        setScan(epDetailRes.data.latest_scan);
      }
    } catch (err) {
      console.error('Failed to load demo endpoint:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentDemo();
  }, []);

  const handleAction = async (actionType, apiCall, changeMeta) => {
    setActionLoading(actionType);
    try {
      const res = await apiCall();
      setScan(res.data.scan);
      setLastChange(changeMeta);
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <p className="text-sm font-medium">Initializing live demo sandbox...</p>
      </div>
    );
  }

  const cert = scan?.certificate;
  const factors = scan?.factors || [];
  const findings = scan?.findings || [];
  const score = scan?.risk_score ?? 0;
  const severity = scan?.severity || 'LOW';

  // Determine current stage for visual step progression (0 -> 40 -> 65 -> 85)
  const isStage0 = score === 0;
  const isStage40 = score === 40;
  const isStage65 = score === 65;
  const isStage85 = score >= 85;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. TOP LIVE SECURITY POSTURE HEADER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                Live Security Posture Monitor
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="font-mono text-xs text-sky-400 font-bold">payment.demo.local</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-white">
                POSTURE: <span className={
                  severity === 'CRITICAL' ? 'text-rose-400' :
                  severity === 'HIGH' ? 'text-orange-400' :
                  severity === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                }>{severity}</span>
              </h1>
              <RiskBadge severity={severity} score={score} size="lg" />
            </div>
          </div>

          {endpointId && (
            <Link
              to={`/endpoints/${endpointId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shrink-0 transition"
            >
              <span>Inspect Full Evidence Dossier</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            </Link>
          )}
        </div>

        {/* Live Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Current Risk Score</span>
            <span className={`text-xl font-mono font-black ${
              score >= 75 ? 'text-rose-400' : score >= 50 ? 'text-orange-400' : score >= 25 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {score} <span className="text-xs font-normal text-slate-500">/ 100</span>
            </span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Days Remaining</span>
            <span className={`text-xl font-mono font-black ${
              cert?.days_remaining <= 7 ? 'text-rose-400' : cert?.days_remaining <= 30 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {cert?.days_remaining !== undefined && cert?.days_remaining !== null ? `${cert.days_remaining}d` : 'N/A'}
              {cert?.days_remaining < 0 && ' (EXP)'}
            </span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">TLS Protocol</span>
            <span className={`text-base font-mono font-bold block truncate ${
              (scan?.tls_version || '').includes('1.0') ? 'text-rose-400' : 'text-slate-100'
            }`}>
              {scan?.tls_version || 'Unknown'}
            </span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Negotiated Cipher</span>
            <span className={`text-xs font-mono font-bold block truncate ${
              (scan?.negotiated_cipher || '').includes('3DES') ? 'text-rose-400' : 'text-slate-100'
            }`} title={scan?.negotiated_cipher}>
              {scan?.negotiated_cipher || 'None'}
            </span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Active Findings</span>
            <span className="text-xl font-mono font-black text-slate-100">
              {findings.length}
            </span>
          </div>
        </div>

        {/* 2. VISUAL TRANSITION BREADCRUMB: 0 -> 40 -> 65 -> 85 */}
        <div className="pt-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Deterministic Posture Progression:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
              isStage0
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-bold">Step 1: Baseline</span>
              </div>
              <span className="font-mono font-bold">0 / LOW</span>
            </div>

            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
              isStage40
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="font-bold">Step 2: Expiry &le;7d</span>
              </div>
              <span className="font-mono font-bold">40 / MEDIUM</span>
            </div>

            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
              isStage65
                ? 'bg-orange-500/15 border-orange-500 text-orange-300 ring-2 ring-orange-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="font-bold">Step 3: Legacy TLS</span>
              </div>
              <span className="font-mono font-bold">65 / HIGH</span>
            </div>

            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
              isStage85
                ? 'bg-rose-500/15 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="font-bold">Step 4: Weak Cipher</span>
              </div>
              <span className="font-mono font-bold">85 / CRITICAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIMULATION CONTROLS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Interactive Degradation Triggers
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Directly executes full analysis pipeline without page reload
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Button 1: Reset */}
          <button
            onClick={() => handleAction('reset', demoApi.reset, {
              title: 'Reset Demo to Baseline',
              parameter: 'Certificate validity: 5 days → 90 days | Protocol: TLS 1.3 | Cipher: AES-256-GCM',
              rule: 'None (Clean Baseline)',
              contribution: 'Score reset to 0 (LOW)',
              explanation: 'All previous vulnerabilities cleared. Baseline compliance restored.'
            })}
            disabled={actionLoading !== null}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition group disabled:opacity-50"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <RotateCcw className={`w-4 h-4 text-emerald-400 ${actionLoading === 'reset' ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Reset
              </span>
            </div>
            <span className="font-bold text-slate-200 text-xs mb-1 group-hover:text-emerald-300">
              Reset Demo
            </span>
            <span className="text-[11px] text-slate-400">
              90 days &bull; TLS 1.3 &bull; LOW (0)
            </span>
          </button>

          {/* Button 2: Simulate Expiring */}
          <button
            onClick={() => handleAction('expiring', () => demoApi.expiring(5), {
              title: 'Certificate Expiry Degradation',
              parameter: 'Certificate validity: 90 days → 5 days',
              rule: 'CERT_EXPIRY_7D (Certificate expiring in <= 7 days)',
              contribution: '+40 points',
              explanation: 'Certificate is within 7-day cutoff window without sufficient operational buffer.'
            })}
            disabled={actionLoading !== null}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition group disabled:opacity-50"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <CalendarClock className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                +40 pts
              </span>
            </div>
            <span className="font-bold text-slate-200 text-xs mb-1 group-hover:text-amber-300">
              Simulate Expiring
            </span>
            <span className="text-[11px] text-slate-400">
              Drop to 5 days remaining
            </span>
          </button>

          {/* Button 3: Enable Legacy TLS */}
          <button
            onClick={() => handleAction('legacyTls', () => demoApi.legacyTls('TLS 1.0'), {
              title: 'Protocol Downgrade to Legacy TLS',
              parameter: 'Negotiated protocol: TLS 1.3 → TLS 1.0',
              rule: 'LEGACY_TLS_10 (RFC 8996 Deprecated Protocol)',
              contribution: '+25 points (Cumulative: 65)',
              explanation: 'Server allows TLS 1.0 connections, violating modern PCI-DSS baselines.'
            })}
            disabled={actionLoading !== null}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition group disabled:opacity-50"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <Cpu className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                +25 pts
              </span>
            </div>
            <span className="font-bold text-slate-200 text-xs mb-1 group-hover:text-orange-300">
              Enable Legacy TLS
            </span>
            <span className="text-[11px] text-slate-400">
              Downgrade to TLS 1.0
            </span>
          </button>

          {/* Button 4: Enable Weak Cipher */}
          <button
            onClick={() => handleAction('weakCipher', () => demoApi.weakCipher('DES-CBC3-SHA'), {
              title: 'Weak 64-bit Cipher Negotiation',
              parameter: 'Negotiated cipher: TLS_AES_256_GCM_SHA384 → DES-CBC3-SHA (3DES)',
              rule: 'CIPHER_3DES (Sweet32 Vulnerable Suite)',
              contribution: '+20 points (Cumulative: 85 - CRITICAL)',
              explanation: '3DES block cipher enables Birthday attack plaintext collision recovery.'
            })}
            disabled={actionLoading !== null}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition group disabled:opacity-50"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                +20 pts
              </span>
            </div>
            <span className="font-bold text-slate-200 text-xs mb-1 group-hover:text-rose-300">
              Enable Weak Cipher
            </span>
            <span className="text-[11px] text-slate-400">
              Enable 3DES (CRITICAL 85)
            </span>
          </button>

          {/* Button 5: Expire Certificate */}
          <button
            onClick={() => handleAction('expired', () => demoApi.expired(-5), {
              title: 'Outright Certificate Expiry',
              parameter: 'Certificate validity: Dropped to -5 days (Past Validity)',
              rule: 'CERT_EXPIRED (Certificate Expired)',
              contribution: '+50 points (CRITICAL)',
              explanation: 'Active production endpoint serving expired certificate. Immediate client failures.'
            })}
            disabled={actionLoading !== null}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition group disabled:opacity-50"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                +50 pts
              </span>
            </div>
            <span className="font-bold text-slate-200 text-xs mb-1 group-hover:text-rose-400">
              Expire Certificate
            </span>
            <span className="text-[11px] text-slate-400">
              5 days overdue (CRITICAL)
            </span>
          </button>
        </div>
      </div>

      {/* 4. "WHAT CHANGED?" SECTION */}
      {lastChange && (
        <div className="bg-slate-900/80 rounded-xl p-5 border border-sky-500/30 shadow-md">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Change Detected &mdash; Real-Time Pipeline Delta
              </span>
            </div>
            <span className="text-[11px] font-mono text-sky-400 font-bold">{lastChange.title}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">State Transition</span>
              <code className="text-amber-300 font-mono font-bold block">{lastChange.parameter}</code>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Triggered Security Rule</span>
              <code className="text-sky-400 font-mono font-bold block">{lastChange.rule}</code>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Risk Contribution</span>
              <span className="text-rose-400 font-mono font-extrabold text-sm block">{lastChange.contribution}</span>
            </div>
          </div>
          
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{lastChange.explanation}</span>
          </div>
        </div>
      )}

      {/* 5. EXPLAIN RISK — DETERMINISTIC LEDGER SCREEN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Final Risk Score Card */}
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Final Risk Score
              </h3>
              <RiskBadge severity={severity} score={score} />
            </div>

            <div className="text-center py-4">
              <span className={`text-6xl font-black font-mono tracking-tight block ${
                score >= 75 ? 'text-rose-400' : score >= 50 ? 'text-orange-400' : score >= 25 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {score}
              </span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mt-1 block">
                / 100 &bull; {severity}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed text-center px-4">
              Deterministic, evidence-backed evaluation derived exclusively from verified cryptographic parameters.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Standard: RFC 8996 & PCI-DSS 4.0
          </div>
        </div>

        {/* Right (2 cols): Complete Risk Ledger with Raw Evidence */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Explain Risk: Mathematical Factor Ledger
              </h3>
            </div>
            <span className="font-mono text-xs text-sky-400 font-bold">{factors.length} Active Rules</span>
          </div>

          {factors.length === 0 ? (
            <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-300">Clean Cryptographic Baseline</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Total Score: 0/100 (LOW). No degradation rules triggered. Certificate has 90 days validity remaining, TLS 1.3 is active, and high-assurance AEAD ciphers are negotiated.
              </p>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              <div className="divide-y divide-slate-800 bg-slate-950 p-4 rounded-xl border border-slate-800">
                {factors.map((factor, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-100 font-bold">{factor.rule}</span>
                        <span className="text-[10px] text-sky-400 px-1.5 py-0.2 bg-slate-800 rounded font-sans">
                          {factor.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-sans">
                        Evidence: <strong className="text-amber-300 font-mono">{factor.evidence}</strong>
                      </div>
                    </div>
                    <span className="text-rose-400 font-black text-base shrink-0">
                      +{factor.score}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Ledger Sum */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-sans">
                <div>
                  <span className="font-bold text-slate-200 block text-xs">TOTAL COMPOSITE RISK DETERMINATION</span>
                  <span className="text-xs text-slate-400 font-mono font-semibold">
                    {factors.map(f => f.score).join(' + ')} = {score}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className={`text-2xl font-black ${
                    score >= 75 ? 'text-rose-400' : score >= 50 ? 'text-orange-400' : score >= 25 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {score} / 100
                  </span>
                  <span className="text-xs text-slate-400 font-sans font-bold block">
                    {severity}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. PRIORITIZED REMEDIATION ACTION PLAN (P1 IMMEDIATE) */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Prioritized Remediation Action Plan
            </h3>
            <p className="text-[11px] text-slate-400">
              Immediate operational remediation steps ranked by cryptographic severity
            </p>
          </div>
          {score >= 75 && (
            <span className="px-3 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs">
              P1 &mdash; IMMEDIATE ACTION REQUIRED
            </span>
          )}
        </div>

        {findings.length === 0 ? (
          <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
            No remediation required. Endpoint conforms to modern TLS 1.2/1.3 standards.
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {findings.map((f, idx) => {
              const isP1 = ['CERT_EXPIRED', 'CERT_EXPIRY_7D', 'CIPHER_3DES', 'LEGACY_TLS_10'].includes(f.rule_id);
              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                        isP1 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      }`}>
                        {isP1 ? 'P1 — IMMEDIATE' : 'P2 — HIGH'}
                      </span>
                      <span className="font-mono text-slate-400 font-semibold">{f.rule_id}</span>
                    </div>
                    <h5 className="font-semibold text-slate-100 text-sm">{f.title}</h5>
                    <p className="text-slate-200 font-medium">
                      <strong className="text-sky-400">Action: </strong>
                      {f.recommendation}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      <strong className="text-slate-300">Why this action was prioritized: </strong>
                      {f.explanation}
                    </p>
                  </div>

                  <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-1 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4 text-[11px]">
                    <span className="text-slate-500">Target SLA</span>
                    <span className="font-mono font-bold text-slate-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400" />
                      <span>{isP1 ? '24 Hours' : '3-5 Days'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
