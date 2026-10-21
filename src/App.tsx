import React, { useState, useEffect, useCallback } from 'react';
import { api, setAuthToken } from './api/client';
import {
  UserProfile,
  Team,
  TeamMember,
  VolleyballEvent,
  UserRole,
  AttendanceStatus,
  NotificationFeedItem,
  NotificationJob,
  NotificationPreferences,
  CashflowTransaction,
  CashflowSummary,
  MemberDue
} from './types';
import { Navbar } from './components/Navbar';
import { InstallPwaBanner } from './components/InstallPwaBanner';
import { ScheduleList } from './components/ScheduleList';
import { CashflowView } from './components/CashflowView';
import { EventDetailModal } from './components/EventDetailModal';
import { CreateEventModal } from './components/CreateEventModal';
import { TeamMembersView } from './components/TeamMembersView';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { AuthModal } from './components/AuthModal';
import { CreateTeamModal } from './components/CreateTeamModal';
import { JoinTeamModal } from './components/JoinTeamModal';
import { CheckCircle2, AlertCircle, X, MessageCircle, Copy, ExternalLink, Check } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [events, setEvents] = useState<VolleyballEvent[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [notifications, setNotifications] = useState<NotificationFeedItem[]>([]);
  const [jobs, setJobs] = useState<NotificationJob[]>([]);
  const [cashflowSummary, setCashflowSummary] = useState<CashflowSummary | null>(null);
  const [transactions, setTransactions] = useState<CashflowTransaction[]>([]);
  const [dues, setDues] = useState<MemberDue[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    userId: '',
    reminder1Day: true,
    reminder2Hours: true,
    onScheduleChange: true,
    soundEnabled: true,
  });

  const [currentTab, setCurrentTab] = useState<'jadwal' | 'kas' | 'anggota' | 'notifikasi' | 'profil'>('jadwal');
  const [selectedEvent, setSelectedEvent] = useState<VolleyballEvent | null>(null);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<VolleyballEvent | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isJoinTeamOpen, setIsJoinTeamOpen] = useState(false);
  
  // Standalone WhatsApp preview modal
  const [quickWaEvent, setQuickWaEvent] = useState<VolleyballEvent | null>(null);
  const [quickWaText, setQuickWaText] = useState('');
  const [waCopied, setWaCopied] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sound feedback synthesizer
  const playChime = useCallback(() => {
    if (!preferences.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // AudioContext may be restricted by autoplay policy
    }
  }, [preferences.soundEnabled]);

  // Load Initial User & Teams
  const loadInitialData = async () => {
    try {
      const meRes = await api.getCurrentUser();
      setCurrentUser(meRes.user);

      const teamRes = await api.getTeams();
      setTeams(teamRes.teams);
      if (teamRes.teams.length > 0) {
        const defaultTeam = teamRes.teams[0];
        setActiveTeam(defaultTeam);
      }

      const prefRes = await api.getPreferences();
      setPreferences(prefRes.preferences);

      const notifRes = await api.getNotifications();
      setNotifications(notifRes.notifications);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // When activeTeam or currentUser changes, load role, events, members, jobs
  const refreshTeamData = useCallback(async () => {
    if (!activeTeam || !currentUser) return;
    try {
      const teamDetail = await api.getTeamDetail(activeTeam.id);
      setCurrentRole(teamDetail.role);

      const eventsRes = await api.getEvents(activeTeam.id, filter);
      setEvents(eventsRes.events);

      const membersRes = await api.getTeamMembers(activeTeam.id);
      setMembers(membersRes.members);

      const jobsRes = await api.getNotificationJobs(activeTeam.id);
      setJobs(jobsRes.jobs);

      const notifRes = await api.getNotifications();
      setNotifications(notifRes.notifications);

      // Fetch Cashflow Data
      const cashflowSummaryRes = await api.getCashflowSummary(activeTeam.id);
      setCashflowSummary(cashflowSummaryRes.summary);

      const cashflowTxRes = await api.getCashflow(activeTeam.id);
      setTransactions(cashflowTxRes.transactions);

      const duesRes = await api.getMemberDues(activeTeam.id);
      setDues(duesRes.dues);
    } catch (err) {
      console.error('Error refreshing team data:', err);
    }
  }, [activeTeam, currentUser, filter]);

  useEffect(() => {
    refreshTeamData();
  }, [refreshTeamData]);

  // Periodic polling for notifications and sync every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      api.getNotifications()
        .then((res) => setNotifications(res.notifications))
        .catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleQuickRsvp = async (eventId: string, status: AttendanceStatus) => {
    try {
      const res = await api.submitAttendance(eventId, status);
      // Update local events list
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === eventId) {
            const attendances = (e.attendances || []).filter((a) => a.userId !== currentUser?.id);
            attendances.push(res.attendance);
            return {
              ...e,
              attendances,
              summary: res.summary,
            };
          }
          return e;
        })
      );
      if (selectedEvent?.id === eventId) {
        setSelectedEvent((prev) => {
          if (!prev) return null;
          const attendances = (prev.attendances || []).filter((a) => a.userId !== currentUser?.id);
          attendances.push(res.attendance);
          return {
            ...prev,
            attendances,
            summary: res.summary,
          };
        });
      }
      playChime();
      showToast(`Konfirmasi dicatat: ${status === 'hadir' ? 'Hadir' : status === 'belum_pasti' ? 'Belum Pasti' : 'Tidak Hadir'}`);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan kehadiran', 'error');
    }
  };

  const handleCreateOrUpdateEvent = async (data: any) => {
    if (!activeTeam) return;
    if (editingEvent) {
      const res = await api.updateEvent(editingEvent.id, data);
      showToast('Jadwal main berhasil diperbarui!', 'success');
      setEditingEvent(null);
      if (selectedEvent?.id === editingEvent.id) {
        setSelectedEvent(res.event);
      }
    } else {
      await api.createEvent({
        ...data,
        teamId: activeTeam.id,
      });
      showToast('Jadwal main baru berhasil diterbitkan & pengingat dijadwalkan!', 'success');
    }
    playChime();
    refreshTeamData();
  };

  const handleCancelEvent = async (eventId: string, reason: string) => {
    try {
      const res = await api.cancelEvent(eventId, reason);
      showToast('Jadwal telah dibatalkan & anggota diberi tahu.', 'success');
      setSelectedEvent(res.event);
      refreshTeamData();
    } catch {
      showToast('Gagal membatalkan jadwal', 'error');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await api.deleteEvent(eventId);
      showToast('Jadwal berhasil dihapus.', 'success');
      setSelectedEvent(null);
      refreshTeamData();
    } catch {
      showToast('Gagal menghapus jadwal', 'error');
    }
  };

  const handleOpenWhatsappModal = async (event: VolleyballEvent) => {
    try {
      const res = await api.getWhatsappText(event.id);
      setQuickWaText(res.text);
      setQuickWaEvent(event);
    } catch {
      showToast('Gagal menyiapkan format WhatsApp', 'error');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!activeTeam) return;
    try {
      await api.updateMemberRole(activeTeam.id, userId, newRole);
      showToast(`Peran anggota berhasil diubah menjadi ${newRole === 'admin' ? 'Admin' : 'Pemain'}.`);
      refreshTeamData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah peran', 'error');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeTeam) return;
    try {
      await api.removeMember(activeTeam.id, userId);
      showToast('Anggota dikeluarkan dari tim.');
      refreshTeamData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengeluarkan anggota', 'error');
    }
  };

  const handleCreateTeam = async (name: string, description: string, timezone: string) => {
    try {
      const res = await api.createTeam({ name, description, timezone });
      setTeams((prev) => [res.team, ...prev]);
      setActiveTeam(res.team);
      showToast(`Tim "${res.team.name}" berhasil dibuat! Kamu adalah Admin.`);
      playChime();
    } catch (err: any) {
      throw err;
    }
  };

  const handleJoinTeam = async (code: string) => {
    try {
      const res = await api.joinTeam(code);
      if (res.team) {
        const teamRes = await api.getTeams();
        setTeams(teamRes.teams);
        setActiveTeam(res.team);
      }
      showToast(res.message);
      playChime();
    } catch (err: any) {
      throw err;
    }
  };

  const handleRunScheduler = async (force: boolean) => {
    const res = await api.runScheduler(force);
    playChime();
    return res;
  };

  const handleSendBroadcast = async (title: string, message: string) => {
    if (!activeTeam) return;
    await api.sendBroadcast(activeTeam.id, title, message);
    playChime();
    showToast('Pengumuman kilat berhasil disebarkan!');
  };

  // Cashflow Handlers
  const handleAddTransaction = async (data: any) => {
    if (!activeTeam) return;
    const res = await api.addCashflowTransaction(activeTeam.id, data);
    setTransactions((prev) => [res.transaction, ...prev]);
    setCashflowSummary(res.summary);
    playChime();
    showToast('Transaksi kas berhasil dicatat!');
  };

  const handleUpdateTransaction = async (transId: string, data: any) => {
    if (!activeTeam) return;
    const res = await api.updateCashflowTransaction(activeTeam.id, transId, data);
    setTransactions((prev) => prev.map((t) => (t.id === transId ? res.transaction : t)));
    setCashflowSummary(res.summary);
    playChime();
    showToast('Transaksi kas berhasil diperbarui!');
  };

  const handleDeleteTransaction = async (transId: string) => {
    if (!activeTeam) return;
    const res = await api.deleteCashflowTransaction(activeTeam.id, transId);
    setTransactions((prev) => prev.filter((t) => t.id !== transId));
    setCashflowSummary(res.summary);
    playChime();
    showToast('Transaksi kas berhasil dihapus.');
  };

  const handleToggleDue = async (dueId: string, status: 'lunas' | 'belum_lunas', notes?: string) => {
    if (!activeTeam) return;
    const res = await api.toggleMemberDue(activeTeam.id, dueId, status, notes);
    setDues((prev) => prev.map((d) => (d.id === dueId ? res.due : d)));
    setCashflowSummary(res.summary);
    playChime();
    showToast(`Status iuran diubah menjadi ${status === 'lunas' ? 'Lunas' : 'Belum Lunas'}.`);
  };

  const handleAddDue = async (data: any) => {
    if (!activeTeam) return;
    const res = await api.addMemberDue(activeTeam.id, data);
    setDues((prev) => [...prev, res.due]);
    setCashflowSummary(res.summary);
    playChime();
    showToast('Tagihan iuran berhasil ditambahkan!');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 md:pb-8 selection:bg-amber-500 selection:text-slate-950">
      
      {/* PWA Install Notification Bar */}
      <InstallPwaBanner />

      {/* Main Top Header Navigation */}
      {currentUser && (
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          teams={teams}
          activeTeam={activeTeam}
          onSelectTeam={setActiveTeam}
          currentUser={currentUser}
          currentRole={currentRole}
          unreadCount={unreadCount}
          onOpenCreateTeam={() => setIsCreateTeamOpen(true)}
          onOpenJoinTeam={() => setIsJoinTeamOpen(true)}
        />
      )}

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 flex-1">
        {currentUser ? (
          <>
            {currentTab === 'jadwal' && (
              <ScheduleList
                events={events}
                currentUser={currentUser}
                currentRole={currentRole}
                filter={filter}
                setFilter={setFilter}
                onOpenCreateModal={() => {
                  setEditingEvent(null);
                  setIsCreateEventOpen(true);
                }}
                onSelectEvent={setSelectedEvent}
                onQuickRsvp={handleQuickRsvp}
                onOpenWhatsappModal={handleOpenWhatsappModal}
              />
            )}

            {currentTab === 'kas' && (
              <CashflowView
                team={activeTeam}
                currentUser={currentUser}
                currentRole={currentRole}
                summary={cashflowSummary}
                transactions={transactions}
                dues={dues}
                events={events}
                members={members}
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onToggleDue={handleToggleDue}
                onAddDue={handleAddDue}
              />
            )}

            {currentTab === 'anggota' && (
              <TeamMembersView
                team={activeTeam}
                members={members}
                currentUser={currentUser}
                currentRole={currentRole}
                onUpdateRole={handleUpdateRole}
                onRemoveMember={handleRemoveMember}
                onOpenCreateTeam={() => setIsCreateTeamOpen(true)}
                onOpenJoinTeam={() => setIsJoinTeamOpen(true)}
              />
            )}

            {currentTab === 'notifikasi' && (
              <NotificationsView
                notifications={notifications}
                jobs={jobs}
                preferences={preferences}
                currentRole={currentRole}
                activeTeamId={activeTeam?.id || ''}
                onMarkRead={async (id) => {
                  await api.markNotificationRead(id);
                  setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
                }}
                onMarkAllRead={async () => {
                  await api.markAllNotificationsRead();
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }}
                onUpdatePreferences={async (updates) => {
                  const res = await api.updatePreferences(updates);
                  setPreferences(res.preferences);
                  showToast('Preferensi notifikasi diperbarui.');
                }}
                onRunScheduler={handleRunScheduler}
                onSendBroadcast={handleSendBroadcast}
                onRefreshJobs={refreshTeamData}
              />
            )}

            {currentTab === 'profil' && (
              <ProfileView
                currentUser={currentUser}
                onUpdateProfile={async (updates) => {
                  const res = await api.updateProfile(updates);
                  setCurrentUser(res.user);
                  showToast('Profil berhasil disimpan!');
                }}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}
          </>
        ) : (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-4xl">
              🏐
            </div>
            <h2 className="text-2xl font-black text-white">Selamat Datang di VoliBareng</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Aplikasi pengelola jadwal main voli komunitas, rekap kehadiran otomatis, dan pengingat jadwal.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-400 transition"
            >
              Masuk / Mulai Sekarang
            </button>
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* Event Detail Modal */}
      {selectedEvent && currentUser && (
        <EventDetailModal
          event={selectedEvent}
          currentUser={currentUser}
          currentRole={currentRole}
          onClose={() => setSelectedEvent(null)}
          onSubmitRsvp={handleQuickRsvp}
          onEditEvent={(ev) => {
            setEditingEvent(ev);
            setSelectedEvent(null);
            setIsCreateEventOpen(true);
          }}
          onCancelEvent={handleCancelEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      )}

      {/* Create / Edit Event Modal */}
      {isCreateEventOpen && activeTeam && (
        <CreateEventModal
          isOpen={isCreateEventOpen}
          onClose={() => {
            setIsCreateEventOpen(false);
            setEditingEvent(null);
          }}
          teamId={activeTeam.id}
          teamName={activeTeam.name}
          editingEvent={editingEvent}
          onSubmit={handleCreateOrUpdateEvent}
        />
      )}

      {/* Create Team Modal */}
      {isCreateTeamOpen && (
        <CreateTeamModal
          isOpen={isCreateTeamOpen}
          onClose={() => setIsCreateTeamOpen(false)}
          onSubmit={handleCreateTeam}
        />
      )}

      {/* Join Team Modal */}
      {isJoinTeamOpen && (
        <JoinTeamModal
          isOpen={isJoinTeamOpen}
          onClose={() => setIsJoinTeamOpen(false)}
          onSubmit={handleJoinTeam}
        />
      )}

      {/* Standalone WhatsApp Share Modal */}
      {quickWaEvent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                Format WhatsApp Siap Kirim
              </h3>
              <button
                onClick={() => setQuickWaEvent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              readOnly
              value={quickWaText}
              rows={11}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(quickWaText);
                  setWaCopied(true);
                  setTimeout(() => setWaCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
              >
                {waCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{waCopied ? 'Tersalin ke Clipboard!' : 'Salin Teks WhatsApp'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(quickWaText)}`}
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

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLogin={async (email, pass) => {
            const res = await api.login(email, pass);
            setAuthToken(res.token);
            setCurrentUser(res.user);
            showToast(`Selamat datang kembali, ${res.user.displayName}!`);
            loadInitialData();
          }}
          onRegister={async (data) => {
            const res = await api.register(data);
            setAuthToken(res.token);
            setCurrentUser(res.user);
            showToast(`Pendaftaran berhasil! Selamat datang di VoliBareng.`);
            loadInitialData();
          }}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-16 md:bottom-6 right-4 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-slate-900 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-rose-500/50 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
