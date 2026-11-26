---
name: monopoli-wni-dev
description: >-
  Panduan prosedur pengembangan, modularisasi, dan verifikasi untuk proyek
  Monopoli WNI Simulator (React 19 + TypeScript + Vite 8 + Express API).
  Gunakan skill ini saat menambah fitur game, memodifikasi hook/engine/komponen UI,
  mengubah endpoint multiplayer, atau memverifikasi perubahan di repositori ini.
---

# Monopoli WNI Simulator — Workflow Pengembangan

Gunakan prosedur ini setiap kali menambah fitur, memperbaiki bug, atau melakukan refactoring pada repositori **Monopoli WNI Simulator**.

## 1. Peta Arsitektur Modular

- **Entry & Shell:** `src/App.tsx` hanya merender `GameProvider` dan `GameContent` (`src/components/GameContent.tsx`).
- **State Global:** `src/context/GameContext.tsx` menyimpan state utama permainan (`players`, `macro`, `perimeterTiles`, `activeLaws`, `cycleRound`, `logs`, dll.).
- **Domain Engine (Fungsi Murni & Testable):** `src/engine/`
  - `economy.ts`, `politics.ts`, `ai.ts`, `trade.ts`, `seasonalEvents.ts`, `narrator.ts`, `persistence.ts`, `cloudApi.ts`, `multiplayer.ts`.
  - Selalu tempatkan kalkulasi aturan main baru di `src/engine/` sebagai fungsi murni sebelum menghubungkannya ke UI/hook.
- **Custom Hooks:** `src/hooks/`
  - `usePersistenceAndMultiplayer.ts`, `useGameLifecycle.ts`, `useBoardMovement.ts`, `usePropertyAndRent.ts`, `useCardEvents.ts`, `useCorruptionAndJail.ts`, `usePoliticsAndTurn.ts`, `useAiAutomation.ts`.
- **Komponen UI & Mobile:** `src/components/`
  - Layout responsif desktop/mobile: `GameHeader.tsx`, `GameNoticesBanner.tsx`, `LiveStandingsCard.tsx`, `MobileActionDock.tsx`, `GameModals.tsx`.
- **Backend API & Multiplayer:** `server/` (`index.ts`, `routes.ts`, `db.ts`, `rooms.ts`, `utils/http.ts`).

## 2. Aturan Proyek yang Wajib Dipatuhi

1. **Bahasa & Mata Uang:**
   - Seluruh teks UI, narasi kartu, log permainan, dan pesan error menggunakan **Bahasa Indonesia** bergaya satir ekonomi-politik Indonesia.
   - Gunakan `formatRupiah` dan `formatRupiahShort` dari `src/utils/format.ts` untuk seluruh nilai IDR.
2. **Audio:**
   - Efek suara dan ambien dikelola melalui `soundManager` (`src/utils/sound.ts`) berbasis Web Audio API (tanpa file `.mp3`/`.wav` eksternal).
3. **Konfigurasi Vite:**
   - Jangan ubah blok `hmr: process.env.DISABLE_HMR !== 'true'` dan konfigurasi `watch` di `vite.config.ts`.
4. **Komponen Legacy:**
   - `src/components/MusibahModal.tsx` dan `src/components/TakdirModal.tsx` tidak aktif di UI (digantikan oleh `src/components/DrawCardModal.tsx`). Pastikan import sebelum menyentuhnya.

## 3. Langkah Kerja Perubahan Fitur

1. **Temukan modul terkait** sesuai peta arsitektur di atas (hindari menumpuk logika baru di `GameContent.tsx` jika bisa masuk ke `src/engine/` atau `src/hooks/`).
2. **Tambahkan unit test** di `src/engine/__tests__/`, `src/context/__tests__/`, `src/utils/__tests__/`, atau `server/__tests__/` bila menambah/mengubah logika murni atau endpoint API.
3. **Pastikan UI responsif mobile & desktop** bila menyentuh tampilan (periksa tampilan di `lg:hidden` vs `lg:` seperti pada `GameHeader.tsx` dan `MobileActionDock.tsx`).
4. **Jalankan verifikasi lengkap** setelah perubahan terakhir.

## 4. Verifikasi Wajib

Jalankan perintah berikut dari root repositori dan pastikan semuanya lolos tanpa error:

```bash
npm run lint
npm test
npm run build
```

Untuk menguji backend API/multiplayer secara lokal:

```bash
npm run server
```
