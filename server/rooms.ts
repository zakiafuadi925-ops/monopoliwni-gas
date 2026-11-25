import crypto from 'node:crypto';
import http from 'node:http';

export interface RoomParticipant {
  clientId: string;
  name: string;
  archetypeId: string;
  isHost: boolean;
  joinedAt: string;
}

export interface MultiplayerRoom {
  code: string;
  hostClientId: string;
  status: 'LOBBY' | 'PLAYING';
  gameMode: 'SURVIVAL' | 'FAST';
  participants: RoomParticipant[];
  gameState: Record<string, unknown> | null;
  stateVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type RoomEventType = 'ROOM_UPDATED' | 'GAME_STARTED' | 'STATE_SYNC';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[crypto.randomInt(0, ROOM_CODE_CHARS.length)];
  }
  return code;
}

/**
 * Mengelola room multiplayer in-memory beserta broadcast realtime via Server-Sent Events (SSE).
 */
export class RoomManager {
  private rooms = new Map<string, MultiplayerRoom>();
  private subscribers = new Map<string, Set<http.ServerResponse>>();

  createRoom(input: {
    hostClientId: string;
    hostName: string;
    archetypeId: string;
    gameMode?: 'SURVIVAL' | 'FAST';
  }): MultiplayerRoom {
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const now = new Date().toISOString();
    const room: MultiplayerRoom = {
      code,
      hostClientId: input.hostClientId,
      status: 'LOBBY',
      gameMode: input.gameMode === 'FAST' ? 'FAST' : 'SURVIVAL',
      participants: [
        {
          clientId: input.hostClientId,
          name: input.hostName.trim() || 'Host',
          archetypeId: input.archetypeId || 'bambang_umr',
          isHost: true,
          joinedAt: now
        }
      ],
      gameState: null,
      stateVersion: 0,
      createdAt: now,
      updatedAt: now
    };

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): MultiplayerRoom | null {
    return this.rooms.get(code.trim().toUpperCase()) ?? null;
  }

  listOpenRooms(): MultiplayerRoom[] {
    return Array.from(this.rooms.values())
      .filter(room => room.status === 'LOBBY' && room.participants.length < 4)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  joinRoom(
    rawCode: string,
    participant: { clientId: string; name: string; archetypeId: string }
  ): { ok: true; room: MultiplayerRoom } | { ok: false; status: number; error: string } {
    const code = rawCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      return { ok: false, status: 404, error: 'Room tidak ditemukan' };
    }

    const existingIdx = room.participants.findIndex(p => p.clientId === participant.clientId);
    if (existingIdx >= 0) {
      room.participants[existingIdx] = {
        ...room.participants[existingIdx],
        name: participant.name.trim() || room.participants[existingIdx].name,
        archetypeId: participant.archetypeId || room.participants[existingIdx].archetypeId
      };
      room.updatedAt = new Date().toISOString();
      this.broadcast(code, 'ROOM_UPDATED', { room });
      return { ok: true, room };
    }

    if (room.status !== 'LOBBY') {
      return { ok: false, status: 409, error: 'Permainan di room ini sudah dimulai' };
    }
    if (room.participants.length >= 4) {
      return { ok: false, status: 409, error: 'Room sudah penuh (maksimal 4 pemain)' };
    }

    room.participants.push({
      clientId: participant.clientId,
      name: participant.name.trim() || `Pemain ${room.participants.length + 1}`,
      archetypeId: participant.archetypeId || 'bambang_umr',
      isHost: false,
      joinedAt: new Date().toISOString()
    });
    room.updatedAt = new Date().toISOString();

    this.broadcast(code, 'ROOM_UPDATED', { room });
    return { ok: true, room };
  }

  leaveRoom(rawCode: string, clientId: string): MultiplayerRoom | null {
    const code = rawCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return null;

    room.participants = room.participants.filter(p => p.clientId !== clientId);
    if (room.participants.length === 0) {
      this.rooms.delete(code);
      this.subscribers.delete(code);
      return null;
    }

    if (room.hostClientId === clientId) {
      room.hostClientId = room.participants[0].clientId;
      room.participants[0].isHost = true;
    }
    room.updatedAt = new Date().toISOString();
    this.broadcast(code, 'ROOM_UPDATED', { room });
    return room;
  }

  startGame(
    rawCode: string,
    clientId: string,
    initialState: Record<string, unknown>
  ): { ok: true; room: MultiplayerRoom } | { ok: false; status: number; error: string } {
    const code = rawCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return { ok: false, status: 404, error: 'Room tidak ditemukan' };
    if (room.hostClientId !== clientId) {
      return { ok: false, status: 403, error: 'Hanya host yang dapat memulai permainan' };
    }
    if (room.participants.length < 2) {
      return { ok: false, status: 400, error: 'Minimal 2 pemain untuk memulai game online' };
    }

    room.status = 'PLAYING';
    room.gameState = initialState;
    room.stateVersion += 1;
    room.updatedAt = new Date().toISOString();

    this.broadcast(code, 'GAME_STARTED', {
      room,
      stateVersion: room.stateVersion,
      gameState: room.gameState
    });
    return { ok: true, room };
  }

  syncState(
    rawCode: string,
    clientId: string,
    nextState: Record<string, unknown>
  ): { ok: true; stateVersion: number } | { ok: false; status: number; error: string } {
    const code = rawCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return { ok: false, status: 404, error: 'Room tidak ditemukan' };
    const isMember = room.participants.some(p => p.clientId === clientId);
    if (!isMember) {
      return { ok: false, status: 403, error: 'Anda bukan anggota room ini' };
    }

    room.gameState = nextState;
    room.stateVersion += 1;
    room.updatedAt = new Date().toISOString();

    this.broadcast(code, 'STATE_SYNC', {
      senderClientId: clientId,
      stateVersion: room.stateVersion,
      gameState: room.gameState
    });
    return { ok: true, stateVersion: room.stateVersion };
  }

  subscribe(rawCode: string, req: http.IncomingMessage, res: http.ServerResponse): void {
    const code = rawCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Room tidak ditemukan' }));
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    if (!this.subscribers.has(code)) {
      this.subscribers.set(code, new Set());
    }
    this.subscribers.get(code)!.add(res);

    // Kirim snapshot room awal segera setelah terhubung
    res.write(`event: ROOM_UPDATED\ndata: ${JSON.stringify({ room })}\n\n`);

    req.on('close', () => {
      this.subscribers.get(code)?.delete(res);
    });
  }

  private broadcast(code: string, event: RoomEventType, payload: unknown): void {
    const subs = this.subscribers.get(code);
    if (!subs || subs.size === 0) return;

    const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of subs) {
      try {
        res.write(frame);
      } catch {
        subs.delete(res);
      }
    }
  }
}

export const defaultRoomManager = new RoomManager();
