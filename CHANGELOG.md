# Changelog — Monopoli WNI Simulator

Seluruh perubahan penting pada proyek **Monopoli WNI Simulator** dicatat di dokumen ini.

---

## [Unreleased] — Fase 1 s/d Fase 4

### Ditambahkan
- **Multiplayer Online Realtime (`server/rooms.ts`, `src/engine/multiplayer.ts`, `src/components/MultiplayerLobbyModal.tsx`):**
  - Sistem Lobby & Room Code 6 karakter untuk 2–4 pemain lintas tab/perangkat.
  - Sinkronisasi state realtime menggunakan Server-Sent Events (SSE) dan endpoint `/api/rooms`.
  - Tombol **Main Online** di `SetupGameModal`, badge `Room {kode}` di header, serta banner penunggu giliran di `App.tsx`.
- **Backend RESTful API & MongoDB (`server/db.ts`, `server/routes.ts`, `server/index.ts`):**
  - Endpoint RESTful untuk Cloud Save (`/api/saves`), Global Leaderboard (`/api/leaderboard`), Health Check (`/api/health`), dan AI Breaking News (`/api/breaking-news`).
  - Dukungan driver resmi `mongodb` dengan fallback otomatis ke penyimpanan in-memory bila `MONGODB_URI` belum dikonfigurasi.
  - Integrasi UI **Simpan Cloud** di header, **Simpanan Cloud** di `SetupGameModal`, dan **Peringkat Global** di `GameOverModal` (`src/engine/cloudApi.ts`).
- **AI Narator Berita Dinamis (`src/engine/narrator.ts`):**
  - Menghasilkan *Breaking News* kontekstual menggunakan Gemini API (`gemini-2.5-flash`) via backend proxy tanpa mengekspos API key di klien, dengan fallback otomatis ke template statis.
- **Konten Gameplay & Event Nasional Musiman (`src/engine/seasonalEvents.ts`):**
  - Event musiman otomatis pada bulan tertentu (Lapor SPT Maret, Mudik & THR April, HUT RI Agustus, Tahun Politik November, Tutup Buku APBN Desember).
  - Penambahan kartu Musibah, Takdir, Dilema, Breaking News, serta properti mewah pencucian uang (Balikpapan & Kendari).
- **Gameplay & UX Fase 3:**
  - Kepribadian/kesulitan AI (`SANTAI`, `AGRESIF`, `KORUPTOR`) dan kontrol kecepatan giliran (`1x`, `2x`, `Kilat`).
  - *Fast Mode* (15 putaran dengan pemenang berdasarkan kekayaan bersih tertinggi).
  - Meja negosiasi **Barter Properti** antar pemain (`src/engine/trade.ts`, `src/components/TradeModal.tsx`).
  - Panduan singkat (`QuickGuideModal`) dan penyempurnaan responsivitas mobile.
- **Arsitektur & Persistensi Fase 2:**
  - Ekstraksi modul engine murni: `src/engine/economy.ts`, `src/engine/ai.ts`, `src/engine/politics.ts`, `src/engine/persistence.ts`.
  - Sentralisasi state melalui `useReducer` + Context (`src/context/GameContext.tsx`).
  - Auto-save & *Lanjutkan Sesi Terakhir* via `localStorage`.
- **Pengujian & Fondasi Fase 1:**
  - Setup Vitest (`npm test`) dengan 10 file pengujian (46 unit & API integration tests).
  - Dokumentasi inti: `AGENTS.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `DEPLOYMENT.md`.

### Diubah & Dihapus
- Mengaktifkan TypeScript `"strict": true` dan `"noFallthroughCasesInSwitch": true` di `tsconfig.json`.
- Menghapus komponen legacy tidak terpakai (`MusibahModal.tsx`, `TakdirModal.tsx`) dan membersihkan dependensi tidak terpakai di `package.json`.
- Menambahkan `react-is` untuk kompatibilitas bundling Recharts di Vite 8 / Rolldown.
