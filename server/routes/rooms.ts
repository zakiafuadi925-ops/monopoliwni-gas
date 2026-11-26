import http from 'node:http';
import { RoomManager } from '../rooms';
import { parseJsonBody, sendJson } from '../utils/http';

export async function handleRoomRoutes(
  method: string,
  pathname: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  roomManager: RoomManager
): Promise<boolean> {
  if (method === 'GET' && pathname === '/api/rooms') {
    const rooms = roomManager.listOpenRooms();
    sendJson(res, 200, { data: rooms, count: rooms.length });
    return true;
  }

  if (method === 'POST' && pathname === '/api/rooms') {
    try {
      const body = await parseJsonBody(req);
      if (typeof body.hostClientId !== 'string' || !body.hostClientId.trim()) {
        sendJson(res, 400, { error: 'Field wajib: hostClientId (string).' });
        return true;
      }
      const room = roomManager.createRoom({
        hostClientId: body.hostClientId.trim(),
        hostName: typeof body.hostName === 'string' ? body.hostName : 'Host',
        archetypeId: typeof body.archetypeId === 'string' ? body.archetypeId : 'bambang_umr',
        gameMode: body.gameMode === 'FAST' ? 'FAST' : 'SURVIVAL'
      });
      sendJson(res, 201, { data: room });
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : 'Payload tidak valid' });
    }
    return true;
  }

  const roomEventMatch = pathname.match(/^\/api\/rooms\/([^/]+)\/events$/);
  if (method === 'GET' && roomEventMatch) {
    roomManager.subscribe(decodeURIComponent(roomEventMatch[1]), req, res);
    return true;
  }

  const roomActionMatch = pathname.match(/^\/api\/rooms\/([^/]+)\/(join|leave|start|sync)$/);
  if (method === 'POST' && roomActionMatch) {
    const code = decodeURIComponent(roomActionMatch[1]);
    const action = roomActionMatch[2];

    try {
      const body = await parseJsonBody(req);
      const clientId = typeof body.clientId === 'string' ? body.clientId.trim() : '';
      if (!clientId) {
        sendJson(res, 400, { error: 'Field wajib: clientId (string).' });
        return true;
      }

      if (action === 'join') {
        const result = roomManager.joinRoom(code, {
          clientId,
          name: typeof body.name === 'string' ? body.name : 'Pemain',
          archetypeId: typeof body.archetypeId === 'string' ? body.archetypeId : 'bambang_umr'
        });
        if (!result.ok) {
          sendJson(res, result.status, { error: result.error });
          return true;
        }
        sendJson(res, 200, { data: result.room });
        return true;
      }

      if (action === 'leave') {
        const room = roomManager.leaveRoom(code, clientId);
        sendJson(res, 200, { left: true, data: room });
        return true;
      }

      if (action === 'start') {
        const gameState =
          body.gameState && typeof body.gameState === 'object' ? (body.gameState as Record<string, unknown>) : {};
        const result = roomManager.startGame(code, clientId, gameState);
        if (!result.ok) {
          sendJson(res, result.status, { error: result.error });
          return true;
        }
        sendJson(res, 200, { data: result.room });
        return true;
      }

      if (action === 'sync') {
        if (!body.gameState || typeof body.gameState !== 'object') {
          sendJson(res, 400, { error: 'Field wajib: gameState (object).' });
          return true;
        }
        const result = roomManager.syncState(code, clientId, body.gameState as Record<string, unknown>);
        if (!result.ok) {
          sendJson(res, result.status, { error: result.error });
          return true;
        }
        sendJson(res, 200, { stateVersion: result.stateVersion });
        return true;
      }
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : 'Payload tidak valid' });
      return true;
    }
  }

  const roomDetailMatch = pathname.match(/^\/api\/rooms\/([^/]+)$/);
  if (method === 'GET' && roomDetailMatch) {
    const room = roomManager.getRoom(decodeURIComponent(roomDetailMatch[1]));
    if (!room) {
      sendJson(res, 404, { error: 'Room tidak ditemukan' });
      return true;
    }
    sendJson(res, 200, { data: room });
    return true;
  }

  return false;
}
