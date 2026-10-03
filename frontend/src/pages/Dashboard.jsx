import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  AlertTriangle, 
  CalendarClock, 
  ShieldAlert, 
  Bell, 
  RefreshCw, 
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { RiskDistributionChart, ExpiryBarChart } from '../components/RiskChart';
import { dashboardApi, alertsApi } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await dashboardApi.get();
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 30s
    const timer = setInterval(() => fetchDashboard(), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleResolveAlert = async (alertId) => {
    try {
      await alertsApi.resolve(alertId);
      fetchDashboard();
    } catch (err) {
      alert(`Could not resolve alert: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <p className="text-sm font-medium">Aggregating cryptographic telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-base mb-1">Failed to Connect to Sentinel Engine</h4>
            <p className="text-xs">{error}</p>
          </div>
          <button
            onClick={() => fetchDashboard(true)}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <span>Security Operations Dashboard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
              RFC 8996 COMPLIANT
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated certificate lifecycle inspection, weak cipher detection, and risk scoring across authorized assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
          <Link
            to="/demo"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 hover:brightness-110 text-xs font-bold transition shadow-sm"
          >
            <span>Live Hackathon Demo Mode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* TOP 5 METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Authorized Endpoints"
          value={stats.total_endpoints ?? 0}
          subtitle="Monitored in allowlist"
          icon={Server}
          color="blue"
        />
        <StatCard
          title="Critical Risks"
          value={stats.critical_risks ?? 0}
          subtitle="Score &ge; 75 / 100"
          icon={AlertTriangle}
          color="red"
          badge={stats.critical_risks > 0 ? 'Urgent Action' : 'All Clear'}
        />
        <StatCard
          title="Expiring Within 30d"
          value={stats.expiring_soon_count ?? 0}
          subtitle={stats.expired_count > 0 ? `${stats.expired_count} expired already` : 'Automated renew pending'}
          icon={CalendarClock}
          color="amber"
          badge={`${stats.expiring_soon_count} assets`}
        />
        <StatCard
          title="Weak TLS Configurations"
          value={stats.weak_tls_count ?? 0}
          subtitle="Legacy TLS or 3DES/RC4"
          icon={ShieldAlert}
          color="orange"
          badge="RFC 8996"
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionChart data={data?.risk_distribution} />
        <ExpiryBarChart data={data?.expiry_chart} />
      </div>

      {/* TWO COLUMN LOWER SECTION: Urgent Remediation + Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Urgent Remediation Checklist (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-xl p-6 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Urgent Remediation Priorities
              </h3>
              <p className="text-[11px] text-slate-400">
                Action items requiring immediate operations intervention
              </p>
            </div>
            <Link
              to="/endpoints"
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(!data?.urgent_remediations || data.urgent_remediations.length === 0) ? (
            <div className="p-8 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs">No urgent critical or high remediation tasks pending.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.urgent_remediations.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-start justify-between gap-4 text-xs hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-200">{item.hostname}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-sky-400">
                        {item.rule_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          item.priority.includes('P1')
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium">{item.recommendation}</p>
                    <span className="text-[11px] text-slate-500 block">
                      Evidence: <code className="text-amber-300/90">{item.evidence}</code>
                    </span>
                  </div>

                  {item.endpoint_id && (
                    <Link
                      to={`/endpoints/${item.endpoint_id}`}
                      className="shrink-0 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Inspect Endpoint"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Latest Active Alerts (1 col) */}
        <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Latest Alerts
              </h3>
              <p className="text-[11px] text-slate-400">
                {stats.active_alerts_count ?? 0} active unresolved alerts
              </p>
            </div>
            <Link
              to="/alerts"
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(!data?.latest_alerts || data.latest_alerts.length === 0) ? (
            <div className="p-8 text-center text-slate-500 flex-1 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-xs">No unresolved security alerts.</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
              {data.latest_alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 space-y-1.5 text-xs hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">{alert.hostname}</span>
                    <RiskBadge severity={alert.severity} size="sm" />
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-500">
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="text-sky-400 hover:text-sky-300 font-semibold"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
