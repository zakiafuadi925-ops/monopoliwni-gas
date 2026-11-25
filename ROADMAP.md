# Roadmap Pengembangan — Monopoli WNI Simulator

Roadmap ini disusun bertahap dari pembenahan teknis cepat (*quick wins*), refactoring arsitektur, peningkatan gameplay, hingga ekspansi multiplayer online.

---

## Fase 1: Housekeeping & Fondasi (Prioritas Segera)

Tujuan: Memastikan repositori bersih, konsisten, dan memiliki jaring pengaman dasar sebelum perubahan besar.

- [x] **Verifikasi Environment & Build**
  - Jalankan `bun install` / `npm install` dan pastikan `npm run lint` (`tsc --noEmit`) serta `npm run build` lolos tanpa error.
- [x] **Bersihkan Dead Code & Dependensi**
  - Hapus komponen yang sudah tidak dipakai (`src/components/MusibahModal.tsx`, `src/components/TakdirModal.tsx`).
  - Evaluasi dependensi yang belum digunakan (`express`, `dotenv`, `@google/genai`) serta variabel di `.env.example` agar tidak membingungkan kontributor baru.
- [ ] **Setup Linting & Unit Test**
  - [ ] Tambahkan ESLint untuk menjaga konsistensi kode React/TypeScript.
  - [x] Tambahkan Vitest untuk menguji logika inti (rumus sewa + inflasi, pajak progresif, ambang stres/KPK, dan logika kebangkrutan).

---

## Fase 2: Refactoring Arsitektur & Persistensi

Tujuan: Memecah monolit `src/App.tsx` (3.460 baris) agar mudah dirawat, diuji, dan dikembangkan.

- [x] **Ekstrak Pure Game Engine (`src/engine/`)**
  - [x] Pisahkan logika kalkulasi sewa, likuidasi aset, dan makroekonomi ke `src/engine/economy.ts`.
  - [x] Pisahkan logika keputusan bot AI (`src/engine/ai.ts`) dan kalkulasi koalisi/sita aset Parlemen (`src/engine/politics.ts`) dari komponen UI.
- [x] **Sentralisasi State Management**
  - Pindahkan state permainan inti dari `src/App.tsx` ke `useReducer` + React Context (`src/context/GameContext.tsx`).
- [x] **Auto-Save & Resume Game (`localStorage`)**
  - Simpan snapshot permainan ke `localStorage` (`src/engine/persistence.ts`) dan sediakan opsi *Lanjutkan Sesi Terakhir* di `SetupGameModal`.

---

## Fase 3: Peningkatan Gameplay & UX

Tujuan: Memperdalam strategi permainan dan kenyamanan bermain di berbagai perangkat.

- [x] **Kecerdasan AI & Level Kesulitan**
  - Tambah opsi kepribadian/kesulitan AI (Santai, Agresif, Koruptor) di `SetupGameModal` dan `src/engine/ai.ts` untuk menimbang pembelian properti, Rute Korupsi, dan lobi RUU Parlemen.
- [x] **Negosiasi & Barter Antar Pemain**
  - Fitur tukar/jual-beli properti langsung antar pemain dan lobi kesepakatan suara di Parlemen.
- [x] **Pengaturan Tempo & Mode Cepat**
  - [x] Opsi kecepatan giliran AI (`1x`, `2x`, `Kilat`) di top bar `App.tsx`.
  - [x] *Fast Mode* (15 Putaran) dengan pemenang berdasarkan total kekayaan bersih tertinggi.
- [x] **Onboarding & Responsivitas Mobile**
  - [x] Ringkasan aturan singkat (*Quick Guide*) via `QuickGuideModal`.
  - [x] Penyempurnaan tata letak papan/HUD pada layar ponsel.

---

## Fase 4: Ekspansi Backend, AI Dinamis, & Multiplayer Online

Tujuan: Membuka mode bermain jarak jauh dan konten dinamis berbasis AI.

- [ ] **Multiplayer Online Realtime**
  - Sistem Lobby & Room Code menggunakan Supabase Realtime atau server WebSocket (`express` + `ws` / Socket.IO) dengan validasi giliran di server.
- [x] **Narator & Berita Dinamis Berbasis AI (`@google/genai`)**
  - Backend proxy endpoint (`server/index.ts`, script `npm run server`) untuk menghasilkan *Breaking News* kontekstual via Gemini API tanpa mengekspos API key di klien, dengan fallback otomatis ke template statis.
