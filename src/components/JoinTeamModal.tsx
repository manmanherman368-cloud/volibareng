import React, { useState } from 'react';
import { X, KeyRound, Check } from 'lucide-react';

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
}

export const JoinTeamModal: React.FC<JoinTeamModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Kode tim wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(code.trim().toUpperCase());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal bergabung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-slate-100">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-lg text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-sky-400" />
            Gabung Tim dengan Kode
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Masukkan kode tim yang dibagikan oleh pengurus komunitasmu (Contoh: <code className="text-amber-400 font-mono">GARUDA-JKT</code> atau <code className="text-amber-400 font-mono">SPARTA-TNG</code>).
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Kode Tim *</label>
            <input
              type="text"
              required
              placeholder="Contoh: GARUDA-JKT"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 uppercase tracking-widest font-mono text-center text-sm font-black focus:outline-none focus:border-amber-500"
            />
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
              className="px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Memeriksa...' : 'Gabung Tim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
