import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, Lock } from 'lucide-react';
import { endpointsApi } from '../api';

export default function AddEndpointModal({ isOpen, onClose, onEndpointAdded }) {
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState(443);
  const [environment, setEnvironment] = useState('production');
  const [owner, setOwner] = useState('Security Operations');
  const [criticality, setCriticality] = useState('HIGH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        hostname: hostname.trim().toLowerCase(),
        port: parseInt(port, 10),
        environment,
        owner: owner.trim(),
        business_criticality: criticality,
        enabled: true,
      };
      const res = await endpointsApi.create(payload);
      setLoading(false);
      onEndpointAdded && onEndpointAdded(res.data);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to add endpoint.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Add Authorized Endpoint</h3>
              <p className="text-[11px] text-slate-400">Strict Allowlist Validation Enforced</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Hostname / Fully Qualified Domain Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="e.g. payment.demo.local, localhost, api.demo.local"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Authorized patterns: <code className="text-sky-400">*.demo.local</code>, <code className="text-sky-400">localhost</code>, <code className="text-sky-400">127.0.0.1</code>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Port <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="65535"
                required
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
                <option value="internal">Internal Ops</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Owner / Team</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Core Infrastructure"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Business Criticality</label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          {/* Security boundary warning */}
          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] text-slate-300">
            <span className="font-bold text-amber-300 block mb-0.5">Defensive Boundary Enforcement:</span>
            Only authorized or sandboxed endpoints may be inspected. Subnet, CIDR, port-range scanning, and unauthorized external targets are strictly blocked with a 403 Forbidden rejection.
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? 'Scanning & Registering...' : 'Register Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
