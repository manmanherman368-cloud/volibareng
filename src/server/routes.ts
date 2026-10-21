import { Router, Request, Response } from 'express';
import { db } from './db';

export const apiRouter = Router();

// Middleware to extract user ID from header or query or token
function getUserId(req: Request): string {
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId) return headerUserId;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return '';
}

// --- AUTH & USER ---
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
  }

  const user = db.findUserByEmail(email);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Email atau kata sandi tidak valid.' });
  }

  const { passwordHash, ...profile } = user;
  res.json({ token: user.id, user: profile });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { displayName, email, phone, password, position } = req.body;
  if (!displayName || !email || !password) {
    return res.status(400).json({ error: 'Nama tampilan, email, dan kata sandi wajib diisi.' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
  }

  const profile = db.createUser({
    displayName,
    email,
    phone: phone || '',
    password,
    position
  });

  res.status(201).json({ token: profile.id, user: profile });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const user = db.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }
  const { passwordHash, ...profile } = user;
  res.json({ user: profile });
});

apiRouter.put('/auth/profile', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const updated = db.updateUserProfile(userId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }
  res.json({ user: updated });
});

// --- TEAMS ---
apiRouter.get('/teams', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const teams = db.getTeamsForUser(userId);
  res.json({ teams });
});

apiRouter.get('/teams/:id', (req: Request, res: Response) => {
  const team = db.getTeamById(req.params.id);
  if (!team) {
    return res.status(404).json({ error: 'Tim tidak ditemukan.' });
  }
  const userId = getUserId(req);
  const role = db.getUserRoleInTeam(team.id, userId);
  res.json({ team, role });
});

apiRouter.post('/teams', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { name, description, timezone } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nama tim wajib diisi.' });
  }
  const team = db.createTeam({
    name,
    description: description || '',
    timezone: timezone || 'Asia/Jakarta (WIB)',
    createdBy: userId
  });
  res.status(201).json({ team });
});

apiRouter.post('/teams/join', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Kode tim wajib diisi.' });
  }
  const result = db.joinTeamByCode(userId, code);
  if (!result.success) {
    return res.status(400).json({ error: result.message, team: result.team });
  }
  res.json(result);
});

apiRouter.get('/teams/:id/members', (req: Request, res: Response) => {
  const members = db.getTeamMembers(req.params.id);
  res.json({ members });
});

apiRouter.put('/teams/:id/members/:userId/role', (req: Request, res: Response) => {
  const currentUserId = getUserId(req);
  const currentRole = db.getUserRoleInTeam(req.params.id, currentUserId);
  if (currentRole !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin tim yang dapat mengubah peran anggota.' });
  }

  const { role } = req.body;
  if (!role || (role !== 'admin' && role !== 'pemain')) {
    return res.status(400).json({ error: 'Peran harus "admin" atau "pemain".' });
  }

  const ok = db.updateMemberRole(req.params.id, req.params.userId, role);
  if (!ok) return res.status(404).json({ error: 'Anggota tidak ditemukan.' });
  res.json({ success: true, role });
});

apiRouter.delete('/teams/:id/members/:userId', (req: Request, res: Response) => {
  const currentUserId = getUserId(req);
  const currentRole = db.getUserRoleInTeam(req.params.id, currentUserId);
  if (currentRole !== 'admin' && currentUserId !== req.params.userId) {
    return res.status(403).json({ error: 'Tidak memiliki izin untuk mengeluarkan anggota.' });
  }

  const ok = db.removeMember(req.params.id, req.params.userId);
  if (!ok) return res.status(404).json({ error: 'Anggota tidak ditemukan.' });
  res.json({ success: true });
});

// --- EVENTS (JADWAL) ---
apiRouter.get('/events', (req: Request, res: Response) => {
  const { teamId, filter } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Parameter teamId diperlukan.' });
  }
  const filterType = (filter === 'past' || filter === 'all' || filter === 'upcoming') ? filter : 'upcoming';
  const events = db.getEvents(teamId, filterType);
  res.json({ events });
});

apiRouter.get('/events/:id', (req: Request, res: Response) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
  res.json({ event });
});

