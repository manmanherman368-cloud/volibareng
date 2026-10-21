import React, { useState } from 'react';
import { X } from 'lucide-react';
import { VolleyballPosition } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (data: {
    displayName: string;
    email: string;
    phone: string;
    password: string;
    position: string;
  }) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
}) => {
  if (!isOpen) return null;

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState<VolleyballPosition>('All-Round');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister({
          displayName,
          email,
          phone,
          password,
          position,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal autentikasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-100 my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
              🏐
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Akun VoliBareng</h3>
              <p className="text-xs text-slate-400">Masuk atau daftar untuk sinkronisasi data online.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setTab('login')}
            className={`py-2 rounded-lg transition ${
              tab === 'login' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            onClick={() => setTab('register')}
            className={`py-2 rounded-lg transition ${
              tab === 'register' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {tab === 'register' && (
            <>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Farhan Halim"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nomor WhatsApp *</label>
                <input
                  type="tel"
                  placeholder="0812xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Posisi Voli</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as VolleyballPosition)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Outside Hitter / Spiker">Outside Hitter / Spiker</option>
                  <option value="Setter">Setter</option>
                  <option value="Middle Blocker">Middle Blocker</option>
                  <option value="Opposite Hitter">Opposite Hitter</option>
                  <option value="Libero">Libero</option>
                  <option value="All-Round">All-Round</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block font-bold text-slate-300 mb-1">Email *</label>
            <input
              type="email"
              required
              placeholder="email@contoh.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Kata Sandi *</label>
            <input
              type="password"
              required
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Memproses...' : tab === 'login' ? 'Masuk ke VoliBareng' : 'Daftar Sekarang'}
          </button>
        </form>

      </div>
    </div>
  );
};
