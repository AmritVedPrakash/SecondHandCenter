// ─────────────────────────────────────────────────────────────────────────────
//  CreateItemPage  |  FIXED
//
//  FIXES:
//    1. compressImage() — compress photos in browser BEFORE upload
//       Reduces file from ~3MB to ~200KB → no more Cloudinary timeout
//    2. axios upload with onUploadProgress — shows upload progress
//    3. Better error messages for timeout vs other errors
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import axios from 'axios';
import { useAuthStore }  from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import ItemForm          from '../components/items/ItemForm';
import Spinner           from '../components/ui/Spinner';
import toast             from 'react-hot-toast';

// ── Image compression helper ──────────────────────────────────────────────────
// Compresses a File using Canvas API before uploading to server.
// Reduces large phone photos (3-8MB) down to ~200-400KB.
function compressImage(file, maxWidthPx = 1000, quality = 0.75) {
  return new Promise((resolve) => {
    // If already small enough, skip compression
    if (file.size < 300 * 1024) { // < 300KB
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidthPx || height > maxWidthPx) {
        if (width > height) {
          height = Math.round((height * maxWidthPx) / width);
          width  = maxWidthPx;
        } else {
          width  = Math.round((width * maxWidthPx) / height);
          height = maxWidthPx;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }  // fallback to original
          const compressed = new File([blob], file.name, {
            type:         'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original on error
    };

    img.src = url;
  });
}

export default function CreateItemPage() {
  const navigate = useNavigate();
  const { incrementListingsCount } = useAuthStore();
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState(0); // upload progress 0-100
  const [stage,     setStage]     = useState(''); // 'compressing' | 'uploading'

  const handleSubmit = async (formData) => {
    setLoading(true);
    setProgress(0);

    try {
      // ── Step 1: Compress all photos in browser ─────────────────────────
      setStage('compressing');
      const originalPhotos = formData.getAll('photos');

      if (originalPhotos.length > 0) {
        // Show compression toast
        const compressToast = toast.loading(`Compressing ${originalPhotos.length} photo(s)…`);

        const compressedPhotos = await Promise.all(
          originalPhotos.map(f => compressImage(f, 1000, 0.75))
        );

        // Log size reduction (dev only)
        const origSize = originalPhotos.reduce((s, f) => s + f.size, 0);
        const compSize = compressedPhotos.reduce((s, f) => s + f.size, 0);
        console.log(`📸 Photos: ${(origSize/1024).toFixed(0)}KB → ${(compSize/1024).toFixed(0)}KB`);

        // Rebuild FormData with compressed photos
        formData.delete('photos');
        compressedPhotos.forEach(f => formData.append('photos', f));

        toast.dismiss(compressToast);
      }

      // ── Step 2: Upload with progress ───────────────────────────────────
      setStage('uploading');
      const token   = localStorage.getItem('bb_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const { data } = await axios.post(`${baseUrl}/items`, formData, {
        headers: {
          'Content-Type':  'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 120000, // 2 minutes
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 100) / e.total);
            setProgress(pct);
          }
        },
      });

      incrementListingsCount();
      toast.success('Item posted successfully! 🎉');
      navigate(`/items/${data.data._id}`, { replace: true });

    } catch (err) {
      console.error('Upload error:', err);

      if (err.code === 'ECONNABORTED' || err?.response?.status === 408) {
        toast.error(
          'Upload timed out. Please try with smaller/fewer photos (under 2MB each).',
          { duration: 8000 }
        );
      } else if (err?.response?.status === 413) {
        toast.error('Photos are too large. Please use images under 5MB each.', { duration: 6000 });
      } else {
        const msg = err?.response?.data?.message || 'Failed to post item. Please try again.';
        toast.error(msg);
      }
    } finally {
      setLoading(false);
      setProgress(0);
      setStage('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-cream-200 shadow-card text-cream-500 hover:text-charcoal-800 hover:border-cream-400 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-800 tracking-tight">Post an Item</h1>
          <p className="text-sm text-cream-400 font-medium mt-0.5">Reach buyers in your locality</p>
        </div>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-primary-50 border border-primary-200 rounded-2xl mb-6"
      >
        <span className="text-lg flex-shrink-0">💡</span>
        <div>
          <p className="text-sm font-bold text-primary-800">Tips for a faster sale</p>
          <ul className="text-xs text-primary-700 mt-1 space-y-0.5">
            <li>• Add clear, well-lit photos from multiple angles</li>
            <li>• Be honest about the condition</li>
            <li>• Price it slightly lower than you expect to negotiate</li>
          </ul>
        </div>
      </motion.div>

      {/* Upload progress overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/60 backdrop-blur-sm px-4"
        >
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-card-lg text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-gradient flex items-center justify-center shadow-[0_4px_20px_rgba(224,140,42,0.4)]">
              {stage === 'compressing' ? (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </div>

            <div>
              <p className="font-bold text-charcoal-800 text-lg">
                {stage === 'compressing' ? 'Optimising photos…' : 'Uploading item…'}
              </p>
              <p className="text-sm text-cream-500 mt-1">
                {stage === 'compressing'
                  ? 'Reducing photo size for faster upload'
                  : 'Sending to server, please wait…'}
              </p>
            </div>

            {/* Progress bar */}
            {stage === 'uploading' && progress > 0 && (
              <div className="space-y-1.5">
                <div className="h-2.5 bg-cream-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-gradient rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs font-bold text-primary-600">{progress}%</p>
              </div>
            )}

            {stage === 'compressing' && (
              <div className="flex justify-center">
                <Spinner size="md" />
              </div>
            )}

            <p className="text-xs text-cream-400">Please don't close this tab</p>
          </div>
        </motion.div>
      )}

      <ItemForm mode="create" onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}