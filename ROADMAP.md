# Roadmap Modularisasi `src/App.tsx`

Dokumen ini menjadi panduan bertahap untuk memecah [src/App.tsx](src/App.tsx) (~3.383 baris) menjadi modul-modul yang lebih kecil, terfokus, dan mudah diuji tanpa mematahkan alur permainan.

---

## 1. Status Saat Ini

### Sudah Termodularisasi
- **State Global & Reducer:** [src/context/GameContext.tsx](src/context/GameContext.tsx)
- **Domain Engine:**
  - [src/engine/economy.ts](src/engine/economy.ts) — perhitungan sewa, valuasi aset, likuidasi, siklus makro
  - [src/engine/politics.ts](src/engine/politics.ts) — efek RUU parlemen & koalisi
  - [src/engine/ai.ts](src/engine/ai.ts) — keputusan bot AI (suap penjara, rute korupsi, kartu dilema, parlemen)
  - [src/engine/trade.ts](src/engine/trade.ts) — barter & negosiasi properti
  - [src/engine/seasonalEvents.ts](src/engine/seasonalEvents.ts) — event musiman bulanan
  - [src/engine/narrator.ts](src/engine/narrator.ts) — konteks narasi & *breaking news*
  - [src/engine/persistence.ts](src/engine/persistence.ts) — simpan/muat `localStorage`
  - [src/engine/cloudApi.ts](src/engine/cloudApi.ts) — simpan/muat sesi ke backend API
  - [src/engine/multiplayer.ts](src/engine/multiplayer.ts) — room online, sinkronisasi state, `clientId`
- **UI Shell & Mobile (Baru Diekstrak):**
  - [src/components/GameHeader.tsx](src/components/GameHeader.tsx)
  - [src/components/GameNoticesBanner.tsx](src/components/GameNoticesBanner.tsx)
  - [src/components/LiveStandingsCard.tsx](src/components/LiveStandingsCard.tsx)
  - [src/components/MobileActionDock.tsx](src/components/MobileActionDock.tsx)

### Peta Anatomi `src/App.tsx` Saat Ini

| Rentang Baris (Perkiraan) | Tanggung Jawab | Target Modul |
|---|---|---|
| `1–195` | Import, konstanta aset (`BANNER_IMAGE`, `CREST_IMAGE`, `CARD_IMAGE`), `MONTH_NAMES`, helper sisa | `src/constants/gameAssets.ts` |
| `440–653` | Persistensi lokal, cloud save, dan sinkronisasi room multiplayer (`useEffect` & `handleEnterOnlineGame`, `handleLeaveOnlineRoom`, `handleSaveToCloud`) | `src/hooks/usePersistenceAndMultiplayer.ts` |
| `654–832` | Siklus permainan: start/restart, trade, dan eliminasi/kebangkrutan (`handleStartGame`, `handleRestartNewRound`, `handleQuickRestart`, `handleExecuteTrade`, `handlePlayerBankruptcy`) | `src/hooks/useGameLifecycle.ts` |
| `833–1458` | Cek stres psikolog, lempar dadu, animasi langkah bidak, dan resolusi petak mendarat (`checkStressThreshold`, `handleRollDice`, `executePlayerMove`, `resolveLandingTile`) | `src/hooks/useBoardMovement.ts` |
| `1459–1689` | Krisis sewa, pembayaran sewa manual, jual/beli/upgrade properti | `src/hooks/usePropertyAndRent.ts` |
| `1690–2081` | Kartu dilema & event Musibah/Takdir 3-tier (`handleChooseCardOption`, `handleConfirmDrawCardOutcome`) | `src/hooks/useCardEvents.ts` |
| `2082–2383` | Rute korupsi, audit BPK/KPK, suap KPK, suap penjara, dan pencucian uang properti mewah | `src/hooks/useCorruptionAndJail.ts` |
| `2384–2815` | Parlemen DPR Senayan (`handleVetoLaw`, `handlePassLaw`) dan pergantian giliran/siklus (`handleEndTurn`, `advanceCycle`) | `src/hooks/usePoliticsAndTurn.ts` |
| `2816–3017` | Otomasi turn AI (`useEffect` bot AI, auto-select dilema/parlemen/event) & auto-dismiss toast | `src/hooks/useAiAutomation.ts` |
| `3155–3375` | Kumpulan render 14+ modal permainan | `src/components/GameModals.tsx` |

---

## 2. Rencana Eksekusi Bertahap

Kerjakan satu fase dalam satu PR/sesi agar mudah di-review dan diverifikasi.

### Fase 1 — Ekstrak Konstanta & Wadah Modal (`Low Risk`)
**Tujuan:** Mengurangi ~250 baris JSX & konstanta statis dari `App.tsx` tanpa menyentuh logika bisnis.
1. Buat `src/constants/gameAssets.ts`:
   - Pindahkan `BANNER_IMAGE`, `CREST_IMAGE`, `CARD_IMAGE`, `MONTH_NAMES`.
   - Hapus konstanta duplikat `_INITIAL_MACRO_HISTORY`, `_createInitialCorruptionHistory`, `_createDefaultPlayers` jika sudah tidak dipakai (pakai langsung dari `src/context/GameContext.tsx`).
