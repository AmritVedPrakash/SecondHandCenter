import { Link } from 'react-router-dom';

// ─── sizes ───────────────────────────────────────────────────────────────────
const S = {
  xs:   { wrap:'w-6 h-6',    ring:'ring-[1.5px]', badge:'w-3.5 h-3.5 -bottom-0.5 -right-0.5 ring-1 text-[7px]' },
  sm:   { wrap:'w-8 h-8',    ring:'ring-2',       badge:'w-4 h-4 -bottom-0.5 -right-0.5 ring-[1.5px] text-[8px]' },
  md:   { wrap:'w-10 h-10',  ring:'ring-2',       badge:'w-5 h-5 -bottom-1 -right-1 ring-2 text-[9px]' },
  lg:   { wrap:'w-14 h-14',  ring:'ring-[3px]',   badge:'w-6 h-6 -bottom-1 -right-1 ring-2 text-[10px]' },
  xl:   { wrap:'w-20 h-20',  ring:'ring-[3px]',   badge:'w-7 h-7 -bottom-1 -right-1 ring-2 text-xs' },
  '2xl':{ wrap:'w-28 h-28',  ring:'ring-4',       badge:'w-8 h-8 -bottom-1 -right-1 ring-2 text-sm' },
};

function src(user) {
  if (user?.avatar) return user.avatar;
  const n = encodeURIComponent(user?.name || 'U');
  return `https://api.dicebear.com/8.x/initials/svg?seed=${n}&backgroundColor=e08c2a&textColor=ffffff&fontSize=40&fontWeight=700`;
}

export default function UserAvatar({ user, size='md', showBadge=true, className='' }) {
  const s = S[size] ?? S.md;
  return (
    <div className={`relative flex-shrink-0 ${s.wrap} ${className}`}>
      <img
        src={src(user)}
        alt={user?.name || 'User'}
        draggable={false}
        className={`w-full h-full rounded-full object-cover select-none
          ${user?.isStudentVerified && showBadge
            ? `${s.ring} ring-blue-400 ring-offset-1 ring-offset-cream-50`
            : 'border border-cream-200'}`}
        onError={e => {
          e.target.onerror = null;
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'U')}&background=e08c2a&color=fff&bold=true&size=128`;
        }}
      />
      {user?.isStudentVerified && showBadge && (
        <span className={`absolute ${s.badge} bg-blue-500 text-white rounded-full flex items-center justify-center font-bold ring-cream-50 shadow-sm`} title="Verified Student">🎓</span>
      )}
    </div>
  );
}

export function LinkedAvatar({ user, size, showBadge, className }) {
  if (!user?._id) return <UserAvatar user={user} size={size} showBadge={showBadge} className={className} />;
  return (
    <Link to={`/profile/${user._id}`} className="flex-shrink-0 inline-block">
      <UserAvatar user={user} size={size} showBadge={showBadge} className={className} />
    </Link>
  );
}
