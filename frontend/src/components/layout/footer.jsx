

import { Link } from 'react-router-dom';

const CATEGORIES = [
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Furniture',   value: 'Furniture'   },
  { label: 'Books',       value: 'Books'        },
  { label: 'Clothes',     value: 'Clothes'      },
  { label: 'Farm Tools',  value: 'Farm Tools'   },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-cream-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* ── Top grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">

          {/* Brand + tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
              <div className="w-9 h-9 rounded-2xl bg-primary-gradient flex items-center justify-center
                              shadow-[0_4px_16px_rgba(224,140,42,0.35)]
                              group-hover:shadow-[0_6px_22px_rgba(224,140,42,0.45)] transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="font-display font-extrabold text-charcoal-800 text-lg tracking-tight">
                SecondHandCenter
              </span>
            </Link>
            <p className="text-sm text-cream-500 leading-relaxed max-w-xs font-medium">
              Buy and sell secondhand goods with people near you.
              Hyperlocal, simple, and built for your neighbourhood.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-widest mb-3">
              Explore
            </h3>
            <ul className="space-y-2">
              <li><Link to="/"             className="text-sm text-cream-500 hover:text-primary-600 transition-colors font-medium">Home</Link></li>
              <li><Link to="/search"       className="text-sm text-cream-500 hover:text-primary-600 transition-colors font-medium">Search</Link></li>
              <li><Link to="/items/create" className="text-sm text-cream-500 hover:text-primary-600 transition-colors font-medium">Post an item</Link></li>
              <li><Link to="/my-listings"  className="text-sm text-cream-500 hover:text-primary-600 transition-colors font-medium">My listings</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-widest mb-3">
              Categories
            </h3>
            <ul className="space-y-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.value}>
                  <Link
                    to={`/search?category=${encodeURIComponent(cat.value)}`}
                    className="text-sm text-cream-500 hover:text-primary-600 transition-colors font-medium"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-widest mb-3">
              Account
            </h3>
            <ul className="space-y-2">
              <li><Link to="/login"      className="text-sm text-cream-500 hover:text-primary-600 transition-colors font-medium">Login / Register</Link></li>
              <li><Link to="/profile/me" className="text-sm text-cream-500 hover:text-primary-600 transition-colors font-medium">My profile</Link></li>
              <li><Link to="/chat"       className="text-sm text-cream-500 hover:text-primary-600 transition-colors font-medium">Messages</Link></li>
            </ul>
          </div>

        </div>

        {/* ── Divider + bottom bar ── */}
        <div className="border-t border-cream-200 pt-6 flex flex-col sm:flex-row
                        items-center justify-between gap-3">
         <p className="text-xs text-cream-500 font-medium">
            © {year} SecondHandCenter. Made By Amrit <span className="text-red-500">♥</span>.
          </p>
          <p className="text-xs text-cream-500 font-medium">
            Buy local. Sell local. Waste less. 🌱
          </p>
        </div>

      </div>
    </footer>
  );
}