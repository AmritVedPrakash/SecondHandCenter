// ─────────────────────────────────────────────────────────────────────────────
//  SellerCard  |  Shown on ItemDetailPage
//  seller fields used: _id, name, avatar, phone, rating, isStudentVerified,
//                      locationName, createdAt
//  Phone is hidden by default — reveal button for logged-in non-owners only
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from './UserAvatar';
import { StarBadge } from './RatingStars';
import { useAuthStore } from '../../store/authStore';

function formatJoinDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function SellerCard({ seller, isOwner = false }) {
  const { isAuthenticated, user } = useAuthStore();
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  if (!seller) return null;

  const canRevealPhone = isAuthenticated && !isOwner && seller.phone;

  return (
    <div className="card p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start gap-4">
        <Link to={`/profile/${seller._id}`} className="flex-shrink-0">
          <UserAvatar user={seller} size="lg" showBadge />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/profile/${seller._id}`}
              className="font-bold text-charcoal-800 hover:text-primary-600 transition-colors leading-tight"
            >
              {seller.name}
            </Link>
            {seller.isStudentVerified && (
              <span className="badge-blue text-xs">🎓 Student</span>
            )}
          </div>

          {/* Rating */}
          {seller.rating?.average > 0 ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <StarBadge average={seller.rating.average} count={seller.rating.count} />
            </div>
          ) : (
            <p className="text-xs text-cream-400 mt-0.5">No ratings yet</p>
          )}

          {/* Location */}
          {seller.locationName && (
            <p className="text-xs text-cream-500 mt-1 flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {seller.locationName}
            </p>
          )}

          {/* Member since */}
          {seller.createdAt && (
            <p className="text-xs text-cream-400 mt-0.5">
              Member since {formatJoinDate(seller.createdAt)}
            </p>
          )}
        </div>

        {/* View profile arrow */}
        <Link
          to={`/profile/${seller._id}`}
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-cream-100 hover:bg-cream-200 text-cream-500 hover:text-charcoal-800 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Divider */}
      <div className="divider !my-0" />

      {/* Phone reveal */}
      {canRevealPhone && (
        <div>
          <AnimatePresence mode="wait">
            {phoneRevealed ? (
              <motion.a
                key="phone"
                href={`tel:+91${seller.phone}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-forest-50 border border-forest-200 rounded-xl group hover:bg-forest-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-forest-gradient flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-forest-700 font-medium">Mobile Number</p>
                  <p className="text-sm font-bold text-forest-800">+91 {seller.phone}</p>
                </div>
                <svg className="w-4 h-4 text-forest-400 ml-auto group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.a>
            ) : (
              <motion.button
                key="reveal"
                onClick={() => setPhoneRevealed(true)}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex items-center gap-3 p-3 bg-cream-100 border border-cream-300 rounded-xl hover:bg-cream-200 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-cream-200 group-hover:bg-cream-300 flex items-center justify-center flex-shrink-0 transition-colors">
                  <svg className="w-4 h-4 text-cream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs text-cream-500 font-medium">Phone number hidden</p>
                  <p className="text-sm font-semibold text-charcoal-800">Tap to reveal</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-cream-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cream-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cream-400" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* If owner: show "This is your listing" */}
      {isOwner && (
        <div className="flex items-center gap-2 text-xs text-primary-600 bg-primary-50 rounded-xl px-3 py-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          This is your listing
        </div>
      )}
    </div>
  );
}