apiRouter.post('/events', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { teamId, title, startsAt, durationMinutes, location, locationMapUrl, notes, maxPlayers } = req.body;

  if (!teamId || !title || !startsAt || !location) {
    return res.status(400).json({ error: 'Judul, waktu mulai, dan lokasi wajib diisi.' });
  }

  // Validate admin permission
  const role = db.getUserRoleInTeam(teamId, userId);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin tim yang dapat membuat jadwal.' });
  }

  // Validate startsAt is valid date
  const dateObj = new Date(startsAt);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({ error: 'Format tanggal atau waktu tidak valid.' });
  }

  const event = db.createEvent({
    teamId,
    title,
    startsAt: dateObj.toISOString(),
    durationMinutes: Number(durationMinutes) || 120,
    location,
    locationMapUrl,
    notes,
    maxPlayers: Number(maxPlayers) || 14,
    createdBy: userId
  });

  res.status(201).json({ event });
});

apiRouter.put('/events/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });

  const role = db.getUserRoleInTeam(event.teamId, userId);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin tim yang dapat mengubah jadwal.' });
  }

  const updated = db.updateEvent(req.params.id, req.body);
  res.json({ event: updated });
});

apiRouter.post('/events/:id/cancel', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });

  const role = db.getUserRoleInTeam(event.teamId, userId);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin tim yang dapat membatalkan jadwal.' });
  }

  const { reason } = req.body;
  const updated = db.cancelEvent(req.params.id, reason || 'Dibatalkan oleh pengurus tim.');
  res.json({ event: updated });
});

apiRouter.delete('/events/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });

  const role = db.getUserRoleInTeam(event.teamId, userId);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin tim yang dapat menghapus jadwal.' });
  }

  db.deleteEvent(req.params.id);
  res.json({ success: true });
});

// --- ATTENDANCE ---
apiRouter.post('/events/:id/attendance', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { status, note } = req.body;

  if (!status || !['hadir', 'belum_pasti', 'tidak_hadir'].includes(status)) {
    return res.status(400).json({ error: 'Status konfirmasi harus Hadir, Belum Pasti, atau Tidak Hadir.' });
  }

  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });

  if (event.status === 'dibatalkan') {
    return res.status(400).json({ error: 'Jadwal ini telah dibatalkan.' });
  }

  const att = db.setAttendance(req.params.id, userId, status, note || '');
  const updatedEvent = db.getEventById(req.params.id);

  res.json({ attendance: att, summary: updatedEvent?.summary });
});

// --- NOTIFICATIONS & SCHEDULER ---
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const notifications = db.getUserNotifications(userId);
  res.json({ notifications });
});

apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.markAllNotificationsRead(userId);
  res.json({ success: true });
});

apiRouter.get('/notifications/jobs', (req: Request, res: Response) => {
  const { teamId } = req.query;
  const jobs = db.getAllNotificationJobs(teamId ? String(teamId) : undefined);
  res.json({ jobs });
});

apiRouter.post('/notifications/run-scheduler', (req: Request, res: Response) => {
  const { force } = req.body;
  const result = db.runSchedulerNow(Boolean(force));
  res.json({
    message: `Scheduler selesai dijalankan. ${result.processedCount} pengingat diproses.`,
    ...result
  });
});

apiRouter.post('/notifications/broadcast', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { teamId, title, message } = req.body;
  if (!teamId || !title || !message) {
    return res.status(400).json({ error: 'Tim, judul, dan pesan pengumuman wajib diisi.' });
  }

  const role = db.getUserRoleInTeam(teamId, userId);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin yang dapat mengirim pesan siaran.' });
  }

  const jobs = db.sendBroadcast(teamId, title, message, userId);
  res.json({ success: true, count: jobs.length });
});

apiRouter.get('/notifications/preferences', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const preferences = db.getUserPreferences(userId);
  res.json({ preferences });
});

apiRouter.put('/notifications/preferences', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const preferences = db.updateUserPreferences(userId, req.body);
  res.json({ preferences });
});

