# Roadmap Pengembangan — Monopoli WNI Simulator

Roadmap ini disusun bertahap dari pembenahan teknis cepat (*quick wins*), refactoring arsitektur, peningkatan gameplay, hingga ekspansi multiplayer online.

---

## Fase 1: Housekeeping & Fondasi (Prioritas Segera)

Tujuan: Memastikan repositori bersih, konsisten, dan memiliki jaring pengaman dasar sebelum perubahan besar.

- [ ] **Verifikasi Environment & Build**
  - Jalankan `bun install` / `npm install` dan pastikan `npm run lint` (`tsc --noEmit`) serta `npm run build` lolos tanpa error.
- [ ] **Bersihkan Dead Code & Dependensi**
  - Hapus komponen yang sudah tidak dipakai (`src/components/MusibahModal.tsx`, `src/components/TakdirModal.tsx`).
  - Evaluasi dependensi yang belum digunakan (`express`, `dotenv`, `@google/genai`) serta variabel di `.env.example` agar tidak membingungkan kontributor baru.
- [ ] **Setup Linting & Unit Test**
  - Tambahkan ESLint untuk menjaga konsistensi kode React/TypeScript.
  - Tambahkan Vitest untuk menguji logika inti (rumus sewa + inflasi, pajak progresif, ambang stres/KPK, dan logika kebangkrutan).

---

## Fase 2: Refactoring Arsitektur & Persistensi

Tujuan: Memecah monolit `src/App.tsx` (3.460 baris) agar mudah dirawat, diuji, dan dikembangkan.

- [ ] **Ekstrak Pure Game Engine (`src/engine/`)**
  - Pisahkan logika kalkulasi sewa, makroekonomi, resolusi kartu, efek RUU parlemen, dan keputusan bot AI dari komponen UI ke fungsi murni yang mudah di-unit test.
- [ ] **Sentralisasi State Management**
  - Pindahkan state permainan dari `src/App.tsx` ke `useReducer` + React Context atau Zustand store.
- [ ] **Auto-Save & Resume Game (`localStorage`)**
  - Simpan snapshot permainan setiap akhir giliran ke `localStorage` sehingga pemain dapat melanjutkan sesi setelah refresh atau menutup tab.

---

## Fase 3: Peningkatan Gameplay & UX

Tujuan: Memperdalam strategi permainan dan kenyamanan bermain di berbagai perangkat.

- [ ] **Kecerdasan AI & Level Kesulitan**
  - Tambah opsi kepribadian/kesulitan AI (Santai, Agresif, Oportunis Koruptor) sehingga AI bisa menimbang risiko masuk Rute Korupsi, melobi RUU koalisi, dan mencuci uang secara lebih strategis.
- [ ] **Negosiasi & Barter Antar Pemain**
  - Fitur tukar/jual-beli properti langsung antar pemain dan lobi kesepakatan suara di Parlemen.
- [ ] **Pengaturan Tempo & Mode Cepat**
  - Opsi kecepatan animasi & giliran AI (`1x`, `2x`, `Skip`), serta *Fast Mode* dengan batas putaran/target kekayaan lebih singkat.
- [ ] **Onboarding & Responsivitas Mobile**
  - Ringkasan aturan singkat (*Quick Guide*) untuk pemain baru dan penyempurnaan tata letak papan/HUD pada layar ponsel.

---

## Fase 4: Ekspansi Backend, AI Dinamis, & Multiplayer Online

Tujuan: Membuka mode bermain jarak jauh dan konten dinamis berbasis AI.

- [ ] **Multiplayer Online Realtime**
  - Sistem Lobby & Room Code menggunakan Supabase Realtime atau server WebSocket (`express` + `ws` / Socket.IO) dengan validasi giliran di server.
- [ ] **Narator & Berita Dinamis Berbasis AI (`@google/genai`)**
  - Backend proxy endpoint untuk menghasilkan *Breaking News* dan komentar satir kontekstual sesuai kondisi papan dan pemain tanpa mengekspos API key di klien.
