import { CHARACTER_ARCHETYPES } from '../data/characters';
import { GameMode, Player } from '../types/game';
import { getApiBaseUrl } from './cloudApi';
import { SavedGameSnapshot } from './persistence';

export interface OnlineParticipant {
  clientId: string;
  name: string;
  archetypeId: string;
  isHost: boolean;
  joinedAt: string;
}

export interface OnlineRoom {
  code: string;
  hostClientId: string;
  status: 'LOBBY' | 'PLAYING';
  gameMode: GameMode;
  participants: OnlineParticipant[];
  gameState: SavedGameSnapshot | null;
  stateVersion: number;
  createdAt: string;
  updatedAt: string;
}

const CLIENT_ID_SESSION_KEY = 'monopoli_wni_client_id_v1';

/**
 * Menghasilkan atau mengambil ID klien unik per tab browser agar 2+ tab bisa bermain bersama.
 */
export function getOrCreateClientId(): string {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const existing = window.sessionStorage.getItem(CLIENT_ID_SESSION_KEY);
      if (existing) return existing;
      const created = `client_${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(CLIENT_ID_SESSION_KEY, created);
      return created;
    }
  } catch {
    // Abaikan jika sessionStorage tidak tersedia
  }
  return `client_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Mengubah daftar peserta lobby menjadi objek `Player[]` untuk memulai permainan online.
 */
export function buildOnlinePlayers(participants: OnlineParticipant[]): Player[] {
  return participants.map((p, idx) => {
    const arch =
      CHARACTER_ARCHETYPES.find(a => a.id === p.archetypeId) ||
      CHARACTER_ARCHETYPES[idx % CHARACTER_ARCHETYPES.length];
    return {
      id: p.clientId,
      name: p.name.trim() || `Pemain ${idx + 1}`,
      archetypeId: arch.id,
      isAi: false,
      position: 0,
      cash: arch.startingCash,
      stress: arch.startingStress,
      politicalInfluence: arch.startingInfluence,
      ownedProperties: [],
      inJail: false,
      jailTurnsLeft: 0,
      isInCorruptionRoute: false,
      kpkSuspicionLevel: 10,
      isBankrupt: false,
      specialCards: [],
      konohaBuffs: [],
      color: arch.color,
      avatar: arch.avatar,
      title: arch.title,
      stats: {
        totalRentEarned: 0,
        totalRentPaid: 0,
        totalCorruptionGains: 0,
        cardsDrawn: 0,
        timesInJail: 0
      }
    };
  });
}

export async function createOnlineRoom(input: {
  hostClientId: string;
  hostName: string;
  archetypeId: string;
  gameMode: GameMode;
}): Promise<{ room?: OnlineRoom; error?: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const body = (await res.json()) as { data?: OnlineRoom; error?: string };
    if (!res.ok || !body.data) return { error: body.error || 'Gagal membuat room' };
    return { room: body.data };
  } catch {
    return { error: 'Server backend tidak aktif (jalankan `npm run server`).' };
  }
}

export async function joinOnlineRoom(
  code: string,
  input: { clientId: string; name: string; archetypeId: string }
): Promise<{ room?: OnlineRoom; error?: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/rooms/${encodeURIComponent(code.trim().toUpperCase())}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const body = (await res.json()) as { data?: OnlineRoom; error?: string };
    if (!res.ok || !body.data) return { error: body.error || 'Gagal bergabung ke room' };
    return { room: body.data };
  } catch {
    return { error: 'Server backend tidak aktif (jalankan `npm run server`).' };
  }
}

export async function leaveOnlineRoom(code: string, clientId: string): Promise<void> {
  try {
    await fetch(`${getApiBaseUrl()}/api/rooms/${encodeURIComponent(code)}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId })
    });
  } catch {
    // Abaikan error saat keluar
  }
}

export async function startOnlineRoom(
  code: string,
  clientId: string,
  gameState: SavedGameSnapshot
): Promise<{ room?: OnlineRoom; error?: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/rooms/${encodeURIComponent(code)}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, gameState })
    });
    const body = (await res.json()) as { data?: OnlineRoom; error?: string };
    if (!res.ok || !body.data) return { error: body.error || 'Gagal memulai room' };
    return { room: body.data };
  } catch {
    return { error: 'Gagal menghubungi server untuk memulai permainan' };
  }
}

export async function syncOnlineRoomState(
  code: string,
  clientId: string,
  gameState: SavedGameSnapshot
): Promise<number | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/rooms/${encodeURIComponent(code)}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, gameState })
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { stateVersion?: number };
    return typeof body.stateVersion === 'number' ? body.stateVersion : null;
  } catch {
    return null;
  }
}

export function subscribeToOnlineRoom(
  code: string,
  handlers: {
    onRoomUpdated?: (room: OnlineRoom) => void;
    onGameStarted?: (payload: { room: OnlineRoom; stateVersion: number; gameState: SavedGameSnapshot }) => void;
    onStateSync?: (payload: { senderClientId: string; stateVersion: number; gameState: SavedGameSnapshot }) => void;
  }
): () => void {
  if (typeof EventSource === 'undefined') return () => {};

  const source = new EventSource(`${getApiBaseUrl()}/api/rooms/${encodeURIComponent(code)}/events`);

  source.addEventListener('ROOM_UPDATED', evt => {
    try {
      const parsed = JSON.parse((evt as MessageEvent).data) as { room: OnlineRoom };
      handlers.onRoomUpdated?.(parsed.room);
    } catch {
      // Ignore malformed SSE event
    }
  });

  source.addEventListener('GAME_STARTED', evt => {
    try {
      const parsed = JSON.parse((evt as MessageEvent).data) as {
        room: OnlineRoom;
        stateVersion: number;
        gameState: SavedGameSnapshot;
      };
      handlers.onGameStarted?.(parsed);
    } catch {
      // Ignore malformed SSE event
    }
  });

  source.addEventListener('STATE_SYNC', evt => {
    try {
      const parsed = JSON.parse((evt as MessageEvent).data) as {
        senderClientId: string;
        stateVersion: number;
        gameState: SavedGameSnapshot;
      };
      handlers.onStateSync?.(parsed);
    } catch {
      // Ignore malformed SSE event
    }
  });

  return () => {
    source.close();
  };
}
