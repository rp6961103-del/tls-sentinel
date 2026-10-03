import React from 'react';
import { Award, Calendar, Key, ShieldCheck, AlertCircle } from 'lucide-react';

export default function CertificateDetails({ certificate }) {
  if (!certificate) {
    return (
      <div className="bg-slate-900/60 rounded-xl p-6 border border-slate-800 text-center text-slate-500">
        No active certificate details available for this endpoint.
      </div>
    );
  }

  const days = certificate.days_remaining;
  const isExpired = days !== null && days !== undefined && days < 0;
  const isCritical = days !== null && days !== undefined && days >= 0 && days <= 7;

  const sans = certificate.san_names 
    ? certificate.san_names.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
          <Award className="w-4 h-4 text-sky-400" />
          <span>X.509 Certificate Specification</span>
        </div>
        <div>
          {isExpired ? (
            <span className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold">
              CERTIFICATE EXPIRED ({Math.abs(days)}d ago)
            </span>
          ) : isCritical ? (
            <span className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold">
              EXPIRING IN {days} DAYS
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              {days} DAYS VALIDITY REMAINING
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Subject */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block font-semibold mb-1">Subject (DN)</span>
          <span className="font-mono text-slate-200 break-all">{certificate.subject || 'N/A'}</span>
        </div>

        {/* Issuer */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block font-semibold mb-1">Issuer Authority</span>
          <span className="font-mono text-slate-200 break-all">{certificate.issuer || 'N/A'}</span>
        </div>

        {/* Serial Number */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block font-semibold mb-1">Serial Number</span>
          <span className="font-mono text-slate-300">{certificate.serial_number || 'N/A'}</span>
        </div>

        {/* Key Info */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block font-semibold mb-1">Public Key & Signature</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-slate-200">
              {certificate.public_key_algorithm} {certificate.public_key_size ? `(${certificate.public_key_size} bit)` : ''}
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="font-mono text-slate-400 text-[11px]">{certificate.signature_algorithm}</span>
          </div>
        </div>

        {/* Validity Start */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block font-semibold mb-1">Valid From</span>
          <span className="font-mono text-slate-300">
            {certificate.valid_from ? new Date(certificate.valid_from).toUTCString() : 'N/A'}
          </span>
        </div>

        {/* Validity End */}
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block font-semibold mb-1">Valid Until (Expiration)</span>
          <span className="font-mono text-slate-300">
            {certificate.valid_until ? new Date(certificate.valid_until).toUTCString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Subject Alternative Names (SANs) */}
      <div className="mt-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
        <span className="text-slate-400 block font-semibold mb-2">Subject Alternative Names (SANs)</span>
        {sans.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {sans.map((san, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono text-[11px] border border-slate-700"
              >
                DNS: {san}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-500 italic text-xs">No SAN extensions detected.</span>
        )}
      </div>
    </div>
  );
}
