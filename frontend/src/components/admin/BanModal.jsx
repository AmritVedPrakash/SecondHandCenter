// BanModal.jsx
// Confirm ban dialog with preset reason chips + custom reason textarea.
//
// Props:
//   user      — object  — { _id, name, email }
//   onConfirm — fn(reason: string) — called when admin clicks "Confirm Ban"
//   onCancel  — fn()
//   loading   — bool

import { useState, useEffect, useRef } from 'react';

const PRESET_REASONS = [
  'Violated community guidelines.',
  'Uploaded explicit or harmful content.',
  'Spam or fake listings.',
  'Harassment of other users.',
  'Repeated policy violations.',
];

export default function BanModal({ user, onConfirm, onCancel, loading }) {
  const [selected, setSelected] = useState(PRESET_REASONS[0]);
  const [custom,   setCustom]   = useState('');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const finalReason = selected === '__custom__' ? custom.trim() : selected;
  const canSubmit   = !loading && finalReason.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md bg-[#18181f] border border-[#2a2a38] rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-transparent" />
        <div className="px-6 pt-5 pb-4 border-b border-[#2a2a38]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg flex-shrink-0">🔨</div>
            <div>
              <h2 className="font-bold text-[#e2e2ee] text-sm">Ban User</h2>
              <p className="text-xs text-[#5a5a78] mt-0.5">{user?.name} · {user?.email}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-2.5 bg-red-500/8 border border-red-500/15 rounded-lg px-3.5 py-3">
            <span className="text-sm flex-shrink-0 mt-0.5">⚠️</span>
            <p className="text-xs text-red-300/80 leading-relaxed">Banning this user blocks all their protected API routes immediately. They will see a suspended message on every request.</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-widest mb-2.5">Reason</p>
            <div className="space-y-2">
              {PRESET_REASONS.map((reason) => (
                <label key={reason} className="flex items-start gap-2.5 cursor-pointer group">
                  <input type="radio" name="ban-reason" value={reason} checked={selected === reason} onChange={() => setSelected(reason)} className="mt-0.5 accent-[#ff6b35] flex-shrink-0" />
                  <span className={`text-sm leading-snug transition-colors ${selected === reason ? 'text-[#e2e2ee]' : 'text-[#5a5a78] group-hover:text-[#a0a0b8]'}`}>{reason}</span>
                </label>
              ))}
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input type="radio" name="ban-reason" value="__custom__" checked={selected === '__custom__'} onChange={() => setSelected('__custom__')} className="mt-0.5 accent-[#ff6b35] flex-shrink-0" />
                <span className={`text-sm transition-colors ${selected === '__custom__' ? 'text-[#e2e2ee]' : 'text-[#5a5a78] group-hover:text-[#a0a0b8]'}`}>Write custom reason…</span>
              </label>
            </div>
            {selected === '__custom__' && (
              <textarea value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Describe why this user is being banned…" rows={3} autoFocus className="mt-3 w-full bg-[#0f0f13] border border-[#2a2a38] rounded-xl px-3.5 py-2.5 text-sm text-[#e2e2ee] placeholder-[#3a3a52] focus:border-red-500/50 focus:outline-none resize-none transition-colors" />
            )}
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[#2a2a38] text-[#5a5a78] hover:text-[#e2e2ee] hover:border-[#3a3a48] transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={() => onConfirm(finalReason)} disabled={!canSubmit} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">{loading ? 'Banning…' : 'Confirm Ban'}</button>
        </div>
      </div>
    </div>
  );
}
