import http from 'node:http';
import { DatabaseStore } from '../db';
import { sendJson } from '../utils/http';

export function handleHealthRoutes(
  method: string,
  pathname: string,
  res: http.ServerResponse,
  store: DatabaseStore,
  config: { aiEnabled: boolean; model: string }
): boolean {
  if (method === 'GET' && pathname === '/') {
    sendJson(res, 200, {
      name: 'Monopoli WNI Simulator RESTful API',
      ok: true,
      database: store.getStatus(),
      routes: {
        health: '/api/health',
        saves: '/api/saves',
        leaderboard: '/api/leaderboard',
        rooms: '/api/rooms',
        narrator: '/api/breaking-news'
      }
    });
    return true;
  }

  if (method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      aiEnabled: config.aiEnabled,
      model: config.model,
      database: store.getStatus()
    });
    return true;
  }

  return false;
}
