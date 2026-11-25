import http from 'node:http';
import { DatabaseStore } from './db';
import { defaultRoomManager, RoomManager } from './rooms';

const VALID_IMPACTS = new Set(['INFLATION', 'TAX', 'CORRUPTION_CRACKDOWN', 'SUBSIDY_CUT']);

export interface ApiRouterOptions {
  geminiModel?: string;
  geminiApiKey?: string;
  roomManager?: RoomManager;
}

export function sendJson(res: http.ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function parseJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const raw = await readRequestBody(req);
  if (!raw.trim()) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Body JSON harus berupa objek');
  }
  return parsed as Record<string, unknown>;
}

async function generateGeminiNews(body: Record<string, unknown>, apiKey: string, model: string) {
  const prompt = [
    'Kamu adalah redaktur berita satir ekonomi-politik Indonesia untuk game Monopoli WNI Simulator.',
    'Buat 1 berita kilat (Breaking News) singkat dalam Bahasa Indonesia yang relevan dengan kondisi permainan saat ini.',
    `Data kondisi saat ini: ${JSON.stringify(body)}`,
    'Kembalikan HANYA JSON valid dengan struktur persis:',
    '{',
    '  "headline": "BREAKING NEWS: <judul singkat maksimal 90 karakter>",',
    '  "detail": "<narasi satir 1-2 kalimat maksimal 180 karakter>",',
    '  "impactType": "INFLATION" | "TAX" | "CORRUPTION_CRACKDOWN" | "SUBSIDY_CUT",',
    '  "impactSummary": "<ringkasan dampak 1 kalimat maksimal 90 karakter>"',
    '}'
  ].join('\n');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Respons Gemini kosong');
  }

  const parsed = JSON.parse(rawText) as Record<string, unknown>;
  const impactType = String(parsed.impactType ?? '');
  if (!VALID_IMPACTS.has(impactType)) {
    throw new Error(`impactType tidak valid: ${impactType}`);
  }

  return {
    id: `ai_news_${Date.now()}`,
    headline: String(parsed.headline ?? 'BREAKING NEWS: Gejolak Ekonomi Nasional!'),
    detail: String(parsed.detail ?? 'Pelaku pasar dan warga bersiap menghadapi penyesuaian kebijakan mendadak.'),
    impactType,
    impactSummary: String(parsed.impactSummary ?? 'Kondisi makroekonomi dan tekanan warga berubah.')
  };
}

