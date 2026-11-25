import { GameMode } from '../types/game';
import { NewGameSnapshotInput, SavedGameSnapshot } from './persistence';

export interface CloudSaveRecord extends SavedGameSnapshot {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudLeaderboardEntry {
  id: string;
  winnerName: string;
  archetypeId: string;
  netWorth: number;
  cash: number;
  cycleRound: number;
  gameMode: GameMode;
  reason: string;
  createdAt: string;
}

export interface CloudApiOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export function getApiBaseUrl(overrideUrl?: string): string {
  if (overrideUrl) return overrideUrl.replace(/\/$/, '');
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  const raw = env?.VITE_API_URL || env?.VITE_AI_PROXY_URL || 'http://localhost:3001';
  return String(raw).replace(/\/$/, '');
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  options: CloudApiOptions = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 2500;
  const fetchFn = options.fetchFn ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchFn(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkBackendHealth(
  options: CloudApiOptions = {}
): Promise<{ online: boolean; mode?: 'mongodb' | 'memory'; dbName?: string }> {
  try {
    const res = await fetchWithTimeout(`${getApiBaseUrl(options.baseUrl)}/api/health`, { method: 'GET' }, options);
    if (!res.ok) return { online: false };
    const data = (await res.json()) as {
      ok?: boolean;
      database?: { mode?: 'mongodb' | 'memory'; dbName?: string };
    };
    return {
      online: Boolean(data.ok),
      mode: data.database?.mode,
      dbName: data.database?.dbName
    };
  } catch {
    return { online: false };
  }
}

export async function listCloudSaves(limit = 5, options: CloudApiOptions = {}): Promise<CloudSaveRecord[]> {
  try {
    const res = await fetchWithTimeout(
      `${getApiBaseUrl(options.baseUrl)}/api/saves?limit=${limit}`,
      { method: 'GET' },
      options
    );
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: CloudSaveRecord[] };
    return Array.isArray(body.data) ? body.data : [];
  } catch {
    return [];
  }
}

export async function saveGameToCloud(
  snapshot: NewGameSnapshotInput,
  title: string,
  existingId?: string | null,
  options: CloudApiOptions = {}
): Promise<CloudSaveRecord | null> {
  try {
    const baseUrl = getApiBaseUrl(options.baseUrl);
    const url = existingId ? `${baseUrl}/api/saves/${encodeURIComponent(existingId)}` : `${baseUrl}/api/saves`;
    const method = existingId ? 'PUT' : 'POST';

    const res = await fetchWithTimeout(
      url,
      {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          ...snapshot,
          version: 1,
          savedAt: new Date().toISOString()
        })
      },
      options
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: CloudSaveRecord };
    return body.data ?? null;
  } catch {
    return null;
  }
}

export async function deleteCloudSave(id: string, options: CloudApiOptions = {}): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${getApiBaseUrl(options.baseUrl)}/api/saves/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      options
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchGlobalLeaderboard(
  gameMode?: GameMode,
  limit = 5,
  options: CloudApiOptions = {}
): Promise<{ entries: CloudLeaderboardEntry[]; online: boolean }> {
  try {
    const query = new URLSearchParams({ limit: String(limit) });
    if (gameMode) query.set('gameMode', gameMode);
    const res = await fetchWithTimeout(
      `${getApiBaseUrl(options.baseUrl)}/api/leaderboard?${query.toString()}`,
      { method: 'GET' },
      options
    );
    if (!res.ok) return { entries: [], online: false };
    const body = (await res.json()) as { data?: CloudLeaderboardEntry[] };
    return {
      entries: Array.isArray(body.data) ? body.data : [],
      online: true
    };
  } catch {
    return { entries: [], online: false };
  }
}

export async function submitLeaderboardScore(
  payload: Omit<CloudLeaderboardEntry, 'id' | 'createdAt'>,
  options: CloudApiOptions = {}
): Promise<CloudLeaderboardEntry | null> {
  try {
    const res = await fetchWithTimeout(
      `${getApiBaseUrl(options.baseUrl)}/api/leaderboard`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      options
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: CloudLeaderboardEntry };
    return body.data ?? null;
  } catch {
    return null;
  }
}
