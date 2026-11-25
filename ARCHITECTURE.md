# Arsitektur Aplikasi — Monopoli WNI Simulator

Dokumen ini merangkum struktur arsitektur aktual aplikasi agar memudahkan pemahaman alur data serta menjadi acuan sebelum melakukan refactoring.

## 1. Gambaran Umum

Aplikasi ini saat ini berjalan sebagai **Single-Page Application (SPA) 100% client-side** berbasis React 19 + Vite 8. Seluruh game state, kalkulasi ekonomi, giliran bot AI, serta resolusi kartu dan hukum dikelola di memori React pada komponen root `src/App.tsx`.

```text
index.html
  └── src/main.tsx
        └── src/App.tsx  (Central State + Game Loop + AI Turn + Modal Orchestrator)
              ├── src/data/*          (Data statis papan, kartu, karakter, RUU, properti mewah)
              ├── src/types/game.ts   (Kontrak tipe TypeScript)
              ├── src/utils/*         (Formatter Rupiah & Web Audio Synthesizer)
              └── src/components/*    (Board, HUD, Charts D3/Recharts, & Modals)
```

## 2. Domain Data & Kontrak Tipe (`src/types/game.ts`)

Entitas utama dalam permainan:
- **`Player`:** Menyimpan posisi (`0–27` di papan perimeter atau `100–102` di Rute Korupsi), kas (`cash`), tingkat stres (`stress` 0–100%), pengaruh politik (`politicalInfluence` 0–100), kecurigaan KPK (`kpkSuspicionLevel` 0–100%), kepemilikan properti (`ownedProperties`), kartu spesial (`ORDAL_SAKTI`, `KEBAL_SITA`, `AMNESTI_PAJAK`), `konohaBuffs`, serta statistik kumulatif.
- **`BoardTile`:** Petak pada papan perimeter (`PERIMETER_TILES`), Rute Korupsi (`CORRUPTION_ROUTE_TILES`), dan daftar properti pencucian uang (`LUXURY_BOARD_TILES`). Memiliki `zone`, `actionType`, harga, sewa dasar, dan level pengembangan (`0–3`).
- **`MacroEconomy`:** Menyimpan `inflationRate`, `biRate`, `usdIdrRate`, `trend` (`STABLE` | `RISING` | `VOLATILE` | `CRISIS`), kalender fiskal (`weekIndex`, `monthIndex`, `year`), dan `activeKonohaBuffs`.
- **`ActiveLaw` & `BreakingNewsEvent`:** Hukum yang disahkan melalui Parlemen Senayan dan kejadian berita makro yang memengaruhi seluruh pemain.
- **`MacroHistoryPoint` & `PlayerCorruptionHistoryPoint`:** Data time-series per putaran untuk grafik Recharts (`MacroHistoryChart`) dan D3 (`CorruptionD3AreaChart`).

## 3. Alur Giliran (Turn Lifecycle)

1. **Setup (`SetupGameModal`):** Pengguna memilih 2–4 pemain, nama, status manusia/AI (`isAi`), dan arketipe karakter.
2. **Lempar Dadu (`DiceRollOverlay` / `handleRollDice`):**
   - Pemain aktif melempar 2 dadu.
   - Jika pemain berada di penjara Sukamiskin (`inJail`), sistem memeriksa status tahanan/kartu bebas sebelum bergerak.
3. **Pergerakan (`executePlayerMove`):**
   - Token berpindah langkah demi langkah. Melewati petak `START` memicu gaji + pembaruan siklus waktu/makroekonomi.
4. **Resolusi Petak (`actionType`):**
   - `PROPERTY`: Tawaran beli/upgrade jika kosong/milik sendiri, atau pembayaran sewa ke pemilik (dipengaruhi inflasi & RUU aktif). Jika kas tidak cukup, memicu `RentCrisisModal` untuk menjual aset atau menyatakan bangkrut.
   - `EVENT_MUSIBAH` / `EVENT_TAKDIR`: Membuka `DrawCardModal` untuk undian dadu penentu tier kartu (`BERAT`/`SEDANG`/`RINGAN`) beserta efek kas, stres, atau `KonohaMacroBuff`.
   - `DILEMA_CARD`: Membuka `CardModal` dengan pilihan A/B.
   - `PARLIAMENT_SENAYAN`: Membuka `ParliamentModal` untuk meloloskan RUU reguler atau RUU koalisi.
   - `CORRUPTION_*`: Mengarahkan ke Rute Korupsi (`CorruptionModal`, `MoneyLaunderingModal`) dengan risiko peningkatan radar KPK dan potensi OTT.
5. **Giliran Bot AI:**
   - Dikendalikan oleh `useEffect` di `src/App.tsx` yang memantau `activePlayer.isAi`, jeda animasi, dan otomatis menyelesaikan pilihan modal serta akhir giliran.
6. **Kondisi Berakhir (`GameOverModal`):**
   - Permainan berakhir jika tersisa 1 pemain yang belum bangkrut atau batas kondisi kemenangan tercapai.

## 4. Subsistem UI & Visualisasi

- **Papan & Token:** `Board.tsx`, `PlayerToken.tsx`, `TileDetailModal.tsx`
- **HUD & Statistik:** `PlayerHUD.tsx`, `PlayerStatsDrawer.tsx`, `VitalIndicators.tsx`, `GameLogsModal.tsx`
- **Ekonomi & Politik:** `MacroIndicator.tsx`, `MacroHistoryChart.tsx`, `DrasticLawBanner.tsx`, `BreakingNewsBanner.tsx`, `ParliamentModal.tsx`
- **Korupsi & Krisis:** `CorruptionD3AreaChart.tsx`, `CorruptionRadarScan.tsx`, `CorruptionModal.tsx`, `MoneyLaunderingModal.tsx`, `RentCrisisModal.tsx`, `ManualRentPaymentModal.tsx`
- **Audio Engine:** `soundManager` (`src/utils/sound.ts`) menyinkronkan suara latar secara real-time berdasarkan `macro.trend` dan `macro.inflationRate`.

## 5. Catatan Technical Debt Saat Ini

- **Konsentrasi State di `src/App.tsx`:** ~3.460 baris kode berada dalam satu komponen. Target refactoring berikutnya adalah memisahkan pure game engine (`src/engine/`) dan state store (`useReducer`/Zustand).
- **Belum Ada Persistensi Lokal:** State belum disimpan ke `localStorage`, sehingga refresh halaman akan mengulang sesi dari awal.
- **Komponen Tidak Terpakai:** `MusibahModal.tsx` dan `TakdirModal.tsx` sudah digantikan oleh `DrawCardModal.tsx` dan perlu dibersihkan.
