import crypto from 'node:crypto';

export interface GameSaveRecord {
  id: string;
  title: string;
  gameMode: 'SURVIVAL' | 'FAST';
  cycleRound: number;
  activePlayerIndex: number;
  players: unknown[];
  perimeterTiles: unknown[];
  corruptionTiles?: unknown[];
  macro: Record<string, unknown>;
  activeLaws?: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardRecord {
  id: string;
  winnerName: string;
  archetypeId: string;
  netWorth: number;
  cash: number;
  cycleRound: number;
  gameMode: 'SURVIVAL' | 'FAST';
  reason: string;
  createdAt: string;
}

export interface DatabaseStatus {
  connected: boolean;
  mode: 'mongodb' | 'memory';
  dbName: string;
}

export interface DatabaseStore {
  getStatus(): DatabaseStatus;
  listSaves(limit?: number): Promise<GameSaveRecord[]>;
  getSaveById(id: string): Promise<GameSaveRecord | null>;
  createSave(input: Omit<GameSaveRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<GameSaveRecord>;
  updateSave(id: string, input: Partial<Omit<GameSaveRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<GameSaveRecord | null>;
  deleteSave(id: string): Promise<boolean>;
  listLeaderboard(options?: { limit?: number; gameMode?: 'SURVIVAL' | 'FAST' }): Promise<LeaderboardRecord[]>;
  addLeaderboardEntry(input: Omit<LeaderboardRecord, 'id' | 'createdAt'>): Promise<LeaderboardRecord>;
  close(): Promise<void>;
}

/**
 * Store in-memory untuk pengujian otomatis & fallback lokal saat MONGODB_URI belum diset.
 */
export class MemoryDatabaseStore implements DatabaseStore {
  private saves = new Map<string, GameSaveRecord>();
  private leaderboard: LeaderboardRecord[] = [];
  private dbName: string;

  constructor(dbName = 'monopoli_wni_memory') {
    this.dbName = dbName;
  }

  getStatus(): DatabaseStatus {
    return {
      connected: true,
      mode: 'memory',
      dbName: this.dbName
    };
  }

  async listSaves(limit = 20): Promise<GameSaveRecord[]> {
    return Array.from(this.saves.values())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }

  async getSaveById(id: string): Promise<GameSaveRecord | null> {
    return this.saves.get(id) ?? null;
  }

  async createSave(
    input: Omit<GameSaveRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<GameSaveRecord> {
    const now = new Date().toISOString();
    const record: GameSaveRecord = {
      ...input,
      id: input.id?.trim() || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    this.saves.set(record.id, record);
    return record;
  }

  async updateSave(
    id: string,
    input: Partial<Omit<GameSaveRecord, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<GameSaveRecord | null> {
    const existing = this.saves.get(id);
    if (!existing) return null;

    const updated: GameSaveRecord = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };
    this.saves.set(id, updated);
    return updated;
  }

  async deleteSave(id: string): Promise<boolean> {
    return this.saves.delete(id);
  }

  async listLeaderboard(options: { limit?: number; gameMode?: 'SURVIVAL' | 'FAST' } = {}): Promise<LeaderboardRecord[]> {
    const limit = options.limit ?? 10;
    return this.leaderboard
      .filter(entry => (!options.gameMode ? true : entry.gameMode === options.gameMode))
      .sort((a, b) => b.netWorth - a.netWorth)
      .slice(0, limit);
  }

  async addLeaderboardEntry(input: Omit<LeaderboardRecord, 'id' | 'createdAt'>): Promise<LeaderboardRecord> {
    const record: LeaderboardRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    this.leaderboard.push(record);
    return record;
  }

  async close(): Promise<void> {
    this.saves.clear();
    this.leaderboard = [];
  }
}

interface MongoCollectionLike<T> {
  find(filter?: Record<string, unknown>): {
    sort(spec: Record<string, 1 | -1>): {
      limit(n: number): { toArray(): Promise<T[]> };
    };
  };
  findOne(filter: Record<string, unknown>): Promise<T | null>;
  insertOne(doc: T): Promise<unknown>;
  findOneAndUpdate(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options: { returnDocument: 'after' }
  ): Promise<T | null>;
  deleteOne(filter: Record<string, unknown>): Promise<{ deletedCount?: number }>;
  createIndex(spec: Record<string, 1 | -1>, options?: Record<string, unknown>): Promise<unknown>;
}

interface MongoDbLike {
  collection<T>(name: string): MongoCollectionLike<T>;
  command(cmd: Record<string, unknown>): Promise<unknown>;
}

interface MongoClientLike {
  connect(): Promise<unknown>;
  db(name: string): MongoDbLike;
  close(): Promise<void>;
}

/**
 * Implementasi DatabaseStore menggunakan driver resmi `mongodb`.
 */
export class MongoDatabaseStore implements DatabaseStore {
  private client: MongoClientLike;
  private db: MongoDbLike;
  private dbName: string;

  constructor(client: MongoClientLike, dbName: string) {
    this.client = client;
    this.dbName = dbName;
    this.db = client.db(dbName);
  }

  async initIndexes(): Promise<void> {
    const saves = this.db.collection<GameSaveRecord>('saves');
    const leaderboard = this.db.collection<LeaderboardRecord>('leaderboard');
    await saves.createIndex({ id: 1 }, { unique: true });
    await saves.createIndex({ updatedAt: -1 });
    await leaderboard.createIndex({ netWorth: -1 });
  }

  getStatus(): DatabaseStatus {
    return {
      connected: true,
      mode: 'mongodb',
      dbName: this.dbName
    };
  }

  async listSaves(limit = 20): Promise<GameSaveRecord[]> {
    const rows = await this.db
      .collection<GameSaveRecord>('saves')
      .find({})
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
    return rows.map(stripMongoId);
  }

  async getSaveById(id: string): Promise<GameSaveRecord | null> {
    const row = await this.db.collection<GameSaveRecord>('saves').findOne({ id });
    return row ? stripMongoId(row) : null;
  }

  async createSave(
    input: Omit<GameSaveRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<GameSaveRecord> {
    const now = new Date().toISOString();
    const record: GameSaveRecord = {
      ...input,
      id: input.id?.trim() || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await this.db.collection<GameSaveRecord>('saves').insertOne({ ...record });
    return record;
  }

  async updateSave(
    id: string,
    input: Partial<Omit<GameSaveRecord, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<GameSaveRecord | null> {
    const updated = await this.db
      .collection<GameSaveRecord>('saves')
      .findOneAndUpdate(
        { id },
        {
          $set: {
            ...input,
            updatedAt: new Date().toISOString()
          }
        },
        { returnDocument: 'after' }
      );
    return updated ? stripMongoId(updated) : null;
  }

  async deleteSave(id: string): Promise<boolean> {
    const result = await this.db.collection<GameSaveRecord>('saves').deleteOne({ id });
    return (result.deletedCount ?? 0) > 0;
  }

  async listLeaderboard(options: { limit?: number; gameMode?: 'SURVIVAL' | 'FAST' } = {}): Promise<LeaderboardRecord[]> {
    const filter: Record<string, unknown> = options.gameMode ? { gameMode: options.gameMode } : {};
    const rows = await this.db
      .collection<LeaderboardRecord>('leaderboard')
      .find(filter)
      .sort({ netWorth: -1 })
      .limit(options.limit ?? 10)
      .toArray();
    return rows.map(stripMongoId);
  }

  async addLeaderboardEntry(input: Omit<LeaderboardRecord, 'id' | 'createdAt'>): Promise<LeaderboardRecord> {
    const record: LeaderboardRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    await this.db.collection<LeaderboardRecord>('leaderboard').insertOne({ ...record });
    return record;
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

function stripMongoId<T extends object>(doc: T): T {
  const clone = { ...(doc as Record<string, unknown>) };
  delete clone._id;
  return clone as T;
}

/**
 * Menghubungkan ke MongoDB jika `MONGODB_URI` tersedia dan driver `mongodb` terpasang;
 * jika tidak, fallback ke `MemoryDatabaseStore` agar API tetap siap dicoba secara lokal.
 */
export async function connectDatabase(): Promise<DatabaseStore> {
  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'monopoli_wni';

  if (!uri) {
    console.warn('[DB] MONGODB_URI belum diset — memakai penyimpanan in-memory sementara.');
    return new MemoryDatabaseStore(dbName);
  }

  try {
    const driverPackage = 'mongodb';
    const mongoModule = (await import(driverPackage)) as {
      MongoClient: new (connectionUri: string) => MongoClientLike;
    };
    const client = new mongoModule.MongoClient(uri);
    await client.connect();
    await client.db(dbName).command({ ping: 1 });

    const store = new MongoDatabaseStore(client, dbName);
    await store.initIndexes();
    console.log(`[DB] Terhubung ke MongoDB (database: ${dbName})`);
    return store;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[DB] Gagal terhubung ke MongoDB (${msg}) — fallback ke penyimpanan in-memory.`);
    return new MemoryDatabaseStore(dbName);
  }
}

const globalForDb = globalThis as typeof globalThis & {
  __monopoliWniDbPromise?: Promise<DatabaseStore>;
};

/**
 * Mengembalikan instance DatabaseStore yang di-cache antar pemanggilan serverless (Vercel).
 */
export function getCachedDatabase(): Promise<DatabaseStore> {
  if (!globalForDb.__monopoliWniDbPromise) {
    globalForDb.__monopoliWniDbPromise = connectDatabase().catch(err => {
      globalForDb.__monopoliWniDbPromise = undefined;
      throw err;
    });
  }
  return globalForDb.__monopoliWniDbPromise;
}