export async function handleApiRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: DatabaseStore,
  options: ApiRouterOptions = {}
): Promise<void> {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const method = req.method ?? 'GET';
  const parsedUrl = new URL(req.url ?? '/', 'http://localhost');
  const pathname = parsedUrl.pathname;
  const model = options.geminiModel ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  const apiKey = options.geminiApiKey ?? process.env.GEMINI_API_KEY;

  // 1. Health Check
  if (method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      aiEnabled: Boolean(apiKey),
      model,
      database: store.getStatus()
    });
    return;
  }

  // 2. AI Breaking News Narrator
  if (method === 'POST' && pathname === '/api/breaking-news') {
    if (!apiKey) {
      sendJson(res, 503, { error: 'GEMINI_API_KEY belum dikonfigurasi di server.', fallback: true });
      return;
    }

    try {
      const body = await parseJsonBody(req);
      const news = await generateGeminiNews(body, apiKey, model);
      sendJson(res, 200, news);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghasilkan berita AI';
      sendJson(res, 502, { error: message, fallback: true });
    }
    return;
  }

  // 3. RESTful CRUD: /api/saves & /api/saves/:id
  if (method === 'GET' && pathname === '/api/saves') {
    const limitParam = Number(parsedUrl.searchParams.get('limit') ?? 20);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(100, limitParam) : 20;
    const saves = await store.listSaves(limit);
    sendJson(res, 200, { data: saves, count: saves.length });
    return;
  }

  if (method === 'POST' && pathname === '/api/saves') {
    try {
      const body = await parseJsonBody(req);
      if (!Array.isArray(body.players) || !Array.isArray(body.perimeterTiles) || !body.macro || typeof body.macro !== 'object') {
        sendJson(res, 400, { error: 'Field wajib: players (array), perimeterTiles (array), dan macro (object).' });
        return;
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
    return;
  }

  const saveIdMatch = pathname.match(/^\/api\/saves\/([^/]+)$/);
  if (saveIdMatch) {
    const saveId = decodeURIComponent(saveIdMatch[1]);

    if (method === 'GET') {
      const found = await store.getSaveById(saveId);
      if (!found) {
        sendJson(res, 404, { error: 'Data simpanan tidak ditemukan' });
        return;
      }
      sendJson(res, 200, { data: found });
      return;
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
          return;
        }
        sendJson(res, 200, { data: updated });
      } catch (error) {
        sendJson(res, 400, { error: error instanceof Error ? error.message : 'Payload tidak valid' });
      }
      return;
    }

    if (method === 'DELETE') {
      const deleted = await store.deleteSave(saveId);
      if (!deleted) {
        sendJson(res, 404, { error: 'Data simpanan tidak ditemukan' });
        return;
      }
      sendJson(res, 200, { deleted: true, id: saveId });
      return;
    }
  }

  // 4. RESTful Leaderboard: /api/leaderboard
  if (method === 'GET' && pathname === '/api/leaderboard') {
    const limitParam = Number(parsedUrl.searchParams.get('limit') ?? 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(100, limitParam) : 10;
    const modeParam = parsedUrl.searchParams.get('gameMode');
    const gameMode = modeParam === 'FAST' || modeParam === 'SURVIVAL' ? modeParam : undefined;

    const entries = await store.listLeaderboard({ limit, gameMode });
    sendJson(res, 200, { data: entries, count: entries.length });
    return;
  }

  if (method === 'POST' && pathname === '/api/leaderboard') {
    try {
      const body = await parseJsonBody(req);
      if (typeof body.winnerName !== 'string' || !body.winnerName.trim() || typeof body.netWorth !== 'number') {
        sendJson(res, 400, { error: 'Field wajib: winnerName (string) dan netWorth (number).' });
        return;
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
    return;
  }

  // 5. Multiplayer Online Rooms (/api/rooms)
  const roomManager = options.roomManager ?? defaultRoomManager;

  if (method === 'GET' && pathname === '/api/rooms') {
    const rooms = roomManager.listOpenRooms();
    sendJson(res, 200, { data: rooms, count: rooms.length });
    return;
  }

  if (method === 'POST' && pathname === '/api/rooms') {
    try {
      const body = await parseJsonBody(req);
      if (typeof body.hostClientId !== 'string' || !body.hostClientId.trim()) {
        sendJson(res, 400, { error: 'Field wajib: hostClientId (string).' });
        return;
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
    return;
  }

  const roomEventMatch = pathname.match(/^\/api\/rooms\/([^/]+)\/events$/);
  if (method === 'GET' && roomEventMatch) {
    roomManager.subscribe(decodeURIComponent(roomEventMatch[1]), req, res);
    return;
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
        return;
      }

      if (action === 'join') {
        const result = roomManager.joinRoom(code, {
          clientId,
          name: typeof body.name === 'string' ? body.name : 'Pemain',
          archetypeId: typeof body.archetypeId === 'string' ? body.archetypeId : 'bambang_umr'
        });
        if (!result.ok) {
          sendJson(res, result.status, { error: result.error });
          return;
        }
        sendJson(res, 200, { data: result.room });
        return;
      }

      if (action === 'leave') {
        const room = roomManager.leaveRoom(code, clientId);
        sendJson(res, 200, { left: true, data: room });
        return;
      }

      if (action === 'start') {
        const gameState =
          body.gameState && typeof body.gameState === 'object' ? (body.gameState as Record<string, unknown>) : {};
        const result = roomManager.startGame(code, clientId, gameState);
        if (!result.ok) {
          sendJson(res, result.status, { error: result.error });
          return;
        }
        sendJson(res, 200, { data: result.room });
        return;
      }

      if (action === 'sync') {
        if (!body.gameState || typeof body.gameState !== 'object') {
          sendJson(res, 400, { error: 'Field wajib: gameState (object).' });
          return;
        }
        const result = roomManager.syncState(code, clientId, body.gameState as Record<string, unknown>);
        if (!result.ok) {
          sendJson(res, result.status, { error: result.error });
          return;
        }
        sendJson(res, 200, { stateVersion: result.stateVersion });
        return;
      }
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : 'Payload tidak valid' });
      return;
    }
  }

  const roomDetailMatch = pathname.match(/^\/api\/rooms\/([^/]+)$/);
  if (method === 'GET' && roomDetailMatch) {
    const room = roomManager.getRoom(decodeURIComponent(roomDetailMatch[1]));
    if (!room) {
      sendJson(res, 404, { error: 'Room tidak ditemukan' });
      return;
    }
    sendJson(res, 200, { data: room });
    return;
  }

  sendJson(res, 404, { error: 'Endpoint tidak ditemukan' });
}
