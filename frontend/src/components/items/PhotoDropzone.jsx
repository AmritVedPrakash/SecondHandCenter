// ─────────────────────────────────────────────────────────────────────────────
//  PhotoDropzone  |  FIXED — click + drag & drop
//  Bug fixed: onClick was stopPropagated, preventing file dialog from opening
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

const MAX    = 4;
const ACCEPT = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] };

// ── Preview slot (photo already selected) ─────────────────────────────────────
function Preview({ file, index, isFirst, onRemove }) {
  const url = URL.createObjectURL(file);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="relative aspect-square rounded-2xl overflow-hidden group bg-cream-100 border-2 border-cream-200"
    >
      <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
      {isFirst && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
          <span className="text-[10px] font-bold text-white">COVER</span>
        </div>
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs font-bold z-10"
      >✕</button>
      <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/50 text-white text-[10px] font-bold rounded-md flex items-center justify-center">
        {index + 1}
      </div>
    </motion.div>
  );
}

export default function PhotoDropzone({ photos = [], onChange, error }) {
  // ── Hidden file input (used for click-to-open) ─────────────────────────────
  const fileInputRef = useRef(null);

  // ── Dropzone (drag only — noClick=true, we handle click manually) ──────────
  const onDrop = useCallback((accepted) => {
    const remaining = MAX - photos.length;
    const toAdd     = accepted.slice(0, remaining);
    if (toAdd.length > 0) onChange([...photos, ...toAdd]);
  }, [photos, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:    ACCEPT,
    maxFiles:  MAX - photos.length,
    disabled:  photos.length >= MAX,
    noClick:   true,   // ← CRITICAL FIX: we open file dialog ourselves
    noKeyboard: false,
  });

  // ── Click handler — opens OS file picker directly ──────────────────────────
  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (photos.length >= MAX) return;
    fileInputRef.current?.click();
  };

  // ── Handle file input change ───────────────────────────────────────────────
  const handleInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX - photos.length;
    const toAdd     = files.slice(0, remaining);
    onChange([...photos, ...toAdd]);
    // Reset input so same file can be re-selected if needed
    e.target.value = '';
  };

  const removePhoto = (idx) => onChange(photos.filter((_, i) => i !== idx));
  const slots = Array.from({ length: MAX });

  return (
    <div className="space-y-3">
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Drop zone wrapper (drag events only) */}
      <div
        {...getRootProps()}
        className={`grid grid-cols-4 gap-3 rounded-2xl p-2 -m-2 transition-all duration-200 ${
          isDragActive ? 'bg-primary-50 ring-2 ring-primary-400 ring-dashed' : ''
        }`}
      >
        {/* React-dropzone's hidden input for drag (kept for drag functionality) */}
        <input {...getInputProps()} />

        <AnimatePresence>
          {slots.map((_, i) => {
            // Filled slot — show preview
            if (photos[i]) {
              return (
                <Preview
                  key={`photo-${i}`}
                  file={photos[i]}
                  index={i}
                  isFirst={i === 0}
                  onRemove={removePhoto}
                />
              );
            }

            // Next available slot — clickable to open file picker
            if (i === photos.length) {
              return (
                <motion.button
                  key={`add-${i}`}
                  type="button"
                  onClick={handleAddClick}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className={`
                    aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all duration-200
                    ${isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-cream-300 bg-cream-50 hover:border-primary-400 hover:bg-primary-50 cursor-pointer'
                    }
                  `}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-primary-100' : 'bg-cream-200'}`}>
                    <svg
                      className={`w-5 h-5 ${isDragActive ? 'text-primary-600' : 'text-cream-500'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className={`text-[11px] font-semibold ${isDragActive ? 'text-primary-600' : 'text-cream-400'}`}>
                    {isDragActive ? 'Drop!' : 'Add photo'}
                  </span>
                </motion.button>
              );
            }

            // Future empty slots — disabled visual
            return (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-2xl border-2 border-dashed border-cream-200 bg-cream-50 opacity-40"
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Helper row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-cream-400 font-medium">
          {photos.length === 0
            ? 'Click ➕ to add or drag photos here — first photo is cover'
            : `${photos.length} / ${MAX} photo${photos.length !== 1 ? 's' : ''} added`}
        </p>
        {photos.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
