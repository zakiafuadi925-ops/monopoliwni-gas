# AGENTS.md

Panduan teknis dan batasan kerja bagi AI coding agent maupun developer yang bekerja di repositori **Monopoli WNI Simulator**.

## 1. Gambaran Cepat Stack

- **Framework:** React 19 + TypeScript (bukan Svelte; abaikan referensi lama jika masih tersisa di luar dokumen utama).
- **Bundler & CSS:** Vite 8 + Tailwind CSS v4 (`@tailwindcss/vite`, di-import via `@import "tailwindcss";` di `src/index.css`).
- **Entry Point:** `src/main.tsx` me-render `src/App.tsx` (wrapper `GameProvider` + `GameContent`).
- **Backend API:** Express (`server/index.ts`, `server/routes.ts`) dengan penyimpanan in-memory dan dukungan opsional MongoDB serta Gemini API (`@google/genai`).
- **Bahasa UI & Konten:** Seluruh teks UI, narasi kartu, log permainan, dan komentar domain menggunakan **Bahasa Indonesia** dengan gaya satir ekonomi-politik Indonesia.
- **Mata Uang:** Gunakan helper `formatRupiah` dan `formatRupiahShort` dari `src/utils/format.ts` untuk seluruh nilai IDR.

## 2. Aturan & Batasan Penting

1. **Jangan Ubah Konfigurasi HMR di `vite.config.ts`:**
   - Baris `hmr: process.env.DISABLE_HMR !== 'true'` dan `watch` di `vite.config.ts` sengaja disiapkan untuk lingkungan AI Studio agar tidak memicu flickering saat edit. Pertahankan blok ini.
2. **Jaga Struktur Modular (`GameContent.tsx`, `src/hooks/`, `src/engine/`):**
   - `src/App.tsx` hanya berisi root wrapper (`GameProvider` + `GameContent`), sedangkan orkestrasi layout ada di `src/components/GameContent.tsx` dan orkestrasi modal ada di `src/components/GameModals.tsx`.
   - Saat menambah fitur baru, tempatkan logika bisnis murni di `src/engine/`, state/efek giliran di `src/hooks/`, dan komponen UI di `src/components/` daripada memperbesar `GameContent.tsx`.
3. **Audio Tanpa Aset Eksternal:**
   - Semua efek suara dan ambien berasal dari Web Audio API di `src/utils/sound.ts` (`soundManager`). Jangan mengasumsikan adanya file `.mp3`/`.wav` di `public/`.
4. **Komponen Legacy / Belum Terpakai:**
   - `src/components/MusibahModal.tsx` dan `src/components/TakdirModal.tsx` saat ini tidak di-import di aplikasi (sudah digantikan oleh `src/components/DrawCardModal.tsx`). Jangan edit file tersebut dengan asumsi aktif di UI tanpa memeriksa import-nya terlebih dahulu.
5. **Integrasi Backend & Fallback Offline:**
   - Backend API berada di `server/` dan dijalankan terpisah dengan `npm run server`. Jika MongoDB atau API key Gemini tidak dikonfigurasi, server otomatis memakai penyimpanan in-memory dan klien tetap dapat berjalan penuh secara offline/lokal.

## 3. Verifikasi & Perintah Penting

- Typecheck: `npm run lint` (menjalankan `tsc --noEmit`)
- Unit & API test: `npm test` (menjalankan `vitest run`)
- Build produksi: `npm run build` (`vite build`)
- Dev server frontend: `npm run dev` (`vite --port=3000 --host=0.0.0.0`)
- Server API & multiplayer: `npm run server` (`tsx server/index.ts`)

Selalu jalankan `npm run lint`, `npm test`, dan `npm run build` setelah melakukan perubahan kode.

6. **Batasan Ketat Logika Murni vs. State & UI:**
   - Kalkulasi deterministik (sewa, pajak, efek kartu, kalkulasi makroekonomi, penalti/risiko KPK, aturan giliran murni) wajib berada di `src/engine/` agar mudah diuji dengan Vitest.
   - `src/hooks/` hanya mengelola lifecycle state, sinkronisasi efek, dan pemanggilan engine/API—bukan menumpuk rumus bisnis panjang.
   - Jangan meletakkan logika bisnis atau fetch langsung di dalam komponen presentasi.

7. **Dilarang Menulis _Slop_, _Placeholder_, atau Duplikasi:**
   - Dilarang meninggalkan komentar `TODO`/`FIXME` kosong, fungsi stub/mock palsu di jalur produksi, atau `any` yang menutupi error tipe (`tsc --noEmit` harus bersih tanpa shortcut tipe).
   - Sebelum membuat komponen, hook, atau helper baru, periksa dulu apakah modul yang setara sudah ada di `src/components/`, `src/hooks/`, `src/engine/`, atau `src/utils/`.
   - Pertahankan satir ekonomi-politik yang tajam dan ringkas—hindari teks bertele-tele, klise berlebihan, atau mengubah nama/karakter domain yang sudah ada.

8. **Jaga _Graceful Fallback_ Saat Backend/API Absen:**
   - Setiap fitur yang menyentuh `server/index.ts`, `server/routes.ts`, MongoDB, atau Gemini API wajib tetap aman ketika layanan eksternal tidak tersedia atau env var belum disetel.
   - Jangan mengekspos secret/API key ke sisi klien (`src/`).
