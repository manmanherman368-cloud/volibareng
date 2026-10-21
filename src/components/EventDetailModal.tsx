import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Users,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Share2,
  CalendarPlus,
  Edit2,
  Ban,
  Trash2,
  Copy,
  Check,
  Flame,
  MessageCircle
} from 'lucide-react';
import { VolleyballEvent, UserProfile, UserRole, AttendanceStatus } from '../types';

interface EventDetailModalProps {
  event: VolleyballEvent | null;
  currentUser: UserProfile;
  currentRole: UserRole | null;
  onClose: () => void;
  onSubmitRsvp: (eventId: string, status: AttendanceStatus, note?: string) => void;
  onEditEvent: (event: VolleyballEvent) => void;
  onCancelEvent: (eventId: string, reason: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  currentUser,
  currentRole,
  onClose,
  onSubmitRsvp,
  onEditEvent,
  onCancelEvent,
  onDeleteEvent,
}) => {
  if (!event) return null;

  const [activeTab, setActiveTab] = useState<AttendanceStatus>('hadir');
  const [personalNote, setPersonalNote] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [waText, setWaText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userAttendance = event.attendances?.find((a) => a.userId === currentUser.id);

  // Initialize note if already present
  React.useEffect(() => {
    if (userAttendance?.note) {
      setPersonalNote(userAttendance.note);
    }
  }, [userAttendance]);

  const attendances = event.attendances || [];
  const hadirList = attendances.filter((a) => a.status === 'hadir');
  const belumPastiList = attendances.filter((a) => a.status === 'belum_pasti');
  const tidakHadirList = attendances.filter((a) => a.status === 'tidak_hadir');

  const hadirCount = hadirList.length;
  const isReady = hadirCount >= 12;

  const handleRsvp = async (status: AttendanceStatus) => {
    setIsSubmitting(true);
    try {
      await onSubmitRsvp(event.id, status, personalNote);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsapp = async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/whatsapp-text`);
      const data = await res.json();
      setWaText(data.text);
      setShowWhatsappModal(true);
    } catch {
      alert('Gagal mengambil teks WhatsApp');
    }
  };

  const handleCopyWa = () => {
    navigator.clipboard.writeText(waText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const d = new Date(event.startsAt);
  const dateFormatted = d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatted = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20">
                {event.teamName || 'Tim Voli'}
              </span>
              {event.status === 'terjadwal' ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                  Terjadwal
                </span>
              ) : event.status === 'selesai' ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400">
                  Selesai
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/20">
                  Dibatalkan
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{event.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Match Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                Hari & Tanggal
              </span>
              <p className="font-bold text-slate-200 text-sm">{dateFormatted}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Waktu & Durasi
              </span>
              <p className="font-bold text-slate-200 text-sm">
                {timeFormatted} WIB ({event.durationMinutes} Menit)
              </p>
            </div>

            <div className="sm:col-span-2 space-y-1 pt-1 border-t border-slate-800/60">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400" />
                Lokasi Lapangan
              </span>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-200">{event.location}</p>
                {event.locationMapUrl && (
                  <a
                    href={event.locationMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:underline shrink-0"
                  >
                    <span>Buka Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {event.notes && (
              <div className="sm:col-span-2 space-y-1 pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 font-medium">Catatan / Jersey:</span>
                <p className="text-slate-300 font-normal italic">{event.notes}</p>
              </div>
            )}

            {event.cancellationReason && (
              <div className="sm:col-span-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <strong>Alasan Pembatalan:</strong> {event.cancellationReason}
              </div>
            )}
          </div>

          {/* Player Personal RSVP Card */}
          {event.status === 'terjadwal' && (
            <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>Konfirmasi Kehadiranmu</span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">
                    ({currentUser.displayName})
                  </span>
                </h4>
                {userAttendance && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Saat ini: {userAttendance.status === 'hadir' ? '✅ Hadir' : userAttendance.status === 'belum_pasti' ? '⏳ Belum Pasti' : '❌ Tidak Hadir'}
                  </span>
                )}
              </div>

              {/* Status Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleRsvp('hadir')}
                  className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 ${
                    userAttendance?.status === 'hadir'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hadir</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleRsvp('belum_pasti')}
                  className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 ${
                    userAttendance?.status === 'belum_pasti'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Belum Pasti</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleRsvp('tidak_hadir')}
                  className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 ${
                    userAttendance?.status === 'tidak_hadir'
                      ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                      : 'bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tidak Hadir</span>
                </button>
              </div>

              {/* Personal Note Input */}
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Catatan tambahan (opsional: telat 15 mnt, bawa bola Mikasa, dll.)"
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Volleyball Match Readiness Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Flame className={`w-5 h-5 ${isReady ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>
              <div>
                <p className="text-xs font-black text-white">
                  {isReady ? '🔥 Kuota Siap Main (2 Tim Lengkap 6v6)' : '⚠️ Belum Cukup untuk 2 Tim Lengkap (6v6)'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {hadirCount} pemain konfirmasi Hadir dari kuota {event.maxPlayers} pemain.
                  {!isReady && ` Butuh ${12 - hadirCount} lagi untuk minimal 12 pemain.`}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenWhatsapp}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Format WA</span>
            </button>
          </div>

          {/* Full Attendance Recap List (FR-07) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Rekap Daftar Pemain</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Total Konfirmasi: {attendances.length}
              </span>
            </div>

            {/* Sub-tabs: Hadir / Belum Pasti / Tidak Hadir */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('hadir')}
                className={`py-1.5 rounded-lg transition ${
                  activeTab === 'hadir'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hadir ({hadirList.length})
              </button>
              <button
                onClick={() => setActiveTab('belum_pasti')}
                className={`py-1.5 rounded-lg transition ${
                  activeTab === 'belum_pasti'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Belum Pasti ({belumPastiList.length})
              </button>
              <button
                onClick={() => setActiveTab('tidak_hadir')}
                className={`py-1.5 rounded-lg transition ${
                  activeTab === 'tidak_hadir'
                    ? 'bg-rose-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tidak Hadir ({tidakHadirList.length})
              </button>
            </div>

            {/* List rendered by activeTab */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {(activeTab === 'hadir' ? hadirList : activeTab === 'belum_pasti' ? belumPastiList : tidakHadirList).length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  Belum ada pemain dengan status ini.
                </div>
              ) : (
                (activeTab === 'hadir' ? hadirList : activeTab === 'belum_pasti' ? belumPastiList : tidakHadirList).map((att, index) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-slate-500 text-[11px] w-4">
                        {index + 1}.
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-sm">
                        {att.user?.avatar || '🏐'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">
                          {att.user?.displayName || 'Pemain'}
                        </p>
                        {att.user?.position && (
                          <p className="text-[10px] text-amber-400/90 font-medium">
                            {att.user.position}
                          </p>
                        )}
                      </div>
                    </div>

                    {att.note ? (
                      <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 max-w-[180px] truncate">
                        "{att.note}"
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-mono">
                        {new Date(att.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Admin Management Toolbar */}
          {currentRole === 'admin' && (
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Kelola Jadwal (Khusus Admin Tim)
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onEditEvent(event)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Jadwal</span>
                </button>

                {event.status === 'terjadwal' && (
                  <button
                    onClick={() => setShowCancelPrompt(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Batalkan Jadwal</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (window.confirm('Yakin ingin menghapus permanen jadwal ini?')) {
                      onDeleteEvent(event.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>

              {/* Cancellation reason input prompt */}
              {showCancelPrompt && (
                <div className="p-3 bg-slate-950 rounded-xl border border-rose-500/40 space-y-2 mt-2">
                  <p className="text-xs font-bold text-rose-300">
                    Alasan Pembatalan Jadwal:
                  </p>
                  <input
                    type="text"
                    placeholder="Contoh: Hujan lebat, lapangan maintenance..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowCancelPrompt(false)}
                      className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        onCancelEvent(event.id, cancelReason || 'Dibatalkan oleh pengurus.');
                        setShowCancelPrompt(false);
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg"
                    >
                      Konfirmasi Pembatalan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
          <a
            href={`/api/events/${event.id}/ical`}
            download
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Ekspor Kalender (.ics)</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl transition"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* WhatsApp Modal */}
      {showWhatsappModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                Format WhatsApp Siap Kirim
              </h3>
              <button
                onClick={() => setShowWhatsappModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              readOnly
              value={waText}
              rows={10}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleCopyWa}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Teks WhatsApp'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
