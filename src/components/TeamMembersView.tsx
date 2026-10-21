import React, { useState } from 'react';
import {
  Users,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  User,
  UserPlus,
  Search,
  MoreVertical,
  Trash2,
  Share2,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Team, TeamMember, UserProfile, UserRole } from '../types';

interface TeamMembersViewProps {
  team: Team | null;
  members: TeamMember[];
  currentUser: UserProfile;
  currentRole: UserRole | null;
  onUpdateRole: (userId: string, newRole: UserRole) => void;
  onRemoveMember: (userId: string) => void;
  onOpenCreateTeam: () => void;
  onOpenJoinTeam: () => void;
}

export const TeamMembersView: React.FC<TeamMembersViewProps> = ({
  team,
  members,
  currentUser,
  currentRole,
  onUpdateRole,
  onRemoveMember,
  onOpenCreateTeam,
  onOpenJoinTeam,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');

  if (!team) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
        <p className="text-slate-400">Pilih atau buat tim terlebih dahulu.</p>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(team.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareInviteWa = () => {
    const text = `🏐 *Undangan Bergabung Tim Voli: ${team.name}*\n\nYuk gabung di tim kita melalui aplikasi *VoliBareng* untuk jadwal main & konfirmasi kehadiran.\n\n🔑 *Kode Tim:* ${team.code}\n\nBuka VoliBareng dan masukkan kode di atas untuk langsung bergabung!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredMembers = members.filter((m) => {
    const u = m.user;
    if (!u) return true;
    const matchSearch =
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      u.position.toLowerCase().includes(search.toLowerCase());
    const matchPos = positionFilter === 'all' || u.position === positionFilter;
    return matchSearch && matchPos;
  });

  return (
    <div className="space-y-5">
      {/* Team Header & Invite Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Komunitas Voli
              </span>
              <span className="text-xs text-slate-400">
                Zona Waktu: {team.timezone}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{team.name}</h2>
            <p className="text-xs text-slate-300 max-w-xl">{team.description}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={onOpenJoinTeam}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              <span>Gabung Tim Lain</span>
            </button>
            <button
              onClick={onOpenCreateTeam}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Tim Baru</span>
            </button>
          </div>
        </div>

        {/* Invite Code Box */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">
                Kode Undangan Tim (Berikan ke Calon Anggota):
              </p>
              <p className="font-mono text-base font-black tracking-wider text-amber-300">
                {team.code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>

            <button
              onClick={handleShareInviteWa}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan ke WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Member Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-base text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Daftar Anggota</span>
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {members.length} Pemain
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama, posisi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Posisi</option>
            <option value="Setter">Setter</option>
            <option value="Outside Hitter / Spiker">Outside Hitter / Spiker</option>
            <option value="Middle Blocker">Middle Blocker</option>
            <option value="Opposite Hitter">Opposite Hitter</option>
            <option value="Libero">Libero</option>
            <option value="All-Round">All-Round</option>
          </select>
        </div>
      </div>

      {/* Members Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMembers.map((member) => {
          const user = member.user;
          const isCurrentUser = member.userId === currentUser.id;

          return (
            <div
              key={member.id}
              className={`p-4 rounded-2xl border transition ${
                isCurrentUser
                  ? 'bg-slate-900/90 border-amber-500/40 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-750'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                    {user?.avatar || '🏐'}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-black text-sm text-slate-100">
                        {user?.displayName || 'Pemain'}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                          Kamu
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                      {user?.position || 'Pemain Voli'}
                    </p>

                    {user?.phone && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        WA: {user.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {member.role === 'admin' ? (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      Admin
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                      Pemain
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Actions on Members */}
              {currentRole === 'admin' && !isCurrentUser && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">Aksi Admin:</span>

                  <div className="flex items-center gap-2">
                    {member.role === 'pemain' ? (
                      <button
                        onClick={() => onUpdateRole(member.userId, 'admin')}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline"
                      >
                        Jadikan Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateRole(member.userId, 'pemain')}
                        className="text-[11px] text-slate-400 hover:text-slate-200 font-semibold underline"
                      >
                        Jadikan Pemain
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (window.confirm(`Keluarkan ${user?.displayName || 'pemain'} dari tim?`)) {
                          onRemoveMember(member.userId);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                      title="Keluarkan dari tim"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