// --- EXTRAS: WHATSAPP FORMATTER & ICAL EXPORT ---
apiRouter.get('/events/:id/whatsapp-text', (req: Request, res: Response) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });

  const dateStr = new Date(event.startsAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = new Date(event.startsAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const attendances = event.attendances || [];
  const hadir = attendances.filter(a => a.status === 'hadir');
  const belumPasti = attendances.filter(a => a.status === 'belum_pasti');
  const tidakHadir = attendances.filter(a => a.status === 'tidak_hadir');

  let hadirList = hadir.map((a, i) => `${i + 1}. ${a.user?.displayName || 'Pemain'}${a.note ? ` (${a.note})` : ''}`).join('\n');
  if (!hadirList) hadirList = '(Belum ada pemain konfirmasi)';

  let belumPastiList = belumPasti.map((a, i) => `${i + 1}. ${a.user?.displayName || 'Pemain'}${a.note ? ` (${a.note})` : ''}`).join('\n');
  if (!belumPastiList) belumPastiList = '-';

  let tidakHadirList = tidakHadir.map((a, i) => `${i + 1}. ${a.user?.displayName || 'Pemain'}${a.note ? ` (${a.note})` : ''}`).join('\n');
  if (!tidakHadirList) tidakHadirList = '-';

  const text = `🏐 *REKAP JADWAL MAIN VOLI* 🏐
*${event.teamName}*

📌 *Kegiatan:* ${event.title}
📅 *Hari/Tgl:* ${dateStr}
⏰ *Pukul:* ${timeStr} WIB (${event.durationMinutes} Menit)
📍 *Lokasi:* ${event.location}
${event.locationMapUrl ? `🗺️ Maps: ${event.locationMapUrl}\n` : ''}${event.notes ? `📝 *Catatan:* ${event.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━
✅ *LIST HADIR (${hadir.length}/${event.maxPlayers}):*
${hadirList}

⏳ *BELUM PASTI (${belumPasti.length}):*
${belumPastiList}

❌ *TIDAK BISA (${tidakHadir.length}):*
${tidakHadirList}
━━━━━━━━━━━━━━━━━━
${hadir.length >= 12 ? '🔥 Kuota sudah siap 2 tim lengkap (6v6)!' : `⚠️ Masih butuh ${Math.max(0, 12 - hadir.length)} pemain lagi untuk 2 tim lengkap.`}

_Konfirmasi online di VoliBareng agar tercatat otomatis!_`;

  res.json({ text });
});

apiRouter.get('/events/:id/ical', (req: Request, res: Response) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).send('Not found');

  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + event.durationMinutes * 60 * 1000);

  const formatIcalDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VoliBareng//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@volibareng.id`,
    `DTSTAMP:${formatIcalDate(new Date())}`,
    `DTSTART:${formatIcalDate(start)}`,
    `DTEND:${formatIcalDate(end)}`,
    `SUMMARY:Main Voli: ${event.title}`,
    `DESCRIPTION:${(event.notes || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `STATUS:${event.status === 'dibatalkan' ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="volibareng-${event.id}.ics"`);
  res.send(ics);
});

// --- CASHFLOW & UANG KAS ---
apiRouter.get('/teams/:id/cashflow', (req: Request, res: Response) => {
  const { filter } = req.query;
  const filterType = filter === 'masuk' || filter === 'keluar' ? filter : 'all';
  const transactions = db.getCashflow(req.params.id, filterType);
  res.json({ transactions });
});

apiRouter.get('/teams/:id/cashflow/summary', (req: Request, res: Response) => {
  const summary = db.getCashflowSummary(req.params.id);
  res.json({ summary });
});

apiRouter.post('/teams/:id/cashflow', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const role = db.getUserRoleInTeam(req.params.id, userId);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin tim yang dapat mencatat transaksi kas.' });
  }

  const { type, category, amount, description, date, eventId } = req.body;
  if (!type || !category || !amount || !description) {
    return res.status(400).json({ error: 'Jenis, kategori, jumlah nominal, dan keterangan wajib diisi.' });
  }

  const tx = db.addCashflowTransaction({
    teamId: req.params.id,
    type,
    category,
    amount: Number(amount),
    description,
    date: date || new Date().toISOString(),
    eventId: eventId || undefined,
    recordedBy: userId
  });

  const summary = db.getCashflowSummary(req.params.id);
  res.status(201).json({ transaction: tx, summary });
});

apiRouter.put('/teams/:id/cashflow/:transId', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const role = db.getUserRoleInTeam(req.params.id, userId);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin tim yang dapat mengubah transaksi kas.' });
  }

  const updated = db.updateCashflowTransaction(req.params.transId, req.body);
  if (!updated) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });

  const summary = db.getCashflowSummary(req.params.id);
  res.json({ transaction: updated, summary });
});

apiRouter.delete('/teams/:id/cashflow/:transId', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const role = db.getUserRoleInTeam(req.params.id, userId);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin tim yang dapat menghapus transaksi kas.' });
  }

  const ok = db.deleteCashflowTransaction(req.params.transId);
  if (!ok) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });

  const summary = db.getCashflowSummary(req.params.id);
  res.json({ success: true, summary });
});

apiRouter.get('/teams/:id/cashflow/dues', (req: Request, res: Response) => {
  const { period } = req.query;
  const dues = db.getMemberDues(req.params.id, period ? String(period) : undefined);
  res.json({ dues });
});

apiRouter.post('/teams/:id/cashflow/dues/:dueId/toggle', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const role = db.getUserRoleInTeam(req.params.id, userId);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin yang dapat memperbarui status iuran anggota.' });
  }

  const { status, notes } = req.body;
  if (!status || (status !== 'lunas' && status !== 'belum_lunas')) {
    return res.status(400).json({ error: 'Status harus "lunas" atau "belum_lunas".' });
  }

  const updated = db.toggleMemberDue(req.params.dueId, status, notes);
  if (!updated) return res.status(404).json({ error: 'Catatan iuran tidak ditemukan.' });

  const summary = db.getCashflowSummary(req.params.id);
  res.json({ due: updated, summary });
});

apiRouter.post('/teams/:id/cashflow/dues', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const role = db.getUserRoleInTeam(req.params.id, userId);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin yang dapat menambah tagihan iuran.' });
  }

  const { targetUserId, period, amount, notes } = req.body;
  if (!targetUserId || !period || !amount) {
    return res.status(400).json({ error: 'Pemain, periode, dan nominal wajib diisi.' });
  }

  const due = db.addMemberDue({
    teamId: req.params.id,
    userId: targetUserId,
    period,
    amount: Number(amount),
    notes
  });

  const summary = db.getCashflowSummary(req.params.id);
  res.status(201).json({ due, summary });
});

apiRouter.get('/teams/:id/cashflow/whatsapp-report', (req: Request, res: Response) => {
  const team = db.getTeamById(req.params.id);
  if (!team) return res.status(404).json({ error: 'Tim tidak ditemukan.' });

  const summary = db.getCashflowSummary(team.id);
  const transactions = db.getCashflow(team.id).slice(0, 8);
  const dues = db.getMemberDues(team.id);
  const unpaid = dues.filter(d => d.status === 'belum_lunas');

  const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  const dateNow = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let recentList = transactions.map((t, i) => {
    const symbol = t.type === 'masuk' ? '🟢 (+)' : '🔴 (-)';
    return `${i + 1}. ${symbol} ${formatRp(t.amount)} | ${t.description}`;
  }).join('\n');
  if (!recentList) recentList = '- (Belum ada catatan mutasi)';

  let unpaidList = unpaid.map((d, i) => {
    return `${i + 1}. ${d.user?.displayName || 'Pemain'} (${formatRp(d.amount)})`;
  }).join('\n');
  if (!unpaidList) unpaidList = '🎉 Semua anggota sudah lunas!';

  const text = `💰 *LAPORAN KAS TIM VOLI* 💰
*${team.name}*
Per Tanggal: ${dateNow}

━━━━━━━━━━━━━━━━━━
💵 *RINGKASAN SALDO:*
• *Saldo Kas Saat Ini:* *${formatRp(summary.currentBalance)}*
• Total Pemasukan: ${formatRp(summary.totalIncome)}
• Total Pengeluaran: ${formatRp(summary.totalExpense)}
• Pemasukan Bulan Ini: ${formatRp(summary.thisMonthIncome)}
• Pengeluaran Bulan Ini: ${formatRp(summary.thisMonthExpense)}
━━━━━━━━━━━━━━━━━━
📋 *MUTASI TERAKHIR:*
${recentList}
━━━━━━━━━━━━━━━━━━
⏳ *BELUM LUNAS IURAN (${unpaid.length} Orang):*
${unpaidList}
━━━━━━━━━━━━━━━━━━
_Laporan otomatis transparan dari aplikasi VoliBareng_ 🏐`;

  res.json({ text });
});

