import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  UserProfile,
  Team,
  TeamMember,
  VolleyballEvent,
  EventAttendance,
  NotificationJob,
  NotificationFeedItem,
  NotificationPreferences,
  UserRole,
  AttendanceStatus,
  CashflowTransaction,
  CashflowType,
  CashflowCategory,
  MemberDue,
  CashflowSummary
} from '../types';
import {
  initPostgresDatabase,
  loadAllDataFromNeon,
  syncToPostgres
} from './postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'volibareng_db.json');

interface UserAccount extends UserProfile {
  passwordHash: string;
}

interface DatabaseSchema {
  users: UserAccount[];
  teams: Team[];
  teamMembers: TeamMember[];
  events: VolleyballEvent[];
  attendance: EventAttendance[];
  notificationPreferences: NotificationPreferences[];
  notificationJobs: NotificationJob[];
  notificationsFeed: NotificationFeedItem[];
  cashflowTransactions: CashflowTransaction[];
  memberDues: MemberDue[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getEmptySchema(): DatabaseSchema {
  return {
    users: [],
    teams: [],
    teamMembers: [],
    events: [],
    attendance: [],
    notificationPreferences: [],
    notificationJobs: [],
    notificationsFeed: [],
    cashflowTransactions: [],
    memberDues: []
  };
}

class JsonDatabase {
  private db: DatabaseSchema;

  constructor() {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        // Ensure all collections exist when loaded from older db version
        const empty = getEmptySchema();
        let changed = false;
        for (const key of Object.keys(empty) as (keyof DatabaseSchema)[]) {
          if (!this.db[key]) {
            (this.db as any)[key] = empty[key];
            changed = true;
          }
        }
        if (changed) this.save();
      } catch (err) {
        console.error('Error reading DB file, starting empty:', err);
        this.db = getEmptySchema();
        this.save();
      }
    } else {
      this.db = getEmptySchema();
      this.save();
    }
  }

