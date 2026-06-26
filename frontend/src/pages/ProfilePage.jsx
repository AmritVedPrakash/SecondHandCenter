
// ─────────────────────────────────────────────────────────────────────────────
//  ProfilePage  |  /profile/:userId  (public)
//  Shows: avatar, stats, listings grid, reviews
// ─────────────────────────────────────────────────────────────────────────────
import { Link, useParams } from 'react-router-dom';
import { motion }          from 'framer-motion';
import { useProfile }      from '../hooks/useProfile';
import { useAuthStore }    from '../store/authStore';
import UserAvatar          from '../components/user/UserAvatar';
import { StarBadge }       from '../components/user/RatingStars';
import RatingStars         from '../components/user/RatingStars';
import { PageSpinner }     from '../components/ui/Spinner';
import EmptyState          from '../components/ui/EmptyState';
import Button              from '../components/ui/Button';
import { CAT_ICONS, formatPrice, timeAgo } from '../components/items/helpers';

function joinDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { month:'long', year:'numeric' });
}

export default function ProfilePage() {
  const { userId }           = useParams();
  const { user: me }         = useAuthStore();
  const { profile, listings, ratings, isLoading, isError } = useProfile(userId);

  const isMe = me?._id === userId;

  if (isLoading) return <PageSpinner label="Loading profile…" />;

  if (isError || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-6xl">😕</div>
        <h1 className="text-xl font-bold text-charcoal-800">Profile not found</h1>
        <Link to="/"><Button variant="primary" size="md">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* ── Profile header ── */}
      <motion.div
        initial={{ opacity:0, y:16 }}
        animate={{ opacity:1, y:0 }}
        className="card p-6"
      >
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <UserAvatar user={profile} size="2xl" showBadge />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl font-extrabold text-charcoal-800 tracking-tight">
                    {profile.name}
                  </h1>
                  {profile.isStudentVerified && (
                    <span className="badge-blue text-sm">🎓 Verified Student</span>
                  )}
                </div>
                {profile.locationName && (
                  <p className="text-sm text-cream-400 mt-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {profile.locationName}
                  </p>
                )}
                <p className="text-xs text-cream-400 mt-0.5">
                  Member since {joinDate(profile.createdAt)}
                </p>
              </div>
              {isMe && (
                <Link to="/profile/me">
                  <Button variant="secondary" size="sm">Edit Profile</Button>
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div className="text-center">
                <p className="text-xl font-extrabold text-charcoal-800">{profile.listingsCount || 0}</p>
                <p className="text-xs text-cream-400 font-medium">Listings</p>
              </div>
              {profile.rating?.average > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xl font-extrabold text-charcoal-800">{profile.rating.average.toFixed(1)}</p>
                    <span className="text-amber-400 text-lg">★</span>
                  </div>
                  <p className="text-xs text-cream-400 font-medium">{profile.rating.count} review{profile.rating.count !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Listings ── */}
      <section>
        <h2 className="font-display text-lg font-bold text-charcoal-800 mb-4">
          {isMe ? 'Your Listings' : `${profile.name}'s Listings`}
          {listings.length > 0 && <span className="text-cream-400 font-normal text-sm ml-2">({listings.length})</span>}
        </h2>
        {listings.length === 0 ? (
          <EmptyState icon="📦" title="No listings yet"
            description={isMe ? 'Post your first item!' : 'This user has no active listings.'}
            compact
            action={isMe && <Link to="/items/create"><Button variant="primary" size="sm">Post an Item</Button></Link>}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {listings.map((item, i) => (
              <motion.div key={item._id}
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/items/${item._id}`}
                  className="group block card overflow-hidden hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="aspect-[4/3] bg-cream-100 overflow-hidden">
                    {item.photos?.[0]
                      ? <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">{CAT_ICONS[item.category]}</div>
                    }
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-charcoal-800 truncate">{item.title}</p>
                    <p className={`text-sm font-extrabold mt-0.5 ${item.isFree ? 'text-forest-600' : 'text-charcoal-800'}`}>
                      {formatPrice(item.price, item.isFree)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Reviews ── */}
      {ratings.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-charcoal-800 mb-4">
            Reviews
            <span className="text-cream-400 font-normal text-sm ml-2">({ratings.length})</span>
          </h2>
          <div className="space-y-3">
            {ratings.map((r, i) => (
              <motion.div key={r._id}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-4 flex items-start gap-3"
              >
                <UserAvatar user={r.rater} size="sm" showBadge={false} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link to={`/profile/${r.rater?._id}`} className="font-bold text-sm text-charcoal-800 hover:text-primary-600 transition-colors">
                      {r.rater?.name}
                    </Link>
                    <div className="flex items-center gap-2">
                      <RatingStars value={r.stars} size="xs" />
                      <span className="text-xs text-cream-400">{timeAgo(r.createdAt)}</span>
                    </div>
                  </div>
                  {r.item?.title && (
                    <p className="text-xs text-cream-400 mt-0.5 truncate">
                      Re: {r.item.title}
                    </p>
                  )}
                  {r.comment && (
                    <p className="text-sm text-charcoal-800/80 mt-1.5 leading-relaxed">{r.comment}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}