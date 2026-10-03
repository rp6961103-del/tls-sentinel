import React from 'react';
import { Lock, ShieldAlert, ShieldCheck, Cpu } from 'lucide-react';

export default function TLSDetails({ tlsVersion, cipher }) {
  const isLegacyProtocol = ['TLS 1.0', 'TLS 1.1', 'SSL'].some((x) =>
    (tlsVersion || '').toUpperCase().includes(x)
  );

  const isWeakCipher = ['3DES', 'DES', 'RC4', 'NULL', 'MD5', 'EXP'].some((x) =>
    (cipher || '').toUpperCase().includes(x)
  );

  return (
    <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span>TLS Protocol & Cipher Configuration</span>
        </div>
        <div className="flex items-center gap-2">
          {isLegacyProtocol ? (
            <span className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold">
              DEPRECATED PROTOCOL
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              MODERN TLS
            </span>
          )}

          {isWeakCipher ? (
            <span className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold">
              WEAK CIPHER
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              AEAD CIPHER SUITE
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Protocol Version */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block font-semibold mb-1">Negotiated Protocol</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-base font-bold text-slate-100">{tlsVersion || 'Unknown'}</span>
            {isLegacyProtocol ? (
              <span className="text-xs text-rose-400 font-medium">RFC 8996 Non-Compliant</span>
            ) : (
              <span className="text-xs text-emerald-400 font-medium">Industry Standard</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isLegacyProtocol
              ? 'Legacy protocol subject to downgrade and downgrade-related padding attacks.'
              : 'Secure forward-secrecy handshake with authenticated encryption.'}
          </p>
        </div>

        {/* Cipher Suite */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block font-semibold mb-1">Negotiated Cipher Suite</span>
          <div className="mt-1">
            <span className="font-mono text-sm font-bold text-slate-100 break-all">{cipher || 'Unknown'}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isWeakCipher
              ? 'Deprecated block/stream cipher susceptible to known crypto attacks (Sweet32 / Bar Mitzvah).'
              : 'High-assurance AEAD authenticated payload encryption.'}
          </p>
        </div>
      </div>
    </div>
  );
}
