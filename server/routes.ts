import http from 'node:http';
import { DatabaseStore } from './db';
import { defaultRoomManager, RoomManager } from './rooms';
import { sendJson } from './utils/http';
import { handleHealthRoutes } from './routes/health';
import { handleSavesRoutes } from './routes/saves';
import { handleLeaderboardRoutes } from './routes/leaderboard';
import { handleRoomRoutes } from './routes/rooms';
import { handleNarratorRoutes } from './routes/narrator';
import { tryServeStaticFrontend } from './routes/static';

export interface ApiRouterOptions {
  geminiModel?: string;
  geminiApiKey?: string;
  roomManager?: RoomManager;
  serveStatic?: boolean;
}

export async function handleApiRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: DatabaseStore,
  options: ApiRouterOptions = {}
): Promise<void> {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204);
    return;
  }

  const method = req.method ?? 'GET';
  const parsedUrl = new URL(req.url ?? '/', 'http://localhost');
  const pathname = parsedUrl.pathname;
  const model = options.geminiModel ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  const apiKey = options.geminiApiKey ?? process.env.GEMINI_API_KEY;
  const roomManager = options.roomManager ?? defaultRoomManager;

  // 1. Endpoint API terpisah per domain
  if (await handleNarratorRoutes(method, pathname, req, res, { apiKey, model })) return;
  if (await handleSavesRoutes(method, pathname, parsedUrl, req, res, store)) return;
  if (await handleLeaderboardRoutes(method, pathname, parsedUrl, req, res, store)) return;
  if (await handleRoomRoutes(method, pathname, req, res, roomManager)) return;

  // 2. Jika bukan /api/* dan dist/ tersedia, sajikan frontend di port yang sama
  if (options.serveStatic !== false && tryServeStaticFrontend(method, pathname, res)) {
    return;
  }

  // 3. Health check & API root info (saat dev / dist belum di-build)
  if (handleHealthRoutes(method, pathname, res, store, { aiEnabled: Boolean(apiKey), model })) {
    return;
  }

  sendJson(res, 404, { error: 'Endpoint tidak ditemukan' });
}
