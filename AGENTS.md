# AGENTS.md

Panduan teknis dan batasan kerja bagi AI coding agent maupun developer yang bekerja di repositori **Monopoli WNI Simulator**.

## 1. Gambaran Cepat Stack

- **Framework:** React 19 + TypeScript (bukan Svelte; abaikan referensi lama jika masih tersisa di luar dokumen utama).
- **Bundler & CSS:** Vite 8 + Tailwind CSS v4 (`@tailwindcss/vite`, di-import via `@import "tailwindcss";` di `src/index.css`).
- **Entry Point:** `src/main.tsx` me-render `src/App.tsx`.
- **Bahasa UI & Konten:** Seluruh teks UI, narasi kartu, log permainan, dan komentar domain menggunakan **Bahasa Indonesia** dengan gaya satir ekonomi-politik Indonesia.
- **Mata Uang:** Gunakan helper `formatRupiah` dan `formatRupiahShort` dari `src/utils/format.ts` untuk seluruh nilai IDR.

## 2. Aturan & Batasan Penting

1. **Jangan Ubah Konfigurasi HMR di `vite.config.ts`:**
   - Baris `hmr: process.env.DISABLE_HMR !== 'true'` dan `watch` di `vite.config.ts` sengaja disiapkan untuk lingkungan AI Studio agar tidak memicu flickering saat edit. Pertahankan blok ini.
2. **Waspadai Ukuran `src/App.tsx`:**
   - `src/App.tsx` saat ini berukuran ~3.460 baris dan menampung seluruh game state, efek AI, dan handler modal.
   - Saat membaca `src/App.tsx`, gunakan pencarian terarah (`grep`/`rg`) dan baca per rentang baris yang relevan saja, jangan baca seluruh file sekaligus jika tidak perlu.
   - Saat menambah fitur baru yang cukup besar, usahakan mengekstrak logika murni ke modul/helper terpisah (`src/utils/` atau `src/engine/`) daripada memperbesar `App.tsx` lebih jauh.
3. **Audio Tanpa Aset Eksternal:**
   - Semua efek suara dan ambien berasal dari Web Audio API di `src/utils/sound.ts` (`soundManager`). Jangan mengasumsikan adanya file `.mp3`/`.wav` di `public/`.
4. **Komponen Legacy / Belum Terpakai:**
   - `src/components/MusibahModal.tsx` dan `src/components/TakdirModal.tsx` saat ini tidak di-import di `App.tsx` (sudah digantikan oleh `src/components/DrawCardModal.tsx`). Jangan edit file tersebut dengan asumsi aktif di UI tanpa memeriksa import-nya terlebih dahulu.
5. **Dependensi Backend yang Belum Aktif:**
   - `express`, `dotenv`, dan `@google/genai` ada di `package.json`, dan variabel Supabase ada di `.env.example`, tetapi belum ada server atau integrasi API yang berjalan di `src/`. Semua logika game saat ini berjalan 100% di sisi klien.

## 3. Verifikasi & Perintah Penting

- Typecheck: `npm run lint` (menjalankan `tsc --noEmit`) atau `bun run lint`
- Build produksi: `npm run build` (`vite build`)
- Dev server: `npm run dev` (`vite --port=3000 --host=0.0.0.0`)

Selalu jalankan `tsc --noEmit` (dan `vite build` bila mengubah konfigurasi/import) setelah melakukan perubahan kode.
