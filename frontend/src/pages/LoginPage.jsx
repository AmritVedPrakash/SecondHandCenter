
// ─────────────────────────────────────────────────────────────────────────────
//  LoginPage  |  /login
//  Login / Register tabs in one page. Redirects to `from` after success.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useAuth }      from '../hooks/useAuth';
import Input            from '../components/ui/Input';
import Button           from '../components/ui/Button';
import toast            from 'react-hot-toast';

// ── Phone validator (Indian 10-digit) ─────────────────────────────────────────
const validatePhone = (p) => /^[6-9]\d{9}$/.test(p);

// ── Tab button ────────────────────────────────────────────────────────────────
function Tab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-bold transition-all relative ${
        active ? 'text-primary-600' : 'text-cream-400 hover:text-charcoal-800'
      }`}
    >
      {children}
      {active && (
        <motion.div layoutId="login-tab-line"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
          transition={{ type:'spring', stiffness:400, damping:30 }}
        />
      )}
    </button>
  );
}

// ── Login form ─────────────────────────────────────────────────────────────────
function getRedirectFromLocation(location) {
  return location.state?.from || new URLSearchParams(location.search).get('redirect');
}

function LoginForm({ onSuccess }) {
  const { loginAndGo, authError, clearAuthError } = useAuth();
  const location = useLocation();
  const [form, setForm]   = useState({ email:'', password:'' });
  const [errs, setErrs]   = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    setForm(f=>({...f,[k]:e.target.value}));
    setErrs(er=>({...er,[k]:''}));
    if (authError) clearAuthError();
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim())        e.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password)            e.password = 'Password is required.';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await loginAndGo(form.email.trim(), form.password, getRedirectFromLocation(location));
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <motion.form onSubmit={handleSubmit} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      className="space-y-4" noValidate>
      {authError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {authError}
        </div>
      )}
      <Input label="Email address" type="email" placeholder="you@example.com"
        value={form.email} onChange={set('email')} error={errs.email}
        autoComplete="email" required
        leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>}
      />
      <Input label="Password" type="password" placeholder="Enter your password"
        value={form.password} onChange={set('password')} error={errs.password}
        autoComplete="current-password" required
      />
      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Sign In
      </Button>
    </motion.form>
  );
}

// ── Register form ──────────────────────────────────────────────────────────────
function RegisterForm() {
  const { registerAndGo } = useAuth();
  const [form, setForm]   = useState({ name:'', email:'', phone:'', password:'', confirm:'' });
  const [errs, setErrs]   = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => { setForm(f=>({...f,[k]:e.target.value})); setErrs(er=>({...er,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())           e.name    = 'Full name is required.';
    if (!form.email.trim())          e.email   = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!validatePhone(form.phone))  e.phone   = 'Enter a valid 10-digit Indian mobile number.';
    if (form.password.length < 6)    e.password= 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await registerAndGo({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password });
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <motion.form onSubmit={handleSubmit} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      className="space-y-4" noValidate>
      <Input label="Full Name" type="text" placeholder="Rahul Kumar"
        value={form.name} onChange={set('name')} error={errs.name} autoComplete="name" required
      />
      <Input label="Email Address" type="email" placeholder="you@example.com"
        value={form.email} onChange={set('email')} error={errs.email} autoComplete="email" required
      />
      <Input label="Mobile Number" type="tel" placeholder="9876543210"
        value={form.phone} onChange={set('phone')} error={errs.phone} autoComplete="tel" required
        hint="10-digit Indian number"
        leftIcon={<span className="text-xs font-bold text-cream-500">+91</span>}
      />
      <Input label="Password" type="password" placeholder="Min. 6 characters"
        value={form.password} onChange={set('password')} error={errs.password}
        autoComplete="new-password" required
      />
      <Input label="Confirm Password" type="password" placeholder="Repeat password"
        value={form.confirm} onChange={set('confirm')} error={errs.confirm}
        autoComplete="new-password" required
      />
      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Create Account
      </Button>
    </motion.form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab === 'register' ? 'register' : 'login');
  const redirectTo = getRedirectFromLocation(location) || '/';

  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10 bg-hero-gradient relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-forest-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <motion.div
        initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.45, ease:[0.16,1,0.3,1] }}
        className="relative w-full max-w-md"
      >
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-[0_4px_20px_rgba(224,140,42,0.45)] group-hover:shadow-[0_6px_28px_rgba(224,140,42,0.55)] transition-shadow">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-charcoal-800 tracking-tight">
            {tab === 'login' ? 'Welcome back' : 'Join BazaarBuddy'}
          </h1>
          <p className="text-sm text-cream-500 mt-1 font-medium">
            {tab === 'login' ? 'Sign in to your account' : 'Your local marketplace awaits'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-card-lg">
          {/* Tabs */}
          <div className="flex border-b border-cream-200 mb-6 -mx-2">
            <Tab active={tab === 'login'}    onClick={() => setTab('login')}>Sign In</Tab>
            <Tab active={tab === 'register'} onClick={() => setTab('register')}>Create Account</Tab>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'login'
              ? <LoginForm key="login" />
              : <RegisterForm key="register" />
            }
          </AnimatePresence>
        </div>

        {/* Switch tab hint */}
        <p className="text-center text-sm text-cream-500 mt-5 font-medium">
          {tab === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => setTab('register')} className="text-primary-600 font-bold hover:underline">
                Create one →
              </button></>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => setTab('login')} className="text-primary-600 font-bold hover:underline">
                Sign in →
              </button></>
          )}
        </p>
      </motion.div>
    </div>
  );
}