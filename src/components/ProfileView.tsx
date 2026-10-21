import React, { useState } from 'react';
import { User, Phone, Mail, Award, Check, Save, LogOut } from 'lucide-react';
import { UserProfile, VolleyballPosition } from '../types';

interface ProfileViewProps {
  currentUser: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onOpenAuthModal: () => void;
}

const POSITIONS: VolleyballPosition[] = [
  'Setter',
  'Outside Hitter / Spiker',
  'Middle Blocker',
  'Opposite Hitter',
  'Libero',
  'All-Round',
];

const AVATARS = ['🏐', '⚡', '🎯', '🚀', '🔥', '🛡️', '🧱', '🪄', '💥', '🦅'];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  onOpenAuthModal,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [position, setPosition] = useState<VolleyballPosition>(currentUser.position || 'All-Round');
  const [avatar, setAvatar] = useState(currentUser.avatar || '🏐');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await onUpdateProfile({
        displayName: displayName.trim(),
        phone: phone.trim(),
        position,
        avatar,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert('Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        
        {/* Profile Card Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner">
            {avatar}
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{currentUser.displayName}</h2>
            <p className="text-xs text-amber-400 font-semibold">{currentUser.position}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Profil berhasil disimpan!</span>
            </div>
          )}

          {/* Avatar Picker */}
          <div>
            <label className="block font-bold text-slate-300 mb-2">
              Pilih Avatar / Ikon Pemain
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition ${
                    avatar === av
                      ? 'bg-amber-500/25 border-2 border-amber-400 scale-105 shadow-md'
                      : 'bg-slate-950 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Nama Tampilan *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Nomor WhatsApp / HP (Untuk Rekap Tim)
            </label>
            <input
              type="tel"
              placeholder="0812xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* Volleyball Position */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Posisi Bermain Utama
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as VolleyballPosition)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ganti / Masuk Akun Lain</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
