import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle, 
  RefreshCw, 
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import { alertsApi } from '../api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [severityFilter, setSeverityFilter] = useState('');
  const [resolvingId, setResolvingId] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      const res = await alertsApi.list(params);
      setAlerts(res.data);
    } catch (err) {
      alert(`Failed to load alerts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await alertsApi.resolve(id);
      await fetchAlerts();
    } catch (err) {
      alert(`Could not resolve alert: ${err.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <Bell className="w-6 h-6 text-sky-400" />
            <span>Security Alerts & Incident Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated alerts triggered on certificate expiry thresholds (&le;30d, &le;15d, &le;7d, expired), legacy TLS, and weak cipher configurations.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setStatusFilter('OPEN')}
              className={`px-3 py-1 rounded font-semibold transition ${
                statusFilter === 'OPEN'
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Open
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-3 py-1 rounded font-semibold transition ${
                statusFilter === 'RESOLVED'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolved History
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded font-semibold transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Alerts
            </button>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          {alerts.length} alerts in selected view
        </span>
      </div>

      {/* Alerts Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mb-2" />
          <p className="text-xs">Fetching alert queue...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-900/60 rounded-xl p-16 border border-slate-800 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-200">No Alerts Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            All endpoints are currently compliant or matching filter criteria returned zero unresolved alerts.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Alert Message & Evidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Detected</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4">
                    <RiskBadge severity={alert.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-100">
                    <Link
                      to={`/endpoints/${alert.endpoint_id}`}
                      className="hover:text-sky-400 flex items-center gap-1.5 transition"
                    >
                      <span>{alert.hostname}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </Link>
                    <span className="text-[10px] text-slate-500 uppercase font-sans">{alert.environment}</span>
                  </td>
                  <td className="py-3 px-4 max-w-md">
                    <p className="text-slate-200 font-medium">{alert.message}</p>
                  </td>
                  <td className="py-3 px-4">
                    {alert.status === 'OPEN' ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        OPEN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        RESOLVED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(alert.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {alert.status === 'OPEN' ? (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        disabled={resolvingId === alert.id}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-[11px] transition disabled:opacity-50"
                      >
                        {resolvingId === alert.id ? 'Resolving...' : 'Mark Resolved'}
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px] italic">
                        Resolved {alert.resolved_at ? new Date(alert.resolved_at).toLocaleDateString() : ''}
                      </span>
                    )}
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
