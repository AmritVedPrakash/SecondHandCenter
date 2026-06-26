
// ─────────────────────────────────────────────────────────────────────────────
//  MyProfilePage  |  /profile/me  (protected)
//  Sections: Avatar upload, Edit profile, Location update, Student badge
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef } from 'react';
import { Link }             from 'react-router-dom';
import { motion }           from 'framer-motion';
import { useAuthStore }     from '../store/authStore';
import { useAuth }          from '../hooks/useAuth';
import { useLocation }      from '../hooks/useLocation';
import { uploadCollegeId }  from '../api/user.api';
import UserAvatar           from '../components/user/UserAvatar';
import Input                from '../components/ui/Input';
import Button               from '../components/ui/Button';
import Spinner              from '../components/ui/Spinner';
import toast                from 'react-hot-toast';

// ── Section card ─────────────────────────────────────────────────────────────
function Section({ icon, title, description, children }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-lg flex-shrink-0">{icon}</div>
        <div>
          <h2 className="font-bold text-charcoal-800">{title}</h2>
          {description && <p className="text-xs text-cream-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="divider !my-0" />
      {children}
    </div>
  );
}

export default function MyProfilePage() {
  const { user, updateUser, syncProfile, syncAvatar } = useAuthStore();
  const { uploadAvatarAndSync } = useAuth();
  const { lat, lng, locationName: storedLoc, hasLocation, isLocating, requestLocation, setLocationName } = useLocation();

  // ── Profile form state ────────────────────────────────────────────────────
  const [profileForm,    setProfileForm]   = useState({ name: user?.name || '', phone: user?.phone || '', locationName: user?.locationName || '' });
  const [profileLoading, setProfileLoading]= useState(false);

  // ── Avatar state ──────────────────────────────────────────────────────────
  const [avatarLoading,  setAvatarLoading] = useState(false);
  const avatarInputRef   = useRef(null);

  // ── College ID state ──────────────────────────────────────────────────────
  const [collegeIdLoading, setCollegeIdLoading] = useState(false);
  const collegeInputRef    = useRef(null);

  const setPF = (k) => (e) => setProfileForm(f => ({ ...f, [k]: e.target.value }));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) return toast.error('Name is required.');
    setProfileLoading(true);
    try {
      const { data } = await syncProfile(profileForm);
      updateUser(data);
      toast.success('Profile updated! ✓');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile.');
    } finally { setProfileLoading(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      await uploadAvatarAndSync(file);
    } catch {}
    finally { setAvatarLoading(false); }
  };

  const handleLocationUpdate = async () => {
    try {
      await requestLocation();
    } catch {}
  };

  const handleCollegeIdUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCollegeIdLoading(true);
    try {
      const { data } = await uploadCollegeId((() => { const fd = new FormData(); fd.append('collegeId', file); return fd; })());
      updateUser({ isStudentVerified: true, collegeIdUrl: data.collegeIdUrl });
      toast.success('🎓 Student badge verified!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload college ID.');
    } finally { setCollegeIdLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <Link to={`/profile/${user?._id}`}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-cream-200 shadow-card text-cream-500 hover:text-charcoal-800 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-800 tracking-tight">Edit Profile</h1>
          <p className="text-sm text-cream-400 mt-0.5">Update your personal information</p>
        </div>
      </div>

      {/* ── Avatar ── */}
      <Section icon="📷" title="Profile Photo" description="Your photo is shown on listings and messages.">
        <div className="flex items-center gap-5">
          <div className="relative">
            <UserAvatar user={user} size="xl" showBadge />
            {avatarLoading && (
              <div className="absolute inset-0 rounded-full bg-charcoal-900/50 flex items-center justify-center">
                <Spinner size="sm" color="white" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Button variant="secondary" size="sm" onClick={() => avatarInputRef.current?.click()} loading={avatarLoading}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Change Photo
            </Button>
            <p className="text-xs text-cream-400">JPG, PNG or WebP. Max 5MB.</p>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </Section>

      {/* ── Profile info ── */}
      <Section icon="👤" title="Personal Information" description="This information is shown on your public profile.">
        <div className="space-y-4">
          <Input label="Full Name" required value={profileForm.name} onChange={setPF('name')} placeholder="Rahul Kumar" />
          <Input label="Mobile Number" type="tel" value={profileForm.phone} onChange={setPF('phone')}
            placeholder="9876543210" hint="Not shown publicly"
            leftIcon={<span className="text-xs font-bold text-cream-500">+91</span>}
          />
          <Input label="Area / Locality" value={profileForm.locationName} onChange={setPF('locationName')}
            placeholder="e.g. Civil Lines, Kanpur" hint="Shown on your profile"
          />
          <Button variant="primary" size="md" loading={profileLoading} onClick={handleProfileSave}>
            Save Changes
          </Button>
        </div>
      </Section>

      {/* ── Location ── */}
      <Section icon="📍" title="GPS Location" description="Used to show relevant items near you. Not shown publicly.">
        {hasLocation ? (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-forest-50 border border-forest-200 rounded-xl">
              <div className="w-8 h-8 rounded-xl bg-forest-gradient flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-forest-700">Location saved</p>
                <p className="text-xs text-forest-600">{lat?.toFixed(5)}, {lng?.toFixed(5)}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLocationUpdate} loading={isLocating}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Update Location
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-lg">⚠️</span>
              <p className="text-sm text-amber-800 font-medium">Location not set. Enable it to see nearby items.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLocationUpdate} loading={isLocating}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Enable GPS Location
            </Button>
          </div>
        )}
      </Section>

      {/* ── Student badge ── */}
      <Section icon="🎓" title="Student Verification" description="Upload your college ID to get a verified student badge.">
        {user?.isStudentVerified ? (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">🎓</div>
            <div>
              <p className="text-sm font-bold text-blue-800">Student Verified</p>
              <p className="text-xs text-blue-600">Your student badge is active and shown on your profile.</p>
            </div>
            <svg className="w-5 h-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-cream-50 border border-cream-200 rounded-xl">
              <p className="text-xs text-cream-500 font-medium">Upload a photo of your college ID card (student ID, enrollment card, etc.)</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => collegeInputRef.current?.click()} loading={collegeIdLoading}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload College ID
            </Button>
            <input ref={collegeInputRef} type="file" accept="image/*" className="hidden" onChange={handleCollegeIdUpload} />
          </div>
        )}
      </Section>

      {/* ── Danger zone ── */}
      <div className="flex items-center justify-between p-4 bg-cream-50 border border-cream-200 rounded-2xl">
        <div>
          <p className="text-sm font-semibold text-charcoal-800">View public profile</p>
          <p className="text-xs text-cream-400">See how your profile looks to others</p>
        </div>
        <Link to={`/profile/${user?._id}`}>
          <Button variant="secondary" size="sm">View Profile</Button>
        </Link>
      </div>
    </div>
  );
}