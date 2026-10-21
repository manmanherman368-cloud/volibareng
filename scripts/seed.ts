import 'dotenv/config';
import { pool, initPostgresDatabase } from '../src/server/postgres';

const RESET = process.argv.includes('--reset');

const SEED_USERS = [
  {
    id: 'usr-admin-1',
    displayName: 'Admin VoliBareng',
    phone: '081200000001',
    email: 'admin@volibareng.id',
    passwordHash: 'admin123',
    avatar: '🏐',
    position: 'All-Round'
  },
  {
    id: 'usr-player-1',
    displayName: 'Pemain Satu',
    phone: '081200000002',
    email: 'pemain1@volibareng.id',
    passwordHash: 'player123',
    avatar: '⚡',
    position: 'Outside Hitter / Spiker'
  },
  {
    id: 'usr-player-2',
    displayName: 'Pemain Dua',
    phone: '081200000003',
    email: 'pemain2@volibareng.id',
    passwordHash: 'player123',
    avatar: '🎯',
    position: 'Setter'
  }
];

const SEED_TEAM = {
  id: 'team-1',
  name: 'Tim Voli Barel',
  description: 'Tim voli komunitas. Silakan ganti nama & kode lewat aplikasi.',
  code: 'VOLI-001',
  timezone: 'Asia/Jakarta (WIB)',
  createdBy: 'usr-admin-1'
};

const SEED_MEMBERS = [
  { id: 'tm-1', teamId: SEED_TEAM.id, userId: 'usr-admin-1', role: 'admin' },
  { id: 'tm-2', teamId: SEED_TEAM.id, userId: 'usr-player-1', role: 'pemain' },
  { id: 'tm-3', teamId: SEED_TEAM.id, userId: 'usr-player-2', role: 'pemain' }
];

async function resetAll(client: any) {
  console.log('[Seed] Mode --reset: menghapus seluruh data...');
  await client.query(`
    TRUNCATE
      notification_preferences,
      notifications_feed,
      notification_jobs,
      member_dues,
      cashflow_transactions,
      attendance,
      events,
      team_members,
      teams,
      users
    RESTART IDENTITY CASCADE
  `);
}

async function seed() {
  console.log('[Seed] Menghubungkan ke PostgreSQL...');
  await initPostgresDatabase();

  const client = await pool.connect();
  try {
    if (RESET) {
      await resetAll(client);
    } else {
      const res = await client.query('SELECT count(*) FROM users');
      if (parseInt(res.rows[0].count, 10) > 0) {
        console.log('[Seed] Database sudah berisi data. Gunakan `npm run seed -- --reset` untuk hapus & seed ulang.');
        return;
      }
    }

    await client.query('BEGIN');
    try {
      for (const u of SEED_USERS) {
        await client.query(
          `INSERT INTO users (id, display_name, phone, email, password_hash, avatar, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [u.id, u.displayName, u.phone, u.email, u.passwordHash, u.avatar, u.position]
        );
      }

      await client.query(
        `INSERT INTO teams (id, name, description, code, timezone, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [SEED_TEAM.id, SEED_TEAM.name, SEED_TEAM.description, SEED_TEAM.code, SEED_TEAM.timezone, SEED_TEAM.createdBy]
      );

      for (const m of SEED_MEMBERS) {
        await client.query(
          `INSERT INTO team_members (id, team_id, user_id, role, status)
           VALUES ($1, $2, $3, $4, 'aktif')
           ON CONFLICT (team_id, user_id) DO NOTHING`,
          [m.id, m.teamId, m.userId, m.role]
        );
      }

      for (const u of SEED_USERS) {
        await client.query(
          `INSERT INTO notification_preferences (user_id)
           VALUES ($1)
           ON CONFLICT (user_id) DO NOTHING`,
          [u.id]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

    console.log('[Seed] Selesai! Data minimal tersimpan:');
    console.log('  - 3 user (admin@volibareng.id / admin123, pemain1@volibareng.id / player123, pemain2@volibareng.id / player123)');
    console.log('  - 1 tim (kode: VOLI-001) dengan 3 anggota');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('[Seed] Gagal:', err);
  process.exit(1);
});