  private save() {
    try {
      ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  async initPostgres() {
    try {
      await initPostgresDatabase();
      const loaded = await loadAllDataFromNeon();
      if (loaded && loaded.users.length > 0) {
        this.db = loaded;
        this.save();
        console.log(`[PostgreSQL Neon] Sukses memuat ${loaded.users.length} pengguna dan seluruh tabel relasional dari database Neon.`);
      }
    } catch (err) {
      console.error('[PostgreSQL Neon] Catatan koneksi Neon:', err);
    }
  }

  // --- USERS & AUTH ---
  findUserByEmail(email: string): UserAccount | undefined {
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): UserAccount | undefined {
    return this.db.users.find(u => u.id === id);
  }

  getAllUsers(): UserProfile[] {
    return this.db.users.map(({ passwordHash, ...rest }) => rest);
  }

  createUser(data: {
    displayName: string;
    email: string;
    phone: string;
    password: string;
    position?: string;
    avatar?: string;
  }): UserProfile {
    const newUser: UserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      displayName: data.displayName,
      email: data.email,
      phone: data.phone || '',
      passwordHash: data.password,
      avatar: data.avatar || '🏐',
      position: (data.position as any) || 'All-Round',
      createdAt: new Date().toISOString()
    };
    this.db.users.push(newUser);

    // default preferences
    this.db.notificationPreferences.push({
      userId: newUser.id,
      reminder1Day: true,
      reminder2Hours: true,
      onScheduleChange: true,
      soundEnabled: true
    });

    this.save();
    syncToPostgres('INSERT_USER', newUser);
    const { passwordHash, ...profile } = newUser;
    return profile;
  }

  updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile | null {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) return null;
    if (updates.displayName) user.displayName = updates.displayName;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.position) user.position = updates.position;
    if (updates.avatar) user.avatar = updates.avatar;
    this.save();
    syncToPostgres('UPDATE_USER', user);
    const { passwordHash, ...profile } = user;
    return profile;
  }

  // --- TEAMS ---
  getTeamsForUser(userId: string): Team[] {
    const memberships = this.db.teamMembers.filter(m => m.userId === userId && m.status === 'aktif');
    const teamIds = new Set(memberships.map(m => m.teamId));
    return this.db.teams
      .filter(t => teamIds.has(t.id))
      .map(t => ({
        ...t,
        memberCount: this.db.teamMembers.filter(m => m.teamId === t.id && m.status === 'aktif').length
      }));
  }

  getTeamById(teamId: string): Team | undefined {
    const t = this.db.teams.find(t => t.id === teamId);
    if (!t) return undefined;
    return {
      ...t,
      memberCount: this.db.teamMembers.filter(m => m.teamId === t.id && m.status === 'aktif').length
    };
  }

  createTeam(data: { name: string; description: string; timezone?: string; createdBy: string }): Team {
    const cleanCode = data.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6) + '-' + Math.floor(100 + Math.random() * 900);

    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: data.name,
      description: data.description || '',
      code: cleanCode,
      timezone: data.timezone || 'Asia/Jakarta (WIB)',
      createdBy: data.createdBy,
      createdAt: new Date().toISOString()
    };
    this.db.teams.push(newTeam);

    const creatorMember: TeamMember = {
      id: `tm-${Date.now()}`,
      teamId: newTeam.id,
      userId: data.createdBy,
      role: 'admin',
      status: 'aktif',
      joinedAt: new Date().toISOString()
    };
    this.db.teamMembers.push(creatorMember);

    this.save();
    syncToPostgres('INSERT_TEAM', newTeam);
    syncToPostgres('INSERT_MEMBER', creatorMember);
    return {
      ...newTeam,
      memberCount: 1
    };
  }

  joinTeamByCode(userId: string, code: string): { success: boolean; message: string; team?: Team } {
    const team = this.db.teams.find(t => t.code.toUpperCase() === code.trim().toUpperCase());
    if (!team) {
      return { success: false, message: 'Kode tim tidak ditemukan. Periksa kembali kode dari pengurus tim.' };
    }
    const existing = this.db.teamMembers.find(m => m.teamId === team.id && m.userId === userId);
    if (existing) {
      if (existing.status === 'aktif') {
        return { success: false, message: 'Kamu sudah menjadi anggota aktif di tim ini.', team };
      }
      existing.status = 'aktif';
      this.save();
      return { success: true, message: `Berhasil bergabung kembali dengan tim ${team.name}!`, team };
    }

    const newMember: TeamMember = {
      id: `tm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      teamId: team.id,
      userId,
      role: 'pemain',
      status: 'aktif',
      joinedAt: new Date().toISOString()
    };
    this.db.teamMembers.push(newMember);
    this.save();
    syncToPostgres('INSERT_MEMBER', newMember);
    return { success: true, message: `Selamat datang di tim ${team.name}!`, team };
  }

  getTeamMembers(teamId: string): TeamMember[] {
    const members = this.db.teamMembers.filter(m => m.teamId === teamId);
    return members.map(m => {
      const user = this.findUserById(m.userId);
      return {
        ...m,
        user: user ? {
          id: user.id,
          displayName: user.displayName,
          phone: user.phone,
          email: user.email,
          avatar: user.avatar,
          position: user.position,
          createdAt: user.createdAt
        } : undefined
      };
    });
  }

  getUserRoleInTeam(teamId: string, userId: string): UserRole | null {
    const member = this.db.teamMembers.find(m => m.teamId === teamId && m.userId === userId && m.status === 'aktif');
    return member ? member.role : null;
  }

  updateMemberRole(teamId: string, userId: string, newRole: UserRole): boolean {
    const member = this.db.teamMembers.find(m => m.teamId === teamId && m.userId === userId);
    if (!member) return false;
    member.role = newRole;
    this.save();
    syncToPostgres('INSERT_MEMBER', member);
    return true;
  }

  removeMember(teamId: string, userId: string): boolean {
    const idx = this.db.teamMembers.findIndex(m => m.teamId === teamId && m.userId === userId);
    if (idx === -1) return false;
    this.db.teamMembers.splice(idx, 1);
    this.save();
    syncToPostgres('DELETE_MEMBER', { teamId, userId });
    return true;
  }

  // --- EVENTS (JADWAL) ---
  getEvents(teamId: string, filter: 'all' | 'upcoming' | 'past' = 'upcoming'): VolleyballEvent[] {
    const now = new Date();
    let events = this.db.events.filter(e => e.teamId === teamId);

    if (filter === 'upcoming') {
      events = events.filter(e => new Date(e.startsAt) >= now && e.status !== 'dibatalkan');
      events.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    } else if (filter === 'past') {
      events = events.filter(e => new Date(e.startsAt) < now || e.status === 'selesai' || e.status === 'dibatalkan');
      events.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
    } else {
      events.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
    }

    const team = this.getTeamById(teamId);
    return events.map(e => this.enrichEvent(e, team?.name));
  }

  getEventById(eventId: string): VolleyballEvent | null {
    const ev = this.db.events.find(e => e.id === eventId);
    if (!ev) return null;
    const team = this.getTeamById(ev.teamId);
    return this.enrichEvent(ev, team?.name);
  }

  private enrichEvent(event: VolleyballEvent, teamName?: string): VolleyballEvent {
    const attendances = this.db.attendance
      .filter(a => a.eventId === event.id)
      .map(a => {
        const user = this.findUserById(a.userId);
        return {
          ...a,
          user: user ? {
            id: user.id,
            displayName: user.displayName,
            phone: user.phone,
            email: user.email,
            avatar: user.avatar,
            position: user.position,
            createdAt: user.createdAt
          } : undefined
        };
      });

    const hadirCount = attendances.filter(a => a.status === 'hadir').length;
    const belumPastiCount = attendances.filter(a => a.status === 'belum_pasti').length;
    const tidakHadirCount = attendances.filter(a => a.status === 'tidak_hadir').length;
    const totalMembers = this.db.teamMembers.filter(m => m.teamId === event.teamId && m.status === 'aktif').length;

    const summary = {
      hadir: hadirCount,
      belumPasti: belumPastiCount,
      tidakHadir: tidakHadirCount,
      totalMembers,
      maxPlayers: event.maxPlayers,
      isReadyForGame: hadirCount >= 12,
      slotsRemaining: Math.max(0, event.maxPlayers - hadirCount)
    };

    return {
      ...event,
      teamName: teamName || 'Tim Voli',
      attendances,
      summary
    };
  }

  createEvent(data: {
    teamId: string;
    title: string;
    startsAt: string;
    durationMinutes: number;
    location: string;
    locationMapUrl?: string;
    notes?: string;
    maxPlayers?: number;
    createdBy: string;
  }): VolleyballEvent {
    const newEvent: VolleyballEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      teamId: data.teamId,
      title: data.title,
      startsAt: data.startsAt,
      durationMinutes: data.durationMinutes || 120,
      location: data.location,
      locationMapUrl: data.locationMapUrl,
      notes: data.notes,
      maxPlayers: data.maxPlayers || 14,
      status: 'terjadwal',
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.db.events.push(newEvent);

    // Schedule automated notification jobs: H-1 day and H-2 hours for all active team members
    this.scheduleJobsForEvent(newEvent);

    // Add feed item
    const team = this.getTeamById(data.teamId);
    const members = this.db.teamMembers.filter(m => m.teamId === data.teamId && m.status === 'aktif');
    members.forEach(m => {
      this.db.notificationsFeed.unshift({
        id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: m.userId,
        teamId: data.teamId,
        eventId: newEvent.id,
        title: 'Jadwal Baru Main Voli!',
        body: `${newEvent.title} pada ${new Date(newEvent.startsAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} di ${newEvent.location}. Segera konfirmasi kehadiran!`,
        type: 'update',
        read: false,
        createdAt: new Date().toISOString()
      });
    });

    this.save();
    syncToPostgres('INSERT_EVENT', newEvent);
    return this.enrichEvent(newEvent, team?.name);
  }

  updateEvent(eventId: string, updates: Partial<VolleyballEvent>): VolleyballEvent | null {
    const event = this.db.events.find(e => e.id === eventId);
    if (!event) return null;

    const timeChanged = updates.startsAt && updates.startsAt !== event.startsAt;
    const locationChanged = updates.location && updates.location !== event.location;

    Object.assign(event, updates);
    event.updatedAt = new Date().toISOString();

    // If time changed, adjust existing pending jobs
    if (timeChanged) {
      this.cancelPendingJobsForEvent(eventId);
      this.scheduleJobsForEvent(event);
    }

    if (timeChanged || locationChanged) {
      // broadcast change to members
      const members = this.db.teamMembers.filter(m => m.teamId === event.teamId && m.status === 'aktif');
      members.forEach(m => {
        this.db.notificationsFeed.unshift({
          id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: m.userId,
          teamId: event.teamId,
          eventId: event.id,
          title: 'Perubahan Jadwal Main Voli',
          body: `Perubahan pada jadwal "${event.title}": Waktu atau lokasi telah diperbarui oleh pengurus.`,
          type: 'update',
          read: false,
          createdAt: new Date().toISOString()
        });
      });
    }

    this.save();
    syncToPostgres('INSERT_EVENT', event);
    const team = this.getTeamById(event.teamId);
    return this.enrichEvent(event, team?.name);
  }

  cancelEvent(eventId: string, reason: string): VolleyballEvent | null {
    const event = this.db.events.find(e => e.id === eventId);
    if (!event) return null;

    event.status = 'dibatalkan';
    event.cancellationReason = reason;
    event.updatedAt = new Date().toISOString();

    // Cancel all pending notification jobs for this event
    this.cancelPendingJobsForEvent(eventId);

    // Notify all members
    const members = this.db.teamMembers.filter(m => m.teamId === event.teamId && m.status === 'aktif');
    members.forEach(m => {
      this.db.notificationsFeed.unshift({
        id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: m.userId,
        teamId: event.teamId,
        eventId: event.id,
        title: 'Jadwal Voli Dibatalkan',
        body: `Jadwal "${event.title}" dibatalkan. Alasan: ${reason}`,
        type: 'update',
        read: false,
        createdAt: new Date().toISOString()
      });
    });

    this.save();
    syncToPostgres('INSERT_EVENT', event);
    const team = this.getTeamById(event.teamId);
    return this.enrichEvent(event, team?.name);
  }

  deleteEvent(eventId: string): boolean {
    const idx = this.db.events.findIndex(e => e.id === eventId);
    if (idx === -1) return false;
    this.db.events.splice(idx, 1);
    this.cancelPendingJobsForEvent(eventId);
    this.db.attendance = this.db.attendance.filter(a => a.eventId !== eventId);
    this.save();
    syncToPostgres('DELETE_EVENT', { id: eventId });
    return true;
  }

  // --- ATTENDANCE (KONFIRMASI KEHADIRAN) ---
  setAttendance(eventId: string, userId: string, status: AttendanceStatus, note: string = ''): EventAttendance {
    let att = this.db.attendance.find(a => a.eventId === eventId && a.userId === userId);
    if (att) {
      att.status = status;
      att.note = note;
      att.updatedAt = new Date().toISOString();
    } else {
      att = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        eventId,
        userId,
        status,
        note,
        updatedAt: new Date().toISOString()
      };
      this.db.attendance.push(att);
    }
    this.save();
    syncToPostgres('UPSERT_ATTENDANCE', att);
    const user = this.findUserById(userId);
    return {
      ...att,
      user: user ? {
        id: user.id,
        displayName: user.displayName,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        position: user.position,
        createdAt: user.createdAt
      } : undefined
    };
  }

  // --- SCHEDULER & NOTIFICATION JOBS ---
  private scheduleJobsForEvent(event: VolleyballEvent) {
    const eventTime = new Date(event.startsAt).getTime();
    const h1Time = new Date(eventTime - 24 * 60 * 60 * 1000).toISOString();
    const h2Time = new Date(eventTime - 2 * 60 * 60 * 1000).toISOString();

    const members = this.db.teamMembers.filter(m => m.teamId === event.teamId && m.status === 'aktif');
    
    // We create jobs for the members
    for (const member of members) {
      // H-1 job
      this.db.notificationJobs.push({
        id: `job-h1-${event.id}-${member.userId}`,
        eventId: event.id,
        teamId: event.teamId,
        userId: member.userId,
        type: '1_day_before',
        targetTime: h1Time,
        status: 'pending',
        messageTitle: `⏰ Pengingat H-1: ${event.title}`,
        messageBody: `Main voli besok di ${event.location}. Buka VoliBareng untuk cek rekap teman yang hadir!`,
        createdAt: new Date().toISOString()
      });

      // H-2 hours job
      this.db.notificationJobs.push({
        id: `job-h2-${event.id}-${member.userId}`,
        eventId: event.id,
        teamId: event.teamId,
        userId: member.userId,
        type: '2_hours_before',
        targetTime: h2Time,
        status: 'pending',
        messageTitle: `⚡ Pengingat 2 Jam Lagi: ${event.title}`,
        messageBody: `Main voli 2 jam lagi di ${event.location}. Siapkan sepatu dan perlengkapan!`,
        createdAt: new Date().toISOString()
      });
    }
  }

  private cancelPendingJobsForEvent(eventId: string) {
    for (const job of this.db.notificationJobs) {
      if (job.eventId === eventId && job.status === 'pending') {
        job.status = 'cancelled';
      }
    }
  }

  getAllNotificationJobs(teamId?: string): NotificationJob[] {
    let jobs = this.db.notificationJobs;
    if (teamId) {
      jobs = jobs.filter(j => j.teamId === teamId);
    }
    // enrich with event and user title
    return jobs.map(j => {
      const event = j.eventId ? this.db.events.find(e => e.id === j.eventId) : undefined;
      const user = this.findUserById(j.userId);
      return {
        ...j,
        eventTitle: event?.title || 'Kegiatan Umum',
        userName: user?.displayName || 'Pemain'
      };
    }).sort((a, b) => new Date(b.targetTime).getTime() - new Date(a.targetTime).getTime());
  }

  runSchedulerNow(forceImmediate: boolean = false): { processedCount: number; jobs: NotificationJob[] } {
    const now = new Date();
    const processed: NotificationJob[] = [];

    for (const job of this.db.notificationJobs) {
      if (job.status === 'pending') {
        const isDue = new Date(job.targetTime) <= now;
        if (isDue || forceImmediate) {
          job.status = 'sent';
          job.sentAt = new Date().toISOString();
          processed.push(job);

          // Add to feed item for target user
          this.db.notificationsFeed.unshift({
            id: `feed-auto-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            userId: job.userId,
            teamId: job.teamId,
            eventId: job.eventId,
            title: job.messageTitle,
            body: job.messageBody,
            type: 'reminder',
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    if (processed.length > 0) {
      this.save();
    }

    return { processedCount: processed.length, jobs: processed };
  }

  sendBroadcast(teamId: string, title: string, message: string, adminUserId: string): NotificationJob[] {
    const members = this.db.teamMembers.filter(m => m.teamId === teamId && m.status === 'aktif');
    const createdJobs: NotificationJob[] = [];
    const now = new Date().toISOString();

    for (const member of members) {
      const job: NotificationJob = {
        id: `job-bc-${Date.now()}-${member.userId}`,
        teamId,
        userId: member.userId,
        type: 'broadcast',
        targetTime: now,
        status: 'sent',
        sentAt: now,
        messageTitle: title,
        messageBody: message,
        createdAt: now
      };
      this.db.notificationJobs.push(job);
      createdJobs.push(job);

      this.db.notificationsFeed.unshift({
        id: `feed-bc-${Date.now()}-${member.userId}`,
        userId: member.userId,
        teamId,
        title,
        body: message,
        type: 'broadcast',
        read: false,
        createdAt: now
      });
    }

    this.save();
    return createdJobs;
  }

  // --- NOTIFICATION FEED & PREFERENCES ---
  getUserNotifications(userId: string): NotificationFeedItem[] {
    return this.db.notificationsFeed.filter(f => f.userId === userId).slice(0, 50);
  }

  markNotificationRead(notificationId: string): boolean {
    const item = this.db.notificationsFeed.find(f => f.id === notificationId);
    if (!item) return false;
    item.read = true;
    this.save();
    return true;
  }

  markAllNotificationsRead(userId: string): void {
    this.db.notificationsFeed.forEach(f => {
      if (f.userId === userId) f.read = true;
    });
    this.save();
  }

  getUserPreferences(userId: string): NotificationPreferences {
    let pref = this.db.notificationPreferences.find(p => p.userId === userId);
    if (!pref) {
      pref = {
        userId,
        reminder1Day: true,
        reminder2Hours: true,
        onScheduleChange: true,
        soundEnabled: true
      };
      this.db.notificationPreferences.push(pref);
      this.save();
    }
    return pref;
  }

  updateUserPreferences(userId: string, updates: Partial<NotificationPreferences>): NotificationPreferences {
    let pref = this.getUserPreferences(userId);
    Object.assign(pref, updates);
    this.save();
    return pref;
  }

  // --- CASHFLOW & FINANCIAL RECORDS ---
  getCashflow(teamId: string, filter: 'all' | 'masuk' | 'keluar' = 'all'): CashflowTransaction[] {
    let txs = (this.db.cashflowTransactions || []).filter(t => t.teamId === teamId);
    if (filter !== 'all') {
      txs = txs.filter(t => t.type === filter);
    }
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return txs.map(t => {
      const user = this.findUserById(t.recordedBy);
      const event = t.eventId ? this.db.events.find(e => e.id === t.eventId) : undefined;
      return {
        ...t,
        recordedByName: user?.displayName || 'Pengurus',
        eventTitle: event?.title
      };
    });
  }

  getCashflowSummary(teamId: string): CashflowSummary {
    const txs = (this.db.cashflowTransactions || []).filter(t => t.teamId === teamId);
    let totalIncome = 0;
    let totalExpense = 0;
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (const t of txs) {
      const txDate = new Date(t.date);
      const isThisMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;

      if (t.type === 'masuk') {
        totalIncome += t.amount;
        if (isThisMonth) thisMonthIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (isThisMonth) thisMonthExpense += t.amount;
      }
    }

    const currentBalance = totalIncome - totalExpense;

    const dues = (this.db.memberDues || []).filter(d => d.teamId === teamId && d.status === 'belum_lunas');
    const unpaidDuesCount = dues.length;
    const unpaidDuesAmount = dues.reduce((sum, d) => sum + d.amount, 0);

    return {
      currentBalance,
      totalIncome,
      totalExpense,
      thisMonthIncome,
      thisMonthExpense,
      unpaidDuesCount,
      unpaidDuesAmount
    };
  }

  addCashflowTransaction(data: {
    teamId: string;
    eventId?: string;
    type: CashflowType;
    category: CashflowCategory;
    amount: number;
    description: string;
    date: string;
    recordedBy: string;
  }): CashflowTransaction {
    if (!this.db.cashflowTransactions) {
      this.db.cashflowTransactions = [];
    }

    const newTx: CashflowTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      teamId: data.teamId,
      eventId: data.eventId,
      type: data.type,
      category: data.category,
      amount: Math.abs(Number(data.amount)),
      description: data.description,
      date: data.date || new Date().toISOString(),
      recordedBy: data.recordedBy,
      createdAt: new Date().toISOString()
    };

    this.db.cashflowTransactions.push(newTx);
    this.save();
    syncToPostgres('INSERT_TX', newTx);

    const user = this.findUserById(newTx.recordedBy);
    const event = newTx.eventId ? this.db.events.find(e => e.id === newTx.eventId) : undefined;
    return {
      ...newTx,
      recordedByName: user?.displayName || 'Pengurus',
      eventTitle: event?.title
    };
  }

  updateCashflowTransaction(id: string, updates: Partial<CashflowTransaction>): CashflowTransaction | null {
    const tx = (this.db.cashflowTransactions || []).find(t => t.id === id);
    if (!tx) return null;

    if (updates.type) tx.type = updates.type;
    if (updates.category) tx.category = updates.category;
    if (updates.amount !== undefined) tx.amount = Math.abs(Number(updates.amount));
    if (updates.description !== undefined) tx.description = updates.description;
    if (updates.date) tx.date = updates.date;
    if (updates.eventId !== undefined) tx.eventId = updates.eventId;

    this.save();
    syncToPostgres('INSERT_TX', tx);
    const user = this.findUserById(tx.recordedBy);
    const event = tx.eventId ? this.db.events.find(e => e.id === tx.eventId) : undefined;
    return {
      ...tx,
      recordedByName: user?.displayName || 'Pengurus',
      eventTitle: event?.title
    };
  }

  deleteCashflowTransaction(id: string): boolean {
    const idx = (this.db.cashflowTransactions || []).findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.db.cashflowTransactions.splice(idx, 1);
    this.save();
    syncToPostgres('DELETE_TX', { id });
    return true;
  }

  // --- MEMBER DUES (IURAN ANGGOTA) ---
  getMemberDues(teamId: string, period?: string): MemberDue[] {
    let dues = (this.db.memberDues || []).filter(d => d.teamId === teamId);
    if (period) {
      dues = dues.filter(d => d.period === period);
    }

    return dues.map(d => {
      const user = this.findUserById(d.userId);
      return {
        ...d,
        user: user ? {
          id: user.id,
          displayName: user.displayName,
          phone: user.phone,
          email: user.email,
          avatar: user.avatar,
          position: user.position,
          createdAt: user.createdAt
        } : undefined
      };
    });
  }

  toggleMemberDue(dueId: string, status: 'lunas' | 'belum_lunas', notes?: string): MemberDue | null {
    const due = (this.db.memberDues || []).find(d => d.id === dueId);
    if (!due) return null;

    due.status = status;
    if (status === 'lunas') {
      due.paidAt = new Date().toISOString();
    } else {
      due.paidAt = undefined;
    }
    if (notes !== undefined) {
      due.notes = notes;
    }

    this.save();
    syncToPostgres('UPSERT_DUE', due);
    const user = this.findUserById(due.userId);
    return {
      ...due,
      user: user ? {
        id: user.id,
        displayName: user.displayName,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        position: user.position,
        createdAt: user.createdAt
      } : undefined
    };
  }

  addMemberDue(data: {
    teamId: string;
    userId: string;
    period: string;
    amount: number;
    notes?: string;
  }): MemberDue {
    if (!this.db.memberDues) {
      this.db.memberDues = [];
    }

    const newDue: MemberDue = {
      id: `due-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      teamId: data.teamId,
      userId: data.userId,
      period: data.period,
      amount: Math.abs(Number(data.amount)),
      status: 'belum_lunas',
      notes: data.notes
    };

    this.db.memberDues.push(newDue);
    this.save();
    syncToPostgres('UPSERT_DUE', newDue);

    const user = this.findUserById(newDue.userId);
    return {
      ...newDue,
      user: user ? {
        id: user.id,
        displayName: user.displayName,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        position: user.position,
        createdAt: user.createdAt
      } : undefined
    };
  }
}

export const db = new JsonDatabase();
