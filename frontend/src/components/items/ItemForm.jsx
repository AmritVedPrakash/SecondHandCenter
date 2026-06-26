// ─────────────────────────────────────────────────────────────────────────────
//  ItemForm  |  FIXED
//
//  FIXES:
//    1. validate() now reads hasLocation directly from useLocationStore.getState()
//       instead of from hook — avoids stale closure issue where React hasn't
//       re-rendered yet after setLocation() was called
//    2. Location section shows real-time coords from store
//    3. Removed dependency on hook's hasLocation for validation
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Input, { Textarea, Select, Field } from '../ui/Input';
import Button            from '../ui/Button';
import PhotoDropzone     from './PhotoDropzone';
import { CATEGORIES, CONDITIONS } from './helpers';
import { useLocation }   from '../../hooks/useLocation';
import { useLocationStore } from '../../store/locationStore';  // ← direct store access
import Spinner           from '../ui/Spinner';

const DEFAULTS = {
  title: '', description: '', price: '',
  category: 'Electronics', condition: 'Good', locationName: '',
};

export default function ItemForm({
  initialValues = DEFAULTS,
  onSubmit,
  loading = false,
  mode    = 'create',
}) {
  const [form,   setForm]   = useState({ ...DEFAULTS, ...initialValues });
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});

  const {
    lat, lng, locationName: storedLocName,
    isLocating, requestLocation,
  } = useLocation();

  // Pre-fill locationName from store on mount (create mode)
  useEffect(() => {
    if (mode === 'create' && storedLocName && !form.locationName) {
      setForm(f => ({ ...f, locationName: storedLocName }));
    }
  }, [storedLocName]);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};

    if (!form.title.trim())
      e.title = 'Title is required.';
    if (form.title.length > 100)
      e.title = 'Max 100 characters.';
    if (!form.description.trim())
      e.description = 'Description is required.';
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = 'Enter a valid price (0 for free).';

    if (mode === 'create') {
      if (!photos.length)
        e.photos = 'Add at least one photo.';

      // ── CRITICAL FIX: read DIRECTLY from store, not from hook closure ────
      // Hook's hasLocation may be stale after just calling requestLocation()
      // because React hasn't re-rendered yet. Store's getState() is always fresh.
      const storeState = useLocationStore.getState();
      const coordsReady = storeState.lat !== null && storeState.lng !== null;
      if (!coordsReady)
        e.location = 'Location is required. Please click Enable and allow location access.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Read fresh coords from store at submit time
    const storeState = useLocationStore.getState();

    if (mode === 'create') {
      const fd = new FormData();
      fd.append('title',        form.title.trim());
      fd.append('description',  form.description.trim());
      fd.append('price',        String(Number(form.price)));
      fd.append('category',     form.category);
      fd.append('locationName', form.locationName.trim());
      fd.append('lat',          String(storeState.lat));
      fd.append('lng',          String(storeState.lng));
      photos.forEach(p => fd.append('photos', p));
      await onSubmit(fd);
    } else {
      await onSubmit({
        title:        form.title.trim(),
        description:  form.description.trim(),
        price:        Number(form.price),
        category:     form.category,
        condition:    form.condition,
        locationName: form.locationName.trim(),
      });
    }
  };

  // ── Read location state directly from store (always fresh) ────────────────
  const storeState   = useLocationStore.getState();
  const coordsReady  = storeState.lat !== null && storeState.lng !== null;

  // Re-render when store changes (subscribe to lat/lng)
  const storeLat = useLocationStore(s => s.lat);
  const storeLng = useLocationStore(s => s.lng);
  const hasCoords = storeLat !== null && storeLng !== null;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
      noValidate
    >
      {/* ── Photos (create only) ── */}
      {mode === 'create' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <div>
              <h2 className="font-bold text-charcoal-800">Photos</h2>
              <p className="text-xs text-cream-400">First photo is cover. Up to 4 photos.</p>
            </div>
          </div>
          <PhotoDropzone photos={photos} onChange={setPhotos} error={errors.photos} />
        </div>
      )}

      {/* ── Item Details ── */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📝</span>
          <h2 className="font-bold text-charcoal-800">Item Details</h2>
        </div>

        <Input
          label="Title" required
          placeholder="e.g. Used cycle in good condition"
          value={form.title} onChange={set('title')} error={errors.title}
          maxLength={100}
          rightIcon={
            <span className={`text-xs font-medium ${form.title.length > 90 ? 'text-red-400' : 'text-cream-400'}`}>
              {form.title.length}/100
            </span>
          }
        />

        <Textarea
          label="Description" required
          placeholder="Describe the item — age, condition, any defects, reason for selling…"
          value={form.description} onChange={set('description')} error={errors.description}
          rows={4} maxLength={1000} showCount
        />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" required value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Select>
          <Select label="Condition" value={form.condition || 'Good'} onChange={set('condition')}>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </Select>
        </div>

        <Field label="Price (₹)" hint="Enter 0 for FREE" required error={errors.price}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-bold text-cream-500">₹</span>
            <input
              type="number" min="0" step="1" placeholder="0"
              value={form.price} onChange={set('price')}
              className={`input pl-8 ${errors.price ? 'input-error' : ''}`}
            />
          </div>
          {(form.price === '0' || form.price === 0) && (
            <p className="label-hint flex items-center gap-1 !text-forest-600">
              <span>🎁</span> This item will be listed as FREE
            </p>
          )}
        </Field>
      </div>

      {/* ── Location (create mode only) ── */}
      {mode === 'create' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <div>
              <h2 className="font-bold text-charcoal-800">Location</h2>
              <p className="text-xs text-cream-400">Buyers nearby will be able to find this item.</p>
            </div>
          </div>

          {/* ── Location status — reads from store directly ── */}
          {hasCoords ? (
            <div className="flex items-center gap-3 p-3 bg-forest-50 border border-forest-200 rounded-xl">
              <div className="w-8 h-8 rounded-xl bg-forest-gradient flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-forest-700">Location detected ✓</p>
                <p className="text-[11px] text-forest-600">
                  {storeLat.toFixed(5)}, {storeLng.toFixed(5)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => requestLocation({ silent: true })}
                disabled={isLocating}
                className="text-xs text-forest-600 hover:text-forest-800 font-semibold underline"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Location not detected</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Click Enable → Allow location in browser popup.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={isLocating}
                  onClick={() => {
                    // Clear the location error on retry
                    setErrors(er => ({ ...er, location: '' }));
                    requestLocation().catch(() => {});
                  }}
                >
                  Enable
                </Button>
              </div>
              {errors.location && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.location}
                </p>
              )}
            </div>
          )}

          {/* Locality name */}
          <Input
            label="Area / Locality Name"
            placeholder="e.g. Civil Lines, Kanpur"
            value={form.locationName}
            onChange={set('locationName')}
            hint="Shown publicly on listing"
          />
        </div>
      )}

      {/* Edit mode: just locality name */}
      {mode === 'edit' && (
        <div className="card p-6">
          <Input
            label="Area / Locality Name"
            placeholder="e.g. Civil Lines, Kanpur"
            value={form.locationName}
            onChange={set('locationName')}
          />
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        {mode === 'create' ? '🚀 Post Item' : '✓ Save Changes'}
      </Button>
    </motion.form>
  );
}