import express, { Express } from 'express';
import { apiRouter } from './routes';
import { db } from './db';

let dbInitPromise: Promise<void> | null = null;

function ensureDbInitialized(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = db.initPostgres().catch((err) => {
      console.error('[PostgreSQL] Gagal init:', err);
    });
  }
  return dbInitPromise;
}

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  // Scheduler opportunistic: setInterval tidak jalan di serverless,
  // jadi jalankan saat ada request (maksimal sekali tiap 2 menit)
  let lastSchedulerRun = 0;
  app.use((_req, _res, next) => {
    const now = Date.now();
    if (now - lastSchedulerRun > 2 * 60 * 1000) {
      lastSchedulerRun = now;
      try {
        db.runSchedulerNow(false);
      } catch {
        // abaikan error scheduler
      }
    }
    next();
  });

  app.use('/api', async (_req, _res, next) => {
    await ensureDbInitialized();
    next();
  });

  app.use('/api', apiRouter);

  return app;
}
