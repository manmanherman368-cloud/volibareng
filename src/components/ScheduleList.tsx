import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Users,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Share2,
  CalendarPlus,
  ChevronRight,
  AlertCircle,
  Flame,
  Search,
  ExternalLink
} from 'lucide-react';
import { VolleyballEvent, UserProfile, UserRole, AttendanceStatus } from '../types';

interface ScheduleListProps {
  events: VolleyballEvent[];
  currentUser: UserProfile;
  currentRole: UserRole | null;
  filter: 'upcoming' | 'past' | 'all';
  setFilter: (filter: 'upcoming' | 'past' | 'all') => void;
  onOpenCreateModal: () => void;
  onSelectEvent: (event: VolleyballEvent) => void;
  onQuickRsvp: (eventId: string, status: AttendanceStatus) => void;
  onOpenWhatsappModal: (event: VolleyballEvent) => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({
  events,
  currentUser,
  currentRole,
  filter,
  setFilter,
  onOpenCreateModal,
  onSelectEvent,
  onQuickRsvp,
  onOpenWhatsappModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  });

  const formatEventDate = (isoString: string) => {
    const d = new Date(isoString);
    const dayName = d.toLocaleDateString('id-ID', { weekday: 'long' });
    const dateNum = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return { dayName, dateNum };
  };

