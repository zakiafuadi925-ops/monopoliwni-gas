# Arsitektur Aplikasi — Monopoli WNI Simulator

Dokumen ini merangkum struktur arsitektur aktual aplikasi setelah modularisasi frontend dan integrasi backend API.

## 1. Gambaran Umum

Aplikasi ini berjalan sebagai **React 19 + TypeScript + Vite 8** di sisi klien yang terhubung secara opsional ke **Express RESTful API** (`server/`) untuk fitur cloud save, multiplayer online room, dan narator AI Gemini (dengan *graceful fallback* ke mode offline/in-memory).

```text
index.html
  └── src/main.tsx
        └── src/App.tsx  (GameProvider Root Wrapper)
              └── src/components/GameContent.tsx  (Layout & Hook Composition)
                    ├── src/context/GameContext.tsx  (Reducer & Global Game State)
                    ├── src/hooks/*                  (Domain Hooks & AI Automation)
                    ├── src/engine/*                 (Pure Business Logic & API Clients)
                    ├── src/constants/gameAssets.ts  (Asset Paths & Nama Bulan)
                    ├── src/data/*                   (Data Papan, Kartu, Karakter, RUU)
                    ├── src/types/game.ts            (Kontrak Tipe TypeScript)
                    ├── src/utils/*                  (Formatter Rupiah & Web Audio)
                    └── src/components/*             (Board, Mobile Dock, HUD, Modals)

server/
  ├── index.ts       (Express Server Entry Point)
  ├── routes.ts      (REST Endpoints: /api/health, /api/saves, /api/rooms, /api/narrator)
  ├── db.ts          (Koneksi MongoDB + Fallback In-Memory)
  ├── rooms.ts       (Manajemen Room Multiplayer Online)
  └── utils/http.ts  (Helper HTTP & Validasi Request)
```

## 2. Domain Data & Kontrak Tipe (`src/types/game.ts`)

Entitas utama dalam permainan:
- **`Player`:** Menyimpan posisi (`0–27` di papan perimeter atau `100–103` di Rute Korupsi), kas (`cash`), tingkat stres (`stress` 0–100%), pengaruh politik (`politicalInfluence` 0–100), kecurigaan KPK (`kpkSuspicionLevel` 0–100%), kepemilikan properti (`ownedProperties`), kartu spesial (`ORDAL_SAKTI`, `KEBAL_SITA`, `AMNESTI_PAJAK`), `konohaBuffs`, serta statistik kumulatif.
- **`BoardTile`:** Petak pada papan perimeter (`PERIMETER_TILES`), Rute Korupsi (`CORRUPTION_ROUTE_TILES`), dan daftar properti pencucian uang (`LUXURY_BOARD_TILES`). Memiliki `zone`, `actionType`, harga, sewa dasar, dan level pengembangan (`0–3`).
- **`MacroEconomy`:** Menyimpan `inflationRate`, `biRate`, `usdIdrRate`, `trend` (`STABLE` | `RISING` | `VOLATILE` | `CRISIS`), kalender fiskal (`weekIndex`, `monthIndex`, `year`), dan `activeKonohaBuffs`.
- **`ActiveLaw` & `BreakingNewsEvent`:** Hukum yang disahkan melalui Parlemen Senayan dan kejadian berita makro yang memengaruhi seluruh pemain.
- **`MacroHistoryPoint` & `PlayerCorruptionHistoryPoint`:** Data time-series per putaran untuk grafik Recharts (`MacroHistoryChart`) dan D3 (`CorruptionD3AreaChart`).

## 3. Lapisan Modular Frontend (`src/hooks/` & `src/engine/`)

- **Hooks Orkestrasi (`src/hooks/`):**
  - `usePersistenceAndMultiplayer.ts` — Auto-save `localStorage`, simpan/muat cloud, dan sinkronisasi room multiplayer online.
  - `useGameLifecycle.ts` — Start/restart sesi, negosiasi barter, dan penanganan kebangkrutan.
  - `useBoardMovement.ts` — Cek ambang stres (`checkStressThreshold`), lempar dadu, animasi langkah bidak, dan resolusi petak mendarat.
  - `usePropertyAndRent.ts` — Beli/upgrade properti, likuidasi aset (`RentCrisisModal`), dan pembayaran sewa manual.
  - `useCardEvents.ts` — Resolusi kartu Dilema Konoha serta event Musibah/Takdir 3-tier dan buff Takdir Konoha.
  - `useCorruptionAndJail.ts` — Audit BPK/KPK, suap/vonis Tipikor, suap keluar penjara, dan pencucian uang.
  - `usePoliticsAndTurn.ts` — Veto/pengesahan RUU koalisi di Parlemen Senayan, pergantian giliran, dan siklus makro bulanan.
  - `useAiAutomation.ts` — Otomasi giliran bot AI, auto-pilih modal/parlemen, dan *watchdog* anti-macet.
- **Pure Engines (`src/engine/`):**
  - `economy.ts`, `politics.ts`, `ai.ts`, `trade.ts`, `seasonalEvents.ts`, `narrator.ts`, `persistence.ts`, `cloudApi.ts`, `multiplayer.ts`.

## 4. Subsistem UI, Mobile & Visualisasi (`src/components/`)

- **Layout & Mobile Shell:** `GameHeader.tsx` (bar desktop + *drawer* mobile), `GameNoticesBanner.tsx`, `LiveStandingsCard.tsx`, `MobileActionDock.tsx` (dock aksi bawah layar untuk `lg:hidden`), dan `GameModals.tsx` (orkestrator seluruh modal).
- **Papan & Token:** `Board.tsx`, `PlayerToken.tsx`, `TileDetailModal.tsx`, `DiceRoller.tsx`.
- **HUD & Statistik:** `PlayerHUD.tsx`, `PlayerStatsDrawer.tsx`, `VitalIndicators.tsx`, `GameLogsModal.tsx`.
- **Ekonomi & Politik:** `MacroIndicator.tsx`, `MacroHistoryChart.tsx`, `DrasticLawBanner.tsx`, `BreakingNewsBanner.tsx`, `ParliamentModal.tsx`.
- **Korupsi, Krisis & Multiplayer:** `CorruptionD3AreaChart.tsx`, `CorruptionRadarScan.tsx`, `CorruptionModal.tsx`, `MoneyLaunderingModal.tsx`, `RentCrisisModal.tsx`, `ManualRentPaymentModal.tsx`, `MultiplayerLobbyModal.tsx`.
- **Audio Engine:** `soundManager` (`src/utils/sound.ts`) menyinkronkan suara latar Web Audio API secara real-time berdasarkan `macro.trend` dan `macro.inflationRate`.

## 5. Catatan Pemeliharaan

- **Persistensi Lokal & Cloud:** State aktif otomatis disimpan ke `localStorage` (`src/engine/persistence.ts`) dan dapat disimpan ke backend API (`src/engine/cloudApi.ts`).
- **Komponen Legacy Tidak Terpakai:** `MusibahModal.tsx` dan `TakdirModal.tsx` sudah digantikan oleh `DrawCardModal.tsx` dan belum dihapus demi referensi historis; jangan edit keduanya dengan asumsi aktif di UI.
