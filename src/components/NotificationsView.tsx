import React, { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Send,
  Settings,
  ListFilter,
  Check,
  Volume2,
  Calendar,
  Sparkles,
  RefreshCw,
  Megaphone
} from 'lucide-react';
import {
  NotificationFeedItem,
  NotificationJob,
  NotificationPreferences,
  UserRole
} from '../types';

interface NotificationsViewProps {
  notifications: NotificationFeedItem[];
  jobs: NotificationJob[];
  preferences: NotificationPreferences;
  currentRole: UserRole | null;
  activeTeamId: string;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onUpdatePreferences: (updates: Partial<NotificationPreferences>) => void;
  onRunScheduler: (force: boolean) => Promise<{ processedCount: number; message: string }>;
  onSendBroadcast: (title: string, message: string) => Promise<void>;
  onRefreshJobs: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  jobs,
  preferences,
  currentRole,
  activeTeamId,
  onMarkRead,
  onMarkAllRead,
  onUpdatePreferences,
  onRunScheduler,
  onSendBroadcast,
  onRefreshJobs,
}) => {
  const [subTab, setSubTab] = useState<'feed' | 'jobs' | 'preferences'>('feed');
  const [isProcessing, setIsProcessing] = useState(false);
  const [schedulerMessage, setSchedulerMessage] = useState<string | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleTriggerScheduler = async (force: boolean) => {
    setIsProcessing(true);
    setSchedulerMessage(null);
    try {
      const res = await onRunScheduler(force);
      setSchedulerMessage(res.message);
      onRefreshJobs();
    } catch {
      setSchedulerMessage('Gagal menjalankan scheduler.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setIsProcessing(true);
    try {
      await onSendBroadcast(broadcastTitle, broadcastMessage);
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setSchedulerMessage('Siaran pengumuman kilat berhasil dikirim ke seluruh anggota!');
      onRefreshJobs();
    } catch {
      alert('Gagal mengirim siaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Pusat Pengingat & Notifikasi</span>
            {unreadCount > 0 && (
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-500 text-white">
                {unreadCount} Baru
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sistem pengingat otomatis H-1, H-2 jam, dan catatan pengiriman kegiatan.
          </p>
        </div>

        {/* Quick Scheduler Trigger for Testing & Admin */}
        <div className="flex items-center gap-2">
          {currentRole === 'admin' && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 transition"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Siaran Kilat</span>
            </button>
          )}

          <button
            disabled={isProcessing}
            onClick={() => handleTriggerScheduler(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Memproses...' : 'Uji Jalankan Scheduler'}</span>
          </button>
        </div>
      </div>

      {schedulerMessage && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between">
          <span>⚡ {schedulerMessage}</span>
          <button
            onClick={() => setSchedulerMessage(null)}
            className="text-amber-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
        <button
          onClick={() => setSubTab('feed')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
            subTab === 'feed'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifikasi Masuk ({notifications.length})</span>
        </button>

        <button
          onClick={() => setSubTab('jobs')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
            subTab === 'jobs'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Log Jadwal Pengingat (FR-08)</span>
        </button>

        <button
          onClick={() => setSubTab('preferences')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
            subTab === 'preferences'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Pengaturan Pengingat</span>
        </button>
      </div>

      {/* SUB-TAB 1: USER NOTIFICATION FEED */}
      {subTab === 'feed' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">
              Notifikasi personal untuk akun Anda.
            </span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-amber-400 hover:underline font-semibold"
              >
                Tandai Semua Sudah Dibaca
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
              <p className="text-slate-400 text-xs">Belum ada notifikasi masuk.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onMarkRead(item.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                    !item.read
                      ? 'bg-slate-900 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900/50 border-slate-800/80 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-base shrink-0 mt-0.5">
                      {item.type === 'reminder' ? '⏰' : item.type === 'broadcast' ? '📢' : '🏐'}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-white">{item.title}</h4>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">{item.body}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {!item.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(item.id);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 text-[11px]"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SCHEDULER JOBS & LOGS (FR-08) */}
      {subTab === 'jobs' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-black text-slate-200 text-sm">
                Tabel Antrean Pengingat Otomatis (Database Jobs)
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Pengingat terjadwal otomatis dibuat saat jadwal diterbitkan: H-1 hari & 2 jam sebelum main.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRefreshJobs}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                title="Segarkan Log"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={isProcessing}
                onClick={() => handleTriggerScheduler(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700"
              >
                Proses Job Jatuh Tempo
              </button>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
              <p className="text-slate-400 text-xs">Belum ada antrean pekerjaan pengingat.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => {
                const targetDate = new Date(job.targetTime);
                const isSent = job.status === 'sent';
                const isCancelled = job.status === 'cancelled';
                const isPending = job.status === 'pending';

                return (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-black text-[10px] uppercase px-2 py-0.5 rounded-md ${
                            isSent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isSent ? 'Terkirim (Sent)' : isPending ? 'Terjadwal (Pending)' : 'Dibatalkan'}
                        </span>

                        <span className="font-semibold text-slate-300">
                          {job.type === '1_day_before'
                            ? '⏰ Pengingat H-1 Hari'
                            : job.type === '2_hours_before'
                            ? '⚡ Pengingat 2 Jam Sebelum'
                            : job.type === 'broadcast'
                            ? '📢 Siaran Pengurus'
                            : 'Pembaruan Jadwal'}
                        </span>

                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">
                          Tujuan: <strong>{job.userName || 'Pemain'}</strong>
                        </span>
                      </div>

                      <p className="text-slate-200 font-bold">{job.messageTitle}</p>
                      <p className="text-slate-400 text-[11px]">{job.messageBody}</p>
                    </div>

                    <div className="text-right shrink-0 md:border-l md:border-slate-800 md:pl-4 text-[11px] space-y-0.5">
                      <p className="text-slate-400">
                        Target Kirim:{' '}
                        <strong className="text-slate-200">
                          {targetDate.toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                      </p>
                      {job.sentAt && (
                        <p className="text-emerald-400">
                          Terekam Kirim: {new Date(job.sentAt).toLocaleTimeString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PREFERENCES (FR-11) */}
      {subTab === 'preferences' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-xl text-xs">
          <h3 className="font-black text-sm text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            Preferensi Notifikasi Akun
          </h3>
          <p className="text-slate-400 text-[11px]">
            Atur kapan saja kamu ingin menerima pemberitahuan jadwal main voli.
          </p>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <p className="font-bold text-slate-200">Pengingat 1 Hari Sebelum (H-1)</p>
                <p className="text-[11px] text-slate-400">
                  Kirim pengingat agar bisa mempersiapkan jadwal dan konfirmasi kehadiran.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.reminder1Day}
                onChange={(e) => onUpdatePreferences({ reminder1Day: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <p className="font-bold text-slate-200">Pengingat 2 Jam Sebelum Main (H-2)</p>
                <p className="text-[11px] text-slate-400">
                  Kirim pengingat bersiap-siap menuju lapangan voli.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.reminder2Hours}
                onChange={(e) => onUpdatePreferences({ reminder2Hours: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <p className="font-bold text-slate-200">Pemberitahuan Perubahan Jadwal</p>
                <p className="text-[11px] text-slate-400">
                  Kirim notifikasi saat pengurus mengubah jam, lapangan, atau membatalkan sesi.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.onScheduleChange}
                onChange={(e) => onUpdatePreferences({ onScheduleChange: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <p className="font-bold text-slate-200">Suara / Audio Pengingat</p>
                <p className="text-[11px] text-slate-400">
                  Bunyikan sinyal audio saat notifikasi masuk di aplikasi.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => onUpdatePreferences({ soundEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0"
              />
            </label>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              Kirim Siaran Pengumuman Kilat ke Tim
            </h3>
            <p className="text-xs text-slate-400">
              Pesan ini akan langsung muncul di feed notifikasi seluruh anggota tim.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Info Lapangan Court 2 Siap"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Pesan Lengkap</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Teman-teman harap tiba jam 18:45 untuk pemanasan bersama."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Kirim Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