2. Buat `src/components/GameModals.tsx`:
   - Pindahkan blok render modal (baris `3155–3375`: `SetupGameModal`, `TradeModal`, `CardModal`, `CorruptionGateModal`, `CorruptionAuditModal`, `KPKBribeModal`, `DrawCardModal`, `ParliamentModal`, `MoneyLaunderingModal`, `PlayerStatsDrawer`, `TileDetailModal`, `GameLogsModal`, `GameOverModal`, `RentCrisisModal`, `ManualRentPaymentModal`, `MultiplayerLobbyModal`, `QuickGuideModal`).
   - Kelompokkan props berdasarkan domain (`modalState`, `handlers`) agar rapi.

### Fase 2 — Ekstrak Persistensi & Multiplayer (`src/hooks/usePersistenceAndMultiplayer.ts`)
**Tujuan:** Memisahkan efek sinkronisasi jaringan/storage dari logika papan permainan.
- Pindahkan:
  - Auto-save `localStorage` & restore `savedSnapshot`
  - `subscribeToOnlineRoom`, `syncOnlineRoomState`, `handleEnterOnlineGame`, `handleLeaveOnlineRoom`
  - `handleSaveToCloud` & `cloudSaveStatus`
- Kembalikan `{ clientId, onlineRoomCode, cloudSaveStatus, savedSnapshot, handleSaveToCloud, handleEnterOnlineGame, handleLeaveOnlineRoom, handleResumeSavedGame, handleResumeCloudGame }`.

### Fase 3 — Ekstrak Handler Domain ke Custom Hooks (`src/hooks/`)
Urutan disarankan dari yang paling mandiri ke yang paling terhubung:
1. `src/hooks/useCorruptionAndJail.ts`
   - Pindahkan `handleCorruptionAuditResolve`, `handlePayKpkBribe`, `handleRefuseKpkBribe`, `handlePayJailBribe`, `handleLaunderBuyLuxury`, `handleLaunderBuyPerimeter`, `handleSkipLaundering`.
2. `src/hooks/usePropertyAndRent.ts`
   - Pindahkan `handleBuyProperty`, `handleUpgradeProperty`, `handleSellPropertyForRent`, `handleSellAllPropertiesForRent`, `handlePayRentFromCrisis`, `handleBankruptcyFromRentCrisis`, `handleUseSpecialCardForRent`, `handleConfirmManualRentPayment`, `handleUseSpecialCardForManualRent`.
3. `src/hooks/useCardEvents.ts`
   - Pindahkan `handleChooseCardOption` dan `handleConfirmDrawCardOutcome` (termasuk logika murni efek buff Konoha ke `src/engine/cardEffects.ts` bila memungkinkan agar bisa di-unit-test).
4. `src/hooks/usePoliticsAndTurn.ts`
   - Pindahkan `handleVetoLaw`, `handlePassLaw`, `handleEndTurn`, `advanceCycle`.
5. `src/hooks/useBoardMovement.ts`
   - Pindahkan `checkStressThreshold`, `handleRollDice`, `handleRollAnimationComplete`, `executePlayerMove`, `resolveLandingTile`.

### Fase 4 — Ekstrak Otomasi Bot AI (`src/hooks/useAiAutomation.ts`)
**Tujuan:** Memisahkan seluruh `useEffect` timer bot AI (`2816–2994`) dari UI utama.
- Pindahkan timer giliran AI, auto-pilih kartu dilema, auto-sidang parlemen, auto-pilih event Musibah/Takdir, dan watchdog anti-macet AI.
- Pastikan seluruh `clearTimeout` tetap dibersihkan pada cleanup `useEffect`.

### Fase 5 — Final Cleanup `src/App.tsx`
Target ukuran akhir `src/App.tsx`: **~200–350 baris** yang hanya berisi:
- Komposisi hooks (`usePersistenceAndMultiplayer`, `useBoardMovement`, `useAiAutomation`, dll.)
- Layout utama (`GameHeader`, `DrasticLawBanner`, `GameNoticesBanner`, `MacroIndicator`, `Board`, `PlayerHUD`, `CorruptionD3AreaChart`, `LiveStandingsCard`, `MobileActionDock`)
- Render `<GameModals />`

---

## 3. Aturan Kerja & Verifikasi

1. **Jangan pecah sambil mengubah perilaku fitur** — pisahkan *refactor* (memindahkan kode) dari *feature/bugfix* agar regresi mudah dilacak.
2. **Ekstrak fungsi murni ke `src/engine/` terlebih dahulu** bila ada kalkulasi baru, lalu tambahkan unit test di `src/engine/__tests__/`.
3. **Pertahankan konvensi proyek** sesuai [AGENTS.md](AGENTS.md):
   - Teks UI & log berbahasa Indonesia.
   - Format mata uang memakai `formatRupiah` / `formatRupiahShort` dari [src/utils/format.ts](src/utils/format.ts).
   - Jangan ubah blok `hmr` dan `watch` di [vite.config.ts](vite.config.ts).
4. **Wajib lolos verifikasi setelah setiap fase:**
   ```bash
   npm run lint
   npm test
   npm run build
   ```