  const formatEventTime = (isoString: string, durationMinutes: number) => {
    const start = new Date(isoString);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const startStr = start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const endStr = end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${startStr} - ${endStr} WIB`;
  };

  const getRelativeDays = (isoString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(isoString);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hari Ini';
    if (diffDays === 1) return 'Besok';
    if (diffDays === 2) return 'Lusa (2 hari lagi)';
    if (diffDays > 2) return `${diffDays} hari lagi`;
    if (diffDays === -1) return 'Kemarin';
    return `${Math.abs(diffDays)} hari lalu`;
  };

  return (
    <div className="space-y-5">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Jadwal Main Voli</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredEvents.length} Jadwal
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola sesi sparring, latihan rutin, dan konfirmasi kehadiran pemain.
          </p>
        </div>

        {/* Admin Create Button */}
        {currentRole === 'admin' ? (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Jadwal Main</span>
          </button>
        ) : (
          <div className="text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
            <span>Peran: <strong>Pemain</strong></span>
            <span className="text-slate-500">•</span>
            <span>Konfirmasi kehadiranmu di bawah</span>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === 'upcoming'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mendatang
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === 'past'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Riwayat Selesai
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari lokasi, nama tanding..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">
            🏐
          </div>
          <h3 className="font-bold text-slate-200 text-base">Belum Ada Jadwal</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filter === 'upcoming'
              ? 'Tidak ada jadwal main mendatang yang cocok. Admin tim dapat membuat jadwal baru sekarang!'
              : 'Belum ada riwayat jadwal yang tersimpan.'}
          </p>
          {currentRole === 'admin' && (
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-400 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Jadwal Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const { dayName, dateNum } = formatEventDate(event.startsAt);
            const timeStr = formatEventTime(event.startsAt, event.durationMinutes);
            const relativeTime = getRelativeDays(event.startsAt);
            const userAttendance = event.attendances?.find((a) => a.userId === currentUser.id);
            const hadirCount = event.summary?.hadir || 0;
            const belumPastiCount = event.summary?.belumPasti || 0;
            const tidakHadirCount = event.summary?.tidakHadir || 0;
            const isReady = hadirCount >= 12;

            return (
              <div
                key={event.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition shadow-lg relative overflow-hidden group"
              >
                {/* Top Banner Ribbon for Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25">
                      {relativeTime}
                    </span>

                    {event.status === 'terjadwal' ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Terjadwal
                      </span>
                    ) : event.status === 'selesai' ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                        Selesai
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/20">
                        Dibatalkan
                      </span>
                    )}
                  </div>

                  {/* Ready for game indicator */}
                  {event.status === 'terjadwal' && (
                    <div className="flex items-center gap-1.5">
                      {isReady ? (
                        <div className="flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                          <span>Siap 2 Tim (6v6)!</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                          Kurang {Math.max(0, 12 - hadirCount)} pemain untuk 6v6 lengkap
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Event Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  
                  {/* Left Column: Date and Details */}
                  <div className="lg:col-span-8 space-y-2.5">
                    <div className="flex items-start gap-3">
                      {/* Big Date Badge */}
                      <div className="w-14 h-14 rounded-xl bg-slate-800/90 border border-slate-700/60 flex flex-col items-center justify-center shrink-0 text-center">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {dayName.slice(0, 3)}
                        </span>
                        <span className="text-lg font-black text-white leading-none">
                          {new Date(event.startsAt).getDate()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          onClick={() => onSelectEvent(event)}
                          className="text-base sm:text-lg font-black text-white hover:text-amber-400 transition cursor-pointer truncate"
                        >
                          {event.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-300 mt-1">
                          <div className="flex items-center gap-1 text-amber-300 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeStr} ({event.durationMinutes} mnt)</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-300 truncate">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>

                        {event.notes && (
                          <p className="text-xs text-slate-400 mt-1.5 line-clamp-1 italic bg-slate-950/40 px-2 py-1 rounded-lg border border-slate-800/60">
                            💬 "{event.notes}"
                          </p>
                        )}
                        
                        {event.cancellationReason && (
                          <p className="text-xs text-rose-300 mt-1.5 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
                            ⚠️ Alasan Pembatalan: {event.cancellationReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Attendance Recap Bar */}
                  <div className="lg:col-span-4 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        Rekap Kehadiran
                      </span>
                      <span className="font-mono text-amber-400 font-bold">
                        {hadirCount} / {event.maxPlayers}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (hadirCount / event.maxPlayers) * 100)}%` }}
                        title={`${hadirCount} Hadir`}
                      />
                      <div
                        className="bg-amber-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (belumPastiCount / event.maxPlayers) * 100)}%` }}
                        title={`${belumPastiCount} Belum Pasti`}
                      />
                      <div
                        className="bg-rose-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (tidakHadirCount / event.maxPlayers) * 100)}%` }}
                        title={`${tidakHadirCount} Tidak Hadir`}
                      />
                    </div>

                    {/* Breakdown Badges */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-emerald-400 font-semibold">
                        ✅ {hadirCount} Hadir
                      </span>
                      <span className="text-amber-400 font-semibold">
                        ⏳ {belumPastiCount} Ragu
                      </span>
                      <span className="text-rose-400 font-semibold">
                        ❌ {tidakHadirCount} Absen
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Player Quick RSVP & Action Buttons */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  
                  {/* Quick RSVP Selector */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-400 mr-1">
                      Statusmu:
                    </span>
                    
                    {event.status === 'terjadwal' ? (
                      <>
                        <button
                          onClick={() => onQuickRsvp(event.id, 'hadir')}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            userAttendance?.status === 'hadir'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Hadir</span>
                        </button>

                        <button
                          onClick={() => onQuickRsvp(event.id, 'belum_pasti')}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            userAttendance?.status === 'belum_pasti'
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Ragu</span>
                        </button>

                        <button
                          onClick={() => onQuickRsvp(event.id, 'tidak_hadir')}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            userAttendance?.status === 'tidak_hadir'
                              ? 'bg-rose-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absen</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 italic">
                        {event.status === 'selesai' ? 'Pertandingan selesai' : 'Jadwal dibatalkan'}
                      </span>
                    )}
                  </div>

                  {/* Action Shortcuts */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => onOpenWhatsappModal(event)}
                      title="Salin rekap untuk WhatsApp"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 border border-slate-700 transition"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <a
                      href={`/api/events/${event.id}/ical`}
                      download
                      title="Simpan ke Kalender (.ics)"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 text-slate-300 border border-slate-700 transition"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => onSelectEvent(event)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
                    >
                      <span>Detail & Rekap</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
