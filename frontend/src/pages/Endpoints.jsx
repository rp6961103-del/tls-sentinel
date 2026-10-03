import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import EndpointTable from '../components/EndpointTable';
import AddEndpointModal from '../components/AddEndpointModal';
import { endpointsApi } from '../api';

export default function Endpoints() {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [envFilter, setEnvFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [tlsFilter, setTlsFilter] = useState('');

  // Scanning State
  const [scanningId, setScanningId] = useState(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchEndpoints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (riskFilter) params.risk = riskFilter;
      if (envFilter) params.environment = envFilter;
      if (expiryFilter) params.expiry_status = expiryFilter;
      if (tlsFilter) params.tls_status = tlsFilter;

      const res = await endpointsApi.list(params);
      setEndpoints(res.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to retrieve endpoints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, [search, riskFilter, envFilter, expiryFilter, tlsFilter]);

  const handleScan = async (endpointId) => {
    setScanningId(endpointId);
    try {
      await endpointsApi.scan(endpointId);
      // Refresh inventory
      await fetchEndpoints();
    } catch (err) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanningId(null);
    }
  };

  const handleEndpointAdded = () => {
    fetchEndpoints();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <Server className="w-6 h-6 text-sky-400" />
            <span>Authorized Endpoint Inventory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain authorized TLS targets, inspect active certificates, and initiate on-demand security evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchEndpoints()}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Authorized Endpoint</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hostname or owner..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-xs"
            />
          </div>

          {/* Risk Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">Risk: All Severities</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          {/* Environment Filter */}
          <div>
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">Environment: All</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
              <option value="internal">Internal Ops</option>
            </select>
          </div>

          {/* Expiry Status Filter */}
          <div>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">Expiry: All Windows</option>
              <option value="expired">Expired (&lt; 0d)</option>
              <option value="0-7d">Critical: 0-7 Days</option>
              <option value="8-15d">High: 8-15 Days</option>
              <option value="16-30d">Medium: 16-30 Days</option>
              <option value=">30d">Healthy: &gt;30 Days</option>
            </select>
          </div>

          {/* TLS Version Filter */}
          <div>
            <select
              value={tlsFilter}
              onChange={(e) => setTlsFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">TLS Version: All</option>
              <option value="legacy">Legacy (TLS 1.0/1.1/SSL)</option>
              <option value="modern">Modern (TLS 1.2/1.3)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips Reset */}
        {(search || riskFilter || envFilter || expiryFilter || tlsFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400">
              Showing filtered results ({endpoints.length} endpoints)
            </span>
            <button
              onClick={() => {
                setSearch('');
                setRiskFilter('');
                setEnvFilter('');
                setExpiryFilter('');
                setTlsFilter('');
              }}
              className="text-sky-400 hover:text-sky-300 font-semibold"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mb-2" />
          <p className="text-xs">Querying authorized inventory...</p>
        </div>
      ) : (
        <EndpointTable
          endpoints={endpoints}
          onScan={handleScan}
          scanningId={scanningId}
        />
      )}

      {/* Add Modal */}
      <AddEndpointModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEndpointAdded={handleEndpointAdded}
      />
    </div>
  );
}
