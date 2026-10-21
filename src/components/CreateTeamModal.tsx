import React, { useState } from 'react';
import { X, Shield, Plus } from 'lucide-react';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, timezone: string) => Promise<void>;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jakarta (WIB)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Nama tim wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(name.trim(), description.trim(), timezone);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat tim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-lg text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            Buat Komunitas / Tim Baru
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Nama Tim / Klub Voli *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Rajawali Volleyball Club Jakarta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Deskripsi & Wilayah</label>
            <textarea
              rows={2}
              placeholder="Contoh: Komunitas main santai tiap Rabu malam & sparring akhir pekan di Jaksel."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Zona Waktu Tim</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Asia/Jakarta (WIB)">Asia/Jakarta (WIB - Indonesia Barat)</option>
              <option value="Asia/Makassar (WITA)">Asia/Makassar (WITA - Indonesia Tengah)</option>
              <option value="Asia/Jayapura (WIT)">Asia/Jayapura (WIT - Indonesia Timur)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
            👑 Sebagai pembuat tim, kamu otomatis menjadi <strong>Admin</strong> dan kode tim unik akan dibuatkan untuk mengundang teman.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl disabled:opacity-50"
            >
              {loading ? 'Membuat...' : 'Buat Tim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
