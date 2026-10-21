import pg from 'pg';

const { Pool } = pg;

export const NEON_CONNECTION_STRING = process.env.DATABASE_URL || '';

const cleanConnectionString = NEON_CONNECTION_STRING.replace(/&channel_binding=[^&]*/, '');

export const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

export async function initPostgresDatabase() {
  console.log('[PostgreSQL Neon] Menghubungkan ke Neon PostgreSQL...');
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT current_database() as db_name, version()');
    console.log('[PostgreSQL Neon] Terhubung ke Neon DB:', res.rows[0].db_name);

    // Create all tables if not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        display_name VARCHAR(255) NOT NULL,
        phone VARCHAR(64),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(32) DEFAULT '🏐',
        position VARCHAR(64) DEFAULT 'All-Round',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        code VARCHAR(64) UNIQUE NOT NULL,
        timezone VARCHAR(64) DEFAULT 'Asia/Jakarta (WIB)',
        created_by VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(64) PRIMARY KEY,
        team_id VARCHAR(64) REFERENCES teams(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(32) DEFAULT 'pemain',
        status VARCHAR(32) DEFAULT 'aktif',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(64) PRIMARY KEY,
        team_id VARCHAR(64) REFERENCES teams(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        duration_minutes INT DEFAULT 120,
        location VARCHAR(255) NOT NULL,
        location_map_url TEXT,
        notes TEXT,
        max_players INT DEFAULT 14,
        status VARCHAR(32) DEFAULT 'terjadwal',
        cancellation_reason TEXT,
        created_by VARCHAR(64) REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(64) PRIMARY KEY,
        event_id VARCHAR(64) REFERENCES events(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(32) NOT NULL,
        note TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(event_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS cashflow_transactions (
        id VARCHAR(64) PRIMARY KEY,
        team_id VARCHAR(64) REFERENCES teams(id) ON DELETE CASCADE,
        event_id VARCHAR(64) REFERENCES events(id) ON DELETE SET NULL,
        type VARCHAR(16) NOT NULL,
        category VARCHAR(64) NOT NULL,
        amount NUMERIC NOT NULL,
        description TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        recorded_by VARCHAR(64) REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS member_dues (
        id VARCHAR(64) PRIMARY KEY,
        team_id VARCHAR(64) REFERENCES teams(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        event_id VARCHAR(64) REFERENCES events(id) ON DELETE SET NULL,
        period VARCHAR(64) NOT NULL,
        amount NUMERIC NOT NULL,
        status VARCHAR(32) DEFAULT 'belum_lunas',
        paid_at TIMESTAMPTZ,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS notification_jobs (
        id VARCHAR(64) PRIMARY KEY,
        event_id VARCHAR(64) REFERENCES events(id) ON DELETE CASCADE,
        team_id VARCHAR(64) REFERENCES teams(id) ON DELETE CASCADE,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(64) NOT NULL,
        target_time TIMESTAMPTZ NOT NULL,
        status VARCHAR(32) DEFAULT 'pending',
        sent_at TIMESTAMPTZ,
        error_message TEXT,
        message_title VARCHAR(255) NOT NULL,
        message_body TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications_feed (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        team_id VARCHAR(64) REFERENCES teams(id) ON DELETE CASCADE,
        event_id VARCHAR(64) REFERENCES events(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(32) DEFAULT 'reminder',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notification_preferences (
        user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        reminder_1_day BOOLEAN DEFAULT TRUE,
        reminder_2_hours BOOLEAN DEFAULT TRUE,
        on_schedule_change BOOLEAN DEFAULT TRUE,
        sound_enabled BOOLEAN DEFAULT TRUE
      );
    `);
    console.log('[PostgreSQL Neon] Seluruh skema tabel terverifikasi di Neon.');
  } finally {
    client.release();
  }
}

// Function to load all data from Neon PostgreSQL into memory
export async function loadAllDataFromNeon() {
  const client = await pool.connect();
  try {
    const usersRes = await client.query('SELECT * FROM users');
    const teamsRes = await client.query('SELECT * FROM teams');
    const membersRes = await client.query('SELECT * FROM team_members');
    const eventsRes = await client.query('SELECT * FROM events');
    const attRes = await client.query('SELECT * FROM attendance');
    const txRes = await client.query('SELECT * FROM cashflow_transactions');
    const duesRes = await client.query('SELECT * FROM member_dues');
    const jobsRes = await client.query('SELECT * FROM notification_jobs');
    const feedRes = await client.query('SELECT * FROM notifications_feed');
    const prefRes = await client.query('SELECT * FROM notification_preferences');

    return {
      users: usersRes.rows.map(r => ({
        id: r.id,
        displayName: r.display_name,
        phone: r.phone || '',
        email: r.email,
        passwordHash: r.password_hash,
        avatar: r.avatar || '🏐',
        position: r.position || 'All-Round',
        createdAt: r.created_at.toISOString()
      })),
      teams: teamsRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        code: r.code,
        timezone: r.timezone || 'Asia/Jakarta (WIB)',
        createdBy: r.created_by,
        createdAt: r.created_at.toISOString()
      })),
      teamMembers: membersRes.rows.map(r => ({
        id: r.id,
        teamId: r.team_id,
        userId: r.user_id,
        role: r.role,
        status: r.status,
        joinedAt: r.joined_at.toISOString()
      })),
      events: eventsRes.rows.map(r => ({
        id: r.id,
        teamId: r.team_id,
        title: r.title,
        startsAt: r.starts_at.toISOString(),
        durationMinutes: r.duration_minutes || 120,
        location: r.location,
        locationMapUrl: r.location_map_url || undefined,
        notes: r.notes || undefined,
        maxPlayers: r.max_players || 14,
        status: r.status,
        cancellationReason: r.cancellation_reason || undefined,
        createdBy: r.created_by,
        createdAt: r.created_at.toISOString(),
        updatedAt: r.updated_at.toISOString()
      })),
      attendance: attRes.rows.map(r => ({
        id: r.id,
        eventId: r.event_id,
        userId: r.user_id,
        status: r.status,
        note: r.note || '',
        updatedAt: r.updated_at.toISOString()
      })),
      cashflowTransactions: txRes.rows.map(r => ({
        id: r.id,
        teamId: r.team_id,
        eventId: r.event_id || undefined,
        type: r.type,
        category: r.category,
        amount: Number(r.amount),
        description: r.description,
        date: r.date.toISOString(),
        recordedBy: r.recorded_by,
        createdAt: r.created_at.toISOString()
      })),
      memberDues: duesRes.rows.map(r => ({
        id: r.id,
        teamId: r.team_id,
        userId: r.user_id,
        eventId: r.event_id || undefined,
        period: r.period,
        amount: Number(r.amount),
        status: r.status,
        paidAt: r.paid_at ? r.paid_at.toISOString() : undefined,
        notes: r.notes || undefined
      })),
      notificationJobs: jobsRes.rows.map(r => ({
        id: r.id,
        eventId: r.event_id || undefined,
        teamId: r.team_id,
        userId: r.user_id,
        type: r.type,
        targetTime: r.target_time.toISOString(),
        status: r.status,
        sentAt: r.sent_at ? r.sent_at.toISOString() : null,
        errorMessage: r.error_message || null,
        messageTitle: r.message_title,
        messageBody: r.message_body,
        createdAt: r.created_at.toISOString()
      })),
      notificationsFeed: feedRes.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        teamId: r.team_id,
        eventId: r.event_id || undefined,
        title: r.title,
        body: r.body,
        type: r.type,
        read: r.read,
        createdAt: r.created_at.toISOString()
      })),
      notificationPreferences: prefRes.rows.map(r => ({
        userId: r.user_id,
        reminder1Day: r.reminder_1_day,
        reminder2Hours: r.reminder_2_hours,
        onScheduleChange: r.on_schedule_change,
        soundEnabled: r.sound_enabled
      }))
    };
  } finally {
    client.release();
  }
}

// Background async writer to PostgreSQL
export async function syncToPostgres(type: string, data: any) {
  try {
    switch (type) {
      case 'INSERT_USER':
        await pool.query(
          `INSERT INTO users (id, display_name, phone, email, password_hash, avatar, position, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET display_name = $2, phone = $3, position = $7, avatar = $6`,
          [data.id, data.displayName, data.phone, data.email, data.passwordHash, data.avatar, data.position, data.createdAt]
        );
        break;
      case 'UPDATE_USER':
        await pool.query(
          `UPDATE users SET display_name = COALESCE($2, display_name), phone = COALESCE($3, phone),
           avatar = COALESCE($4, avatar), position = COALESCE($5, position) WHERE id = $1`,
          [data.id, data.displayName, data.phone, data.avatar, data.position]
        );
        break;
      case 'INSERT_TEAM':
        await pool.query(
          `INSERT INTO teams (id, name, description, code, timezone, created_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [data.id, data.name, data.description, data.code, data.timezone, data.createdBy, data.createdAt]
        );
        break;
      case 'INSERT_MEMBER':
        await pool.query(
          `INSERT INTO team_members (id, team_id, user_id, role, status, joined_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (team_id, user_id) DO UPDATE SET role = $4, status = $5`,
          [data.id, data.teamId, data.userId, data.role, data.status, data.joinedAt]
        );
        break;
      case 'DELETE_MEMBER':
        await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [data.teamId, data.userId]);
        break;
      case 'INSERT_EVENT':
        await pool.query(
          `INSERT INTO events (id, team_id, title, starts_at, duration_minutes, location, location_map_url, notes, max_players, status, cancellation_reason, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET title = $3, starts_at = $4, duration_minutes = $5, location = $6, notes = $8, max_players = $9, status = $10, cancellation_reason = $11, updated_at = $14`,
          [
            data.id, data.teamId, data.title, data.startsAt, data.durationMinutes, data.location,
            data.locationMapUrl, data.notes, data.maxPlayers, data.status, data.cancellationReason,
            data.createdBy, data.createdAt, data.updatedAt
          ]
        );
        break;
      case 'DELETE_EVENT':
        await pool.query('DELETE FROM events WHERE id = $1', [data.id]);
        break;
      case 'UPSERT_ATTENDANCE':
        await pool.query(
          `INSERT INTO attendance (id, event_id, user_id, status, note, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (event_id, user_id) DO UPDATE SET status = $4, note = $5, updated_at = $6`,
          [data.id, data.eventId, data.userId, data.status, data.note, data.updatedAt]
        );
        break;
      case 'INSERT_TX':
        await pool.query(
          `INSERT INTO cashflow_transactions (id, team_id, event_id, type, category, amount, description, date, recorded_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET type = $4, category = $5, amount = $6, description = $7, date = $8, event_id = $3`,
          [data.id, data.teamId, data.eventId || null, data.type, data.category, data.amount, data.description, data.date, data.recordedBy, data.createdAt]
        );
        break;
      case 'DELETE_TX':
        await pool.query('DELETE FROM cashflow_transactions WHERE id = $1', [data.id]);
        break;
      case 'UPSERT_DUE':
        await pool.query(
          `INSERT INTO member_dues (id, team_id, user_id, event_id, period, amount, status, paid_at, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET status = $7, paid_at = $8, notes = $9`,
          [data.id, data.teamId, data.userId, data.eventId || null, data.period, data.amount, data.status, data.paidAt || null, data.notes]
        );
        break;
      case 'UPSERT_PREF':
        await pool.query(
          `INSERT INTO notification_preferences (user_id, reminder_1_day, reminder_2_hours, on_schedule_change, sound_enabled)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id) DO UPDATE SET reminder_1_day = $2, reminder_2_hours = $3, on_schedule_change = $4, sound_enabled = $5`,
          [data.userId, data.reminder1Day, data.reminder2Hours, data.onScheduleChange, data.soundEnabled]
        );
        break;
      case 'UPSERT_FEED':
        await pool.query(
          `INSERT INTO notifications_feed (id, user_id, team_id, event_id, title, body, type, read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET read = $8`,
          [data.id, data.userId, data.teamId, data.eventId || null, data.title, data.body, data.type, data.read, data.createdAt]
        );
        break;
      case 'UPSERT_JOB':
        await pool.query(
          `INSERT INTO notification_jobs (id, event_id, team_id, user_id, type, target_time, status, sent_at, message_title, message_body, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET status = $7, sent_at = $8`,
          [data.id, data.eventId || null, data.teamId, data.userId, data.type, data.targetTime, data.status, data.sentAt || null, data.messageTitle, data.messageBody, data.createdAt]
        );
        break;
    }
  } catch (err) {
    console.error(`[PostgreSQL Neon Sync Error] ${type}:`, err);
  }
}
