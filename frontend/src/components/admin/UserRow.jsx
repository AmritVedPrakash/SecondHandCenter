// UserRow.jsx
// Single row inside the UsersPage table.
//
// Props:
//   user    — object
//   onBan   — fn(user)
//   onUnban — fn(user)

import { useNavigate } from 'react-router-dom';

const timeAgo = (dateStr) => {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

export default function UserRow({ user, onBan, onUnban }) {
  const navigate = useNavigate();

  return (
    <tr className="border-b border-[#1c1c2a] hover:bg-[#18181f] transition-colors group">

      {/* Avatar + name + email */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ff6b35]/15 border border-[#ff6b35]/20
                          flex items-center justify-center text-sm font-bold text-[#ff6b35]
                          flex-shrink-0 overflow-hidden">
            {user.avatar
              ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
              : user.name?.[0]?.toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#e2e2ee] leading-tight truncate max-w-[160px]">
              {user.name}
            </p>
            <p className="text-xs text-[#5a5a78] truncate max-w-[160px]">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-[#5a5a78]">{user.phone || '—'}</span>
      </td>

      {/* Badges */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {user.isAdmin && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                             bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-semibold">
              👑 Admin
            </span>
          )}
          {user.isStudentVerified && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                             bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
              🎓 Student
            </span>
          )}
          {user.isBanned && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                             bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
              🔨 Banned
            </span>
          )}
          {!user.isAdmin && !user.isStudentVerified && !user.isBanned && (
            <span className="text-[10px] text-[#3a3a52]">—</span>
          )}
        </div>
      </td>

      {/* Listings count */}
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-mono text-[#e2e2ee]">{user.listingsCount ?? 0}</span>
      </td>

      {/* Joined */}
      <td className="px-4 py-3">
        <span className="text-xs text-[#5a5a78]">{timeAgo(user.createdAt)}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/admin/users/${user._id}`)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1c1c2a] text-[#a0a0b8]
                       hover:bg-[#2a2a38] hover:text-[#e2e2ee] transition-colors border border-transparent
                       hover:border-[#2a2a38]"
          >
            View →
          </button>

          {user.isBanned ? (
            <button
              onClick={() => onUnban(user)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/8 text-green-400
                         border border-green-500/15 hover:bg-green-500/15 transition-colors"
            >
              Unban
            </button>
          ) : (
            !user.isAdmin && (
              <button
                onClick={() => onBan(user)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/8 text-red-400
                           border border-red-500/15 hover:bg-red-500/15 transition-colors"
              >
                Ban
              </button>
            )
          )}
        </div>
      </td>

    </tr>
  );
}
