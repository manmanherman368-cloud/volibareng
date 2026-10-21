import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Info, BellRing, Sparkles } from 'lucide-react';
import { VolleyballEvent } from '../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  editingEvent?: VolleyballEvent | null;
  onSubmit: (data: {
    title: string;
    startsAt: string;
    durationMinutes: number;
    location: string;
    locationMapUrl?: string;
    notes?: string;
    maxPlayers: number;
  }) => Promise<void>;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  editingEvent,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [location, setLocation] = useState('');
  const [locationMapUrl, setLocationMapUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(14);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      const d = new Date(editingEvent.startsAt);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${min}`);
      setDurationMinutes(editingEvent.durationMinutes);
      setLocation(editingEvent.location);
      setLocationMapUrl(editingEvent.locationMapUrl || '');
      setNotes(editingEvent.notes || '');
      setMaxPlayers(editingEvent.maxPlayers || 14);
    } else {
      // Default: 2 days from now at 19:00
      const future = new Date();
      future.setDate(future.getDate() + 2);
      const yyyy = future.getFullYear();
      const mm = String(future.getMonth() + 1).padStart(2, '0');
      const dd = String(future.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime('19:00');
      setTitle('Latihan Rutin & Game 6v6');
      setLocation('GOR Bulungan Court 2, Jakarta');
      setNotes('Wajib jersey utama navy. Lapangan sudah dipesan.');
      setMaxPlayers(14);
      setDurationMinutes(120);
    }
  }, [editingEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !date || !time || !location.trim()) {
      setError('Nama kegiatan, tanggal, waktu, dan lokasi wajib diisi.');
      return;
    }

    const isoDateString = `${date}T${time}:00`;
    const checkDate = new Date(isoDateString);
    if (isNaN(checkDate.getTime())) {
      setError('Format tanggal atau jam tidak valid.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        startsAt: checkDate.toISOString(),
        durationMinutes: Number(durationMinutes),
        location: location.trim(),
        locationMapUrl: locationMapUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        maxPlayers: Number(maxPlayers),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan jadwal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              {teamName}
            </span>
            <h2 className="text-lg font-black text-white">
              {editingEvent ? 'Edit Jadwal Main Voli' : 'Buat Jadwal Main Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold">
              {error}
            </div>
          )}

          {/* Quick preset suggestions */}
          {!editingEvent && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-medium text-[11px]">Contoh Judul:</span>
              <button
                type="button"
                onClick={() => setTitle('Latihan Rutin & Drill Passing')}
                className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 hover:bg-slate-700 text-[11px]"
              >
                Latihan Rutin
              </button>
              <button
                type="button"
                onClick={() => setTitle('Sparing Persahabatan (5 Set)')}
                className="px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 hover:bg-slate-700 text-[11px]"
              >
                Sparing
              </button>
              <button
                type="button"
                onClick={() => setTitle('Fun Game Akhir Pekan')}
                className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 hover:bg-slate-700 text-[11px]"
              >
                Fun Game
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Nama Kegiatan / Pertandingan *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Latihan Rutin & Drill Servis 6v6"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Tanggal Main *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Jam Mulai *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          {/* Duration & Max Players */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Durasi Bermain
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
              >
                <option value={60}>60 Menit (1 Jam)</option>
                <option value={90}>90 Menit (1.5 Jam)</option>
                <option value={120}>120 Menit (2 Jam)</option>
                <option value={180}>180 Menit (3 Jam)</option>
                <option value={240}>240 Menit (4 Jam)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Kuota Maksimal
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
              >
                <option value={12}>12 Pemain (Pas 2 Tim 6v6)</option>
                <option value={14}>14 Pemain (2 Tim + 2 Cadangan)</option>
                <option value={16}>16 Pemain (2 Tim + 4 Cadangan)</option>
                <option value={18}>18 Pemain (3 Tim 6v6 Bergantian)</option>
                <option value={24}>24 Pemain (4 Tim)</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Nama Lapangan & Alamat *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: GOR Bulungan Court 2, Jl. Bulungan No.1"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* Maps Link */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Tautan Google Maps (Opsional)
            </label>
            <input
              type="url"
              placeholder="https://maps.google.com/?q=..."
              value={locationMapUrl}
              onChange={(e) => setLocationMapUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Catatan Tambahan (Jersey, Biaya Patungan, dll.)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Wajib jersey navy. Patungan sewa lapangan Rp 25.000/orang."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* Automation info callout */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
            <BellRing className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-300 text-[11px]">
                Pengingat Otomatis Aktif
              </p>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Saat disimpan, VoliBareng otomatis menjadwalkan notifikasi <strong>1 hari sebelum (H-1)</strong> dan <strong>2 jam sebelum main (H-2)</strong> untuk semua anggota tim.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : editingEvent ? 'Simpan Perubahan' : 'Terbitkan Jadwal'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
