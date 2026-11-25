import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { connectDatabase } from './db';
import { handleApiRequest } from './routes';

/**
 * Muat variabel .env lokal secara ringan tanpa dependensi eksternal.
 */
function loadLocalEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const PORT = Number(process.env.API_PORT ?? process.env.AI_PROXY_PORT ?? 3001);

async function startServer() {
  const store = await connectDatabase();

  const server = http.createServer((req, res) => {
    void handleApiRequest(req, res, store);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[API] Port ${PORT} sudah dipakai proses lain. Hentikan proses tersebut (mis. \`fuser -k ${PORT}/tcp\`) atau jalankan di port lain: \`API_PORT=3002 npm run server\`.`
      );
      void store.close().finally(() => process.exit(1));
      return;
    }
    console.error('[API] Server error:', err.message);
    void store.close().finally(() => process.exit(1));
  });

  server.listen(PORT, () => {
    const status = store.getStatus();
    console.log(
      `[API] Monopoli WNI RESTful API aktif di http://localhost:${PORT} (DB: ${status.mode}/${status.dbName})`
    );
  });

  const shutdown = async () => {
    await store.close();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void startServer();
