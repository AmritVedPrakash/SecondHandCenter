// ─────────────────────────────────────────────────────────────────────────────
//  SearchBar  |  Controlled search input with recent history dropdown
//  Props: value, onChange, onSearch, placeholder, autoFocus, showRecent
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const RECENT_KEY = 'bb_recent_searches';
const MAX_RECENT = 6;

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(q) {
  if (!q?.trim()) return;
  const list = [q.trim(), ...loadRecent().filter(r => r !== q.trim())].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export default function SearchBar({
  value = '', onChange, onSearch,
  placeholder = 'Search items near you…',
  autoFocus = false, showRecent = true, className = '',
}) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);
  const [focused,  setFocused]  = useState(false);
  const [recent,   setRecent]   = useState(loadRecent);
  const [hovIdx,   setHovIdx]   = useState(-1);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const doSearch = (q) => {
    const trimmed = q?.trim() ?? value.trim();
    if (trimmed) { saveRecent(trimmed); setRecent(loadRecent()); }
    setFocused(false); setHovIdx(-1);
    onSearch ? onSearch(trimmed) : navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHovIdx(h => Math.min(h + 1, recent.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHovIdx(h => Math.max(h - 1, -1)); }
    if (e.key === 'Enter' && hovIdx >= 0) { e.preventDefault(); onChange?.(recent[hovIdx]); doSearch(recent[hovIdx]); }
    if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur(); }
  };

  const showDropdown = showRecent && focused && recent.length > 0 && !value.trim();

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={(e) => { e.preventDefault(); doSearch(); }}>
        <div className={`relative flex items-center bg-white rounded-2xl border-2 transition-all duration-200 ${focused ? 'border-primary-400 shadow-[0_0_0_4px_rgba(224,140,42,0.12)]' : 'border-cream-300 hover:border-cream-400 shadow-card'}`}>
          {/* Search icon */}
          <div className="flex-shrink-0 pl-4">
            <svg className={`w-5 h-5 transition-colors ${focused ? 'text-primary-500' : 'text-cream-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={e => onChange?.(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            className="flex-1 bg-transparent text-sm font-medium text-charcoal-800 placeholder-cream-400 px-3 py-3.5 focus:outline-none"
          />

          {/* Clear */}
          <AnimatePresence>
            {value && (
              <motion.button type="button" onClick={() => { onChange?.(''); inputRef.current?.focus(); }}
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.12 }}
                className="flex-shrink-0 mr-1 w-7 h-7 rounded-xl flex items-center justify-center text-cream-400 hover:text-charcoal-800 hover:bg-cream-100 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button type="submit" className="flex-shrink-0 mr-2 h-9 px-4 rounded-xl bg-primary-gradient text-white text-sm font-bold shadow-[0_2px_8px_rgba(224,140,42,0.35)] hover:shadow-[0_4px_12px_rgba(224,140,42,0.45)] active:scale-95 transition-all">
            Search
          </button>
        </div>
      </form>

      {/* Recent dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-card-lg border border-cream-200 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-cream-100">
              <span className="text-xs font-bold text-cream-400 uppercase tracking-wide">Recent searches</span>
              <button onClick={(e) => { e.stopPropagation(); localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold">Clear</button>
            </div>
            {recent.map((q, i) => (
              <button key={q} onClick={() => { onChange?.(q); doSearch(q); }} onMouseEnter={() => setHovIdx(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${hovIdx === i ? 'bg-primary-50' : 'hover:bg-cream-50'}`}>
                <svg className="w-4 h-4 text-cream-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-charcoal-800 font-medium flex-1 truncate">{q}</span>
                <span className="text-cream-300 text-xs">↗</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
