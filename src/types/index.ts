export type VolleyballPosition =
  | 'Setter'
  | 'Outside Hitter / Spiker'
  | 'Middle Blocker'
  | 'Opposite Hitter'
  | 'Libero'
  | 'All-Round';

export type UserRole = 'admin' | 'pemain';
export type MemberStatus = 'aktif' | 'undangan';
export type EventStatus = 'terjadwal' | 'selesai' | 'dibatalkan';
export type AttendanceStatus = 'hadir' | 'belum_pasti' | 'tidak_hadir';

export interface UserProfile {
  id: string;
  displayName: string;
  phone: string;
  email: string;
  avatar: string;
  position: VolleyballPosition;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  code: string;
  timezone: string;
  createdBy: string;
  createdAt: string;
  memberCount?: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: UserRole;
  status: MemberStatus;
  joinedAt: string;
  user?: UserProfile;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  userId: string;
  status: AttendanceStatus;
  note: string;
  updatedAt: string;
  user?: UserProfile;
}

export interface AttendanceSummary {
  hadir: number;
  belumPasti: number;
  tidakHadir: number;
  totalMembers: number;
  maxPlayers: number;
  isReadyForGame: boolean; // e.g. >= 12 players
  slotsRemaining: number;
}

export interface VolleyballEvent {
  id: string;
  teamId: string;
  title: string;
  startsAt: string; // ISO
  durationMinutes: number;
  location: string;
  locationMapUrl?: string;
  notes?: string;
  maxPlayers: number;
  status: EventStatus;
  cancellationReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attendances?: EventAttendance[];
  summary?: AttendanceSummary;
  teamName?: string;
}

export type NotificationJobType =
  | '1_day_before'
  | '2_hours_before'
  | 'schedule_changed'
  | 'schedule_cancelled'
  | 'broadcast';

export type NotificationJobStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface NotificationJob {
  id: string;
  eventId?: string;
  teamId: string;
  userId: string;
  type: NotificationJobType;
  targetTime: string;
  status: NotificationJobStatus;
  sentAt?: string | null;
  errorMessage?: string | null;
  messageTitle: string;
  messageBody: string;
  createdAt: string;
  // joined info for display
  eventTitle?: string;
  userName?: string;
}

export interface NotificationFeedItem {
  id: string;
  userId: string;
  teamId: string;
  eventId?: string;
  title: string;
  body: string;
  type: 'reminder' | 'update' | 'system' | 'broadcast';
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  reminder1Day: boolean;
  reminder2Hours: boolean;
  onScheduleChange: boolean;
  soundEnabled: boolean;
}

export type CashflowType = 'masuk' | 'keluar';

export type CashflowCategory =
  | 'Iuran Rutin Anggota'
  | 'Patungan Sewa Lapangan'
  | 'Sewa Lapangan / GOR'
  | 'Bola Voli & Net'
  | 'Air Minum & Konsumsi'
  | 'Medis & P3K'
  | 'Jersey Tim'
  | 'Turnamen & Sparing'
  | 'Donasi & Sponsor'
  | 'Lainnya';

export interface CashflowTransaction {
  id: string;
  teamId: string;
  eventId?: string;
  type: CashflowType;
  category: CashflowCategory;
  amount: number;
  description: string;
  date: string; // ISO
  recordedBy: string;
  recordedByName?: string;
  eventTitle?: string;
  createdAt: string;
}

export interface MemberDue {
  id: string;
  teamId: string;
  userId: string;
  eventId?: string;
  period: string; // e.g. "Oktober 2026" or "Patungan Latihan 14 Okt"
  amount: number;
  status: 'lunas' | 'belum_lunas';
  paidAt?: string;
  notes?: string;
  user?: UserProfile;
}

export interface CashflowSummary {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  unpaidDuesCount: number;
  unpaidDuesAmount: number;
}

