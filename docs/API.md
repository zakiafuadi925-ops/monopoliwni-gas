# Dokumentasi REST & Realtime API

Dokumentasi kontrak API backend pada `server/` ([server/routes.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/server/routes.ts)) untuk integrasi frontend ([src/engine/cloudApi.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/engine/cloudApi.ts), [src/engine/multiplayer.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/engine/multiplayer.ts), [src/engine/narrator.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/engine/narrator.ts)).

- **Base URL lokal:** `http://localhost:3001` (dijalankan dengan `npm run server`).
- **Mode Database:** MongoDB bila `MONGODB_URI` tersedia, otomatis fallback ke **in-memory** (`dbName: "monopoli_wni"`) bila tidak dikonfigurasi.
- **CORS & Preflight:** Semua `OPTIONS` mengembalikan `204 No Content`.

---

## 1. Health & Info (`server/routes/health.ts`)

### `GET /api/health`
Memeriksa status server, ketersediaan AI Gemini, dan status database.

**Respons `200 OK`:**
```json
{
  "ok": true,
  "aiEnabled": false,
  "model": "gemini-2.5-flash",
  "database": {
    "connected": true,
    "mode": "memory",
    "dbName": "monopoli_wni"
  }
}
```

### `GET /`
Menampilkan metadata API dan daftar endpoint (saat `dist/` belum di-build; jika `dist/` tersedia, rute non-`/api/*` menyajikan SPA frontend).

---

## 2. Cloud Saves (`server/routes/saves.ts`)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/saves?limit=20` | Daftar sesi tersimpan (maksimal `limit=100`). |
| `POST` | `/api/saves` | Membuat simpanan sesi baru. |
| `GET` | `/api/saves/:id` | Mengambil detail simpanan berdasarkan ID. |
| `PUT` | `/api/saves/:id` | Memperbarui simpanan yang sudah ada. |
| `DELETE` | `/api/saves/:id` | Menghapus simpanan berdasarkan ID. |

**Field Wajib `POST /api/saves`:**
- `players` (`array`)
- `perimeterTiles` (`array`)
- `macro` (`object`)
- Opsional: `id`, `title` (default `"Sesi Monopoli WNI"`), `gameMode` (`"SURVIVAL" | "FAST"`), `cycleRound`, `activePlayerIndex`, `corruptionTiles`, `activeLaws`.

**Respons Error:** `400 Bad Request` bila payload tidak valid, `404 Not Found` bila ID tidak ditemukan.

---

## 3. Multiplayer Rooms & SSE (`server/routes/rooms.ts`)

Manajemen lobi multiplayer online dan sinkronisasi state berbasis **Server-Sent Events (SSE)**.

### Daftar & Buat Room
- **`GET /api/rooms`** — Mengembalikan daftar room terbuka (`{ data: Room[], count: number }`).
- **`POST /api/rooms`** — Membuat room baru.
  - Body wajib: `hostClientId` (`string`).
  - Opsional: `hostName` (`string`, default `"Host"`), `archetypeId` (`string`, default `"bambang_umr"`), `gameMode` (`"SURVIVAL" | "FAST"`).
  - Respons: `201 Created` (`{ data: room }`).

### Detail & Aksi Room
- **`GET /api/rooms/:code`** — Mengambil status room (`404` jika tidak ditemukan).
- **`POST /api/rooms/:code/join`** — Bergabung ke room.
  - Body wajib: `clientId`, opsional `name`, `archetypeId`.
- **`POST /api/rooms/:code/leave`** — Keluar dari room (`{ left: true, data: room }`).
- **`POST /api/rooms/:code/start`** — Memulai permainan (hanya host).
  - Body wajib: `clientId`, opsional `gameState` (`object`).
- **`POST /api/rooms/:code/sync`** — Menyinkronkan state terbaru permainan.
  - Body wajib: `clientId`, `gameState` (`object`).
  - Respons: `200 OK` (`{ stateVersion: number }`).

### Realtime Event Stream
- **`GET /api/rooms/:code/events`** — Membuka stream SSE (`text/event-stream`) untuk menerima pembaruan lobi, mulai game, dan `state_sync` (`stateVersion`, `senderClientId`, `gameState`).

---

## 4. Leaderboard (`server/routes/leaderboard.ts`)

- **`GET /api/leaderboard?limit=10&gameMode=SURVIVAL`** — Daftar pemenang (opsional filter `gameMode`: `FAST` | `SURVIVAL`, `limit` maksimal `100`).
- **`POST /api/leaderboard`** — Mencatat pemenang baru.
  - Body wajib: `winnerName` (`string`), `netWorth` (`number`).
  - Opsional: `archetypeId`, `cash`, `cycleRound`, `gameMode`, `reason`.

---

## 5. AI Breaking News Narrator (`server/routes/narrator.ts`)

- **`POST /api/breaking-news`** — Menghasilkan berita satir ekonomi-politik via Gemini API (`GEMINI_API_KEY`).
  - Respons `200 OK`: `{ id, headline, detail, impactType, impactSummary }` dengan `impactType` salah satu dari `INFLATION`, `TAX`, `CORRUPTION_CRACKDOWN`, `SUBSIDY_CUT`.
  - Respons `503 Service Unavailable`: `{ error, fallback: true }` jika `GEMINI_API_KEY` belum dikonfigurasi (klien otomatis memakai template lokal `BREAKING_NEWS_TEMPLATES`).
  - Respons `502 Bad Gateway`: `{ error, fallback: true }` jika pemanggilan Gemini gagal.
