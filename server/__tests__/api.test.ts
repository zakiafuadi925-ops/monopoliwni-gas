import http from 'node:http';
import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryDatabaseStore } from '../db';
import { handleApiRequest } from '../routes';
import { RoomManager } from '../rooms';

async function startTestServer() {
  const store = new MemoryDatabaseStore('test_db');
  const roomManager = new RoomManager();
  const server = http.createServer((req, res) => {
    void handleApiRequest(req, res, store, { geminiApiKey: '', roomManager });
  });

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
  const { port } = server.address() as AddressInfo;
  return {
    store,
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()));
      })
  };
}

describe('RESTful API routes', () => {
  let activeClose: (() => Promise<void>) | null = null;

  afterEach(async () => {
    if (activeClose) {
      await activeClose();
      activeClose = null;
    }
  });

  it('returns database status on GET /api/health', async () => {
    const srv = await startTestServer();
    activeClose = srv.close;

    const res = await fetch(`${srv.baseUrl}/api/health`);
    const body = (await res.json()) as { ok: boolean; database: { mode: string; connected: boolean } };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.database.connected).toBe(true);
    expect(body.database.mode).toBe('memory');
  });

  it('supports full CRUD lifecycle on /api/saves', async () => {
    const srv = await startTestServer();
    activeClose = srv.close;

    // 1. Create
    const createRes = await fetch(`${srv.baseUrl}/api/saves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Sesi Malam Minggu',
        gameMode: 'FAST',
        cycleRound: 4,
        activePlayerIndex: 1,
        players: [{ id: 'p1', name: 'Bambang' }],
        perimeterTiles: [{ id: 0, name: 'START' }],
        macro: { inflationRate: 5.5 }
      })
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { data: { id: string; title: string; cycleRound: number } };
    const saveId = created.data.id;
    expect(created.data.title).toBe('Sesi Malam Minggu');

    // 2. List
    const listRes = await fetch(`${srv.baseUrl}/api/saves`);
    const listBody = (await listRes.json()) as { data: unknown[]; count: number };
    expect(listRes.status).toBe(200);
    expect(listBody.count).toBe(1);

    // 3. Get by ID
    const getRes = await fetch(`${srv.baseUrl}/api/saves/${saveId}`);
    expect(getRes.status).toBe(200);

    // 4. Update
    const putRes = await fetch(`${srv.baseUrl}/api/saves/${saveId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycleRound: 9, title: 'Sesi Update' })
    });
    const updated = (await putRes.json()) as { data: { cycleRound: number; title: string } };
    expect(putRes.status).toBe(200);
    expect(updated.data.cycleRound).toBe(9);
    expect(updated.data.title).toBe('Sesi Update');

    // 5. Delete
    const delRes = await fetch(`${srv.baseUrl}/api/saves/${saveId}`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);

    const missingRes = await fetch(`${srv.baseUrl}/api/saves/${saveId}`);
    expect(missingRes.status).toBe(404);
  });

  it('validates required fields on POST /api/saves and handles /api/leaderboard', async () => {
    const srv = await startTestServer();
    activeClose = srv.close;

    const badSave = await fetch(`${srv.baseUrl}/api/saves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Kosong' })
    });
    expect(badSave.status).toBe(400);

    await fetch(`${srv.baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winnerName: 'Kevin Sultan',
        archetypeId: 'kevin_sultan',
        netWorth: 250_000_000,
        cash: 120_000_000,
        cycleRound: 15,
        gameMode: 'FAST',
        reason: 'Mode Cepat selesai'
      })
    });

    await fetch(`${srv.baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winnerName: 'Bambang UMR',
        archetypeId: 'bambang_umr',
        netWorth: 310_000_000,
        cash: 180_000_000,
        cycleRound: 22,
        gameMode: 'SURVIVAL',
        reason: 'Penyintas terakhir'
      })
    });

    const lbRes = await fetch(`${srv.baseUrl}/api/leaderboard?gameMode=FAST`);
    const lbBody = (await lbRes.json()) as { data: Array<{ winnerName: string }>; count: number };
    expect(lbRes.status).toBe(200);
    expect(lbBody.count).toBe(1);
    expect(lbBody.data[0].winnerName).toBe('Kevin Sultan');
  });

  it('supports multiplayer room create, join, start, sync, and leave lifecycle', async () => {
    const srv = await startTestServer();
    activeClose = srv.close;

    const createRes = await fetch(`${srv.baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostClientId: 'c1',
        hostName: 'HostSatu',
        archetypeId: 'bambang_umr',
        gameMode: 'FAST'
      })
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { data: { code: string; participants: unknown[] } };
    const code = created.data.code;
    expect(created.data.participants).toHaveLength(1);

    const joinRes = await fetch(`${srv.baseUrl}/api/rooms/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'c2',
        name: 'TamuDua',
        archetypeId: 'kevin_sultan'
      })
    });
    expect(joinRes.status).toBe(200);
    const joined = (await joinRes.json()) as { data: { participants: unknown[] } };
    expect(joined.data.participants).toHaveLength(2);

    const startRes = await fetch(`${srv.baseUrl}/api/rooms/${code}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'c1',
        gameState: { cycleRound: 1, activePlayerIndex: 0 }
      })
    });
    expect(startRes.status).toBe(200);

    const syncRes = await fetch(`${srv.baseUrl}/api/rooms/${code}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'c1',
        gameState: { cycleRound: 1, activePlayerIndex: 1 }
      })
    });
    const syncBody = (await syncRes.json()) as { stateVersion: number };
    expect(syncRes.status).toBe(200);
    expect(syncBody.stateVersion).toBe(2);

    const leaveRes = await fetch(`${srv.baseUrl}/api/rooms/${code}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: 'c2' })
    });
    expect(leaveRes.status).toBe(200);
  });
});
