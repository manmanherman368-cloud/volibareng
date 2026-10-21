import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes';
import { db } from './src/server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize Neon PostgreSQL database connection & tables
  await db.initPostgres();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API router
  app.use('/api', apiRouter);

  // Background automated scheduler runner (runs every 30 seconds)
  setInterval(() => {
    try {
      const res = db.runSchedulerNow(false);
      if (res.processedCount > 0) {
        console.log(`[Scheduler] Otomatis memproses ${res.processedCount} pengingat voli.`);
      }
    } catch (e) {
      console.error('[Scheduler] Error running background check:', e);
    }
  }, 30000);

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VoliBareng] Server berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[VoliBareng] Gagal memulai server:', err);
  process.exit(1);
});
