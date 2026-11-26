import http from 'node:http';
import { DatabaseStore } from '../db';
import { parseJsonBody, sendJson } from '../utils/http';

export async function handleSavesRoutes(
  method: string,
  pathname: string,
  parsedUrl: URL,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: DatabaseStore
): Promise<boolean> {
  if (method === 'GET' && pathname === '/api/saves') {
    const limitParam = Number(parsedUrl.searchParams.get('limit') ?? 20);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(100, limitParam) : 20;
    const saves = await store.listSaves(limit);
    sendJson(res, 200, { data: saves, count: saves.length });
    return true;
  }

  if (method === 'POST' && pathname === '/api/saves') {
    try {
      const body = await parseJsonBody(req);
      if (
        !Array.isArray(body.players) ||
        !Array.isArray(body.perimeterTiles) ||
        !body.macro ||
        typeof body.macro !== 'object'
      ) {
        sendJson(res, 400, { error: 'Field wajib: players (array), perimeterTiles (array), dan macro (object).' });
        return true;
      }

      const gameMode = body.gameMode === 'FAST' ? 'FAST' : 'SURVIVAL';
      const created = await store.createSave({
        id: typeof body.id === 'string' ? body.id : undefined,
        title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Sesi Monopoli WNI',
        gameMode,
        cycleRound: Number(body.cycleRound ?? 1),
        activePlayerIndex: Number(body.activePlayerIndex ?? 0),
        players: body.players,
        perimeterTiles: body.perimeterTiles,
        corruptionTiles: Array.isArray(body.corruptionTiles) ? body.corruptionTiles : undefined,
        macro: body.macro as Record<string, unknown>,
        activeLaws: Array.isArray(body.activeLaws) ? body.activeLaws : undefined
      });
      sendJson(res, 201, { data: created });
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : 'Payload tidak valid' });
    }
    return true;
  }

  const saveIdMatch = pathname.match(/^\/api\/saves\/([^/]+)$/);
  if (!saveIdMatch) return false;

  const saveId = decodeURIComponent(saveIdMatch[1]);

  if (method === 'GET') {
    const found = await store.getSaveById(saveId);
    if (!found) {
      sendJson(res, 404, { error: 'Data simpanan tidak ditemukan' });
      return true;
    }
    sendJson(res, 200, { data: found });
    return true;
  }

  if (method === 'PUT') {
    try {
      const body = await parseJsonBody(req);
      const updated = await store.updateSave(saveId, {
        ...(typeof body.title === 'string' ? { title: body.title.trim() } : {}),
        ...(body.gameMode === 'FAST' || body.gameMode === 'SURVIVAL' ? { gameMode: body.gameMode } : {}),
        ...(body.cycleRound !== undefined ? { cycleRound: Number(body.cycleRound) } : {}),
        ...(body.activePlayerIndex !== undefined ? { activePlayerIndex: Number(body.activePlayerIndex) } : {}),
        ...(Array.isArray(body.players) ? { players: body.players } : {}),
        ...(Array.isArray(body.perimeterTiles) ? { perimeterTiles: body.perimeterTiles } : {}),
        ...(Array.isArray(body.corruptionTiles) ? { corruptionTiles: body.corruptionTiles } : {}),
        ...(body.macro && typeof body.macro === 'object' ? { macro: body.macro as Record<string, unknown> } : {}),
        ...(Array.isArray(body.activeLaws) ? { activeLaws: body.activeLaws } : {})
      });
      if (!updated) {
        sendJson(res, 404, { error: 'Data simpanan tidak ditemukan' });
        return true;
      }
      sendJson(res, 200, { data: updated });
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : 'Payload tidak valid' });
    }
    return true;
  }

  if (method === 'DELETE') {
    const deleted = await store.deleteSave(saveId);
    if (!deleted) {
      sendJson(res, 404, { error: 'Data simpanan tidak ditemukan' });
      return true;
    }
    sendJson(res, 200, { deleted: true, id: saveId });
    return true;
  }

  return false;
}
