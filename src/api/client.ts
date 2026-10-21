import {
  UserProfile,
  Team,
  TeamMember,
  VolleyballEvent,
  EventAttendance,
  AttendanceSummary,
  NotificationJob,
  NotificationFeedItem,
  NotificationPreferences,
  UserRole,
  AttendanceStatus,
  CashflowTransaction,
  MemberDue,
  CashflowSummary,
  CashflowType,
  CashflowCategory
} from '../types';

let currentToken: string = localStorage.getItem('volibareng_token') || '';

export function setAuthToken(token: string) {
  currentToken = token;
  localStorage.setItem('volibareng_token', token);
}

export function getAuthToken(): string {
  return currentToken;
}

export function clearAuthToken() {
  currentToken = '';
  localStorage.removeItem('volibareng_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (currentToken) {
    headers['x-user-id'] = currentToken;
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Terjadi kesalahan jaringan.' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { displayName: string; email: string; phone: string; password: string; position: string }) =>
    request<{ token: string; user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () =>
    request<{ user: UserProfile }>('/auth/me'),

  updateProfile: (data: Partial<UserProfile>) =>
    request<{ user: UserProfile }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Teams
  getTeams: () =>
    request<{ teams: Team[] }>('/teams'),

  getTeamDetail: (teamId: string) =>
    request<{ team: Team; role: UserRole | null }>(`/teams/${teamId}`),

  createTeam: (data: { name: string; description: string; timezone?: string }) =>
    request<{ team: Team }>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  joinTeam: (code: string) =>
    request<{ success: boolean; message: string; team?: Team }>('/teams/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  getTeamMembers: (teamId: string) =>
    request<{ members: TeamMember[] }>(`/teams/${teamId}/members`),

  updateMemberRole: (teamId: string, userId: string, role: UserRole) =>
    request<{ success: boolean; role: UserRole }>(`/teams/${teamId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  removeMember: (teamId: string, userId: string) =>
    request<{ success: boolean }>(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    }),

  // Events
  getEvents: (teamId: string, filter: 'all' | 'upcoming' | 'past' = 'upcoming') =>
    request<{ events: VolleyballEvent[] }>(`/events?teamId=${teamId}&filter=${filter}`),

  getEventDetail: (eventId: string) =>
    request<{ event: VolleyballEvent }>(`/events/${eventId}`),

  createEvent: (data: {
    teamId: string;
    title: string;
    startsAt: string;
    durationMinutes: number;
    location: string;
    locationMapUrl?: string;
    notes?: string;
    maxPlayers?: number;
  }) =>
    request<{ event: VolleyballEvent }>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEvent: (eventId: string, data: Partial<VolleyballEvent>) =>
    request<{ event: VolleyballEvent }>(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancelEvent: (eventId: string, reason: string) =>
    request<{ event: VolleyballEvent }>(`/events/${eventId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  deleteEvent: (eventId: string) =>
    request<{ success: boolean }>(`/events/${eventId}`, {
      method: 'DELETE',
    }),

  // Attendance
  submitAttendance: (eventId: string, status: AttendanceStatus, note?: string) =>
    request<{ attendance: EventAttendance; summary: AttendanceSummary }>(`/events/${eventId}/attendance`, {
      method: 'POST',
      body: JSON.stringify({ status, note }),
    }),

  // Notifications
  getNotifications: () =>
    request<{ notifications: NotificationFeedItem[] }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    }),

  getNotificationJobs: (teamId?: string) =>
    request<{ jobs: NotificationJob[] }>(`/notifications/jobs${teamId ? `?teamId=${teamId}` : ''}`),

  runScheduler: (force: boolean = false) =>
    request<{ message: string; processedCount: number; jobs: NotificationJob[] }>('/notifications/run-scheduler', {
      method: 'POST',
      body: JSON.stringify({ force }),
    }),

  sendBroadcast: (teamId: string, title: string, message: string) =>
    request<{ success: boolean; count: number }>('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ teamId, title, message }),
    }),

  getPreferences: () =>
    request<{ preferences: NotificationPreferences }>('/notifications/preferences'),

  updatePreferences: (data: Partial<NotificationPreferences>) =>
    request<{ preferences: NotificationPreferences }>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Extras
  getWhatsappText: (eventId: string) =>
    request<{ text: string }>(`/events/${eventId}/whatsapp-text`),

  // Cashflow & Uang Kas
  getCashflow: (teamId: string, filter: 'all' | 'masuk' | 'keluar' = 'all') =>
    request<{ transactions: CashflowTransaction[] }>(`/teams/${teamId}/cashflow?filter=${filter}`),

  getCashflowSummary: (teamId: string) =>
    request<{ summary: CashflowSummary }>(`/teams/${teamId}/cashflow/summary`),

  addCashflowTransaction: (teamId: string, data: {
    type: CashflowType;
    category: CashflowCategory;
    amount: number;
    description: string;
    date: string;
    eventId?: string;
  }) =>
    request<{ transaction: CashflowTransaction; summary: CashflowSummary }>(`/teams/${teamId}/cashflow`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCashflowTransaction: (teamId: string, transId: string, data: Partial<CashflowTransaction>) =>
    request<{ transaction: CashflowTransaction; summary: CashflowSummary }>(`/teams/${teamId}/cashflow/${transId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCashflowTransaction: (teamId: string, transId: string) =>
    request<{ success: boolean; summary: CashflowSummary }>(`/teams/${teamId}/cashflow/${transId}`, {
      method: 'DELETE',
    }),

  getMemberDues: (teamId: string, period?: string) =>
    request<{ dues: MemberDue[] }>(`/teams/${teamId}/cashflow/dues${period ? `?period=${encodeURIComponent(period)}` : ''}`),

  toggleMemberDue: (teamId: string, dueId: string, status: 'lunas' | 'belum_lunas', notes?: string) =>
    request<{ due: MemberDue; summary: CashflowSummary }>(`/teams/${teamId}/cashflow/dues/${dueId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    }),

  addMemberDue: (teamId: string, data: { targetUserId: string; period: string; amount: number; notes?: string }) =>
    request<{ due: MemberDue; summary: CashflowSummary }>(`/teams/${teamId}/cashflow/dues`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCashflowWhatsappReport: (teamId: string) =>
    request<{ text: string }>(`/teams/${teamId}/cashflow/whatsapp-report`),
};
