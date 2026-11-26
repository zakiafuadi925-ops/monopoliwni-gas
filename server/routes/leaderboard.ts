import http from 'node:http';
import { DatabaseStore } from '../db';
import { parseJsonBody, sendJson } from '../utils/http';

export async function handleLeaderboardRoutes(
  method: string,
  pathname: string,
  parsedUrl: URL,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: DatabaseStore
): Promise<boolean> {
  if (method === 'GET' && pathname === '/api/leaderboard') {
    const limitParam = Number(parsedUrl.searchParams.get('limit') ?? 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(100, limitParam) : 10;
    const modeParam = parsedUrl.searchParams.get('gameMode');
    const gameMode = modeParam === 'FAST' || modeParam === 'SURVIVAL' ? modeParam : undefined;

    const entries = await store.listLeaderboard({ limit, gameMode });
    sendJson(res, 200, { data: entries, count: entries.length });
    return true;
  }

  if (method === 'POST' && pathname === '/api/leaderboard') {
    try {
      const body = await parseJsonBody(req);
      if (typeof body.winnerName !== 'string' || !body.winnerName.trim() || typeof body.netWorth !== 'number') {
        sendJson(res, 400, { error: 'Field wajib: winnerName (string) dan netWorth (number).' });
        return true;
      }

      const entry = await store.addLeaderboardEntry({
        winnerName: body.winnerName.trim(),
        archetypeId: typeof body.archetypeId === 'string' ? body.archetypeId : 'bambang_umr',
        netWorth: body.netWorth,
        cash: Number(body.cash ?? 0),
        cycleRound: Number(body.cycleRound ?? 1),
        gameMode: body.gameMode === 'FAST' ? 'FAST' : 'SURVIVAL',
        reason: typeof body.reason === 'string' ? body.reason : 'Menang permainan'
      });
      sendJson(res, 201, { data: entry });
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : 'Payload tidak valid' });
    }
    return true;
  }

  return false;
}
