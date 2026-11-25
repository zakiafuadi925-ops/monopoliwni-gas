# Monopoli WNI Simulator: Realita & Rute Korupsi

**Monopoli WNI Simulator** adalah game monopoli satir bertema realita ekonomi-politik Indonesia. Pemain bersaing membangun aset lintas pulau, menghadapi musibah sosial, gejolak makroekonomi dinamis, lobi parlemen & koalisi, hingga godaan Rute Korupsi yang diawasi radar OTT KPK.

Demo live: https://monopoliwni-gas.vercel.app/

## Fitur Utama

- **5 Arketipe Karakter Unik** — Bambang UMR, Pak Joko ASN, Jessica Jaksel, Daud Politisi, dan Kevin Konglo dengan saldo awal, ketahanan stres, bonus gaji, dan risiko KPK berbeda (`src/data/characters.ts`).
- **Papan Nusantara & Rute Korupsi** — Petak properti lintas pulau (Jawa, Sumatra, Kalimantan, Sulawesi, Papua), petak spesial, jalur Rute Korupsi berisiko tinggi (`src/data/tiles.ts`), serta properti mewah untuk pencucian uang (`src/data/luxuryProperties.ts`).
- **Makroekonomi Dinamis & Audio Ambien** — Inflasi, BI Rate, dan kurs USD/IDR berubah seiring putaran, lengkap dengan grafik historis (`MacroHistoryChart`) dan audio ambien Web Audio API yang menyesuaikan tren ekonomi (`STABLE`, `RISING`, `VOLATILE`, `CRISIS`).
- **Kartu Dilema, Musibah, Takdir, & Konoha Buff** — Berbagai kartu kejadian acak yang memengaruhi kas, stres, pengaruh politik, serta makroekonomi (`src/data/cards.ts`, `src/data/eventCards.ts`).
- **Parlemen & Koalisi Politik** — Kumpulkan pengaruh politik untuk meloloskan RUU reguler maupun RUU koalisi drastis bersama rekan fraksi (`src/data/laws.ts`, `src/components/ParliamentModal.tsx`).
- **Radar OTT KPK & Krisis Sewa** — Visualisasi riwayat korupsi dengan D3 (`CorruptionD3AreaChart`), radar pemantauan KPK (`CorruptionRadarScan`), serta mekanisme jual aset darurat saat gagal bayar sewa (`RentCrisisModal`).
- **Mode Lokal & Lawan AI** — Mendukung 2–4 pemain dalam kombinasi pemain manusia (pass-and-play) dan bot AI (`src/components/SetupGameModal.tsx`).

## Teknologi

- **Frontend:** React 19, TypeScript, Vite 8
- **Styling & Animasi:** Tailwind CSS v4 (`@tailwindcss/vite`), Framer Motion (`framer-motion` / `motion`), `canvas-confetti`, Lucide React
- **Visualisasi Data:** D3 v7 & Recharts v3
- **Audio:** Web Audio API custom synthesizer (`src/utils/sound.ts`, tanpa aset audio eksternal)
- **Backend & Database (Opsional):** Node.js HTTP RESTful API (`server/index.ts`) dengan dukungan **MongoDB** (Cloud Save & Global Leaderboard), SSE Realtime Multiplayer, dan **Gemini API** untuk *Breaking News* dinamis.
- **Testing:** Vitest (`npm test`)
- **Runtime / Package Manager:** Node.js (v20+) atau Bun

## Struktur Project

```text
monopoliwni-gas/
├── index.html                  # Entry point HTML & metadata OG
├── package.json                # Dependensi & script npm/bun
├── tsconfig.json               # Konfigurasi TypeScript
├── vite.config.ts              # Konfigurasi Vite + Tailwind CSS v4
├── AGENTS.md                   # Panduan khusus untuk AI coding agent
├── ARCHITECTURE.md             # Arsitektur state, alur game, & komponen
├── ROADMAP.md                  # Rencana pengembangan bertahap
└── src/
    ├── main.tsx                # Bootstrap React root
    ├── App.tsx                 # State utama, game loop, AI, & orkestrasi modal
    ├── index.css               # Tailwind v4 & animasi CSS kustom
    ├── types/
    │   └── game.ts             # Definisi tipe TypeScript (Player, BoardTile, MacroEconomy, dll.)
    ├── data/
    │   ├── cards.ts            # Kartu Dilema
    │   ├── characters.ts       # 5 arketipe karakter
    │   ├── eventCards.ts       # Kartu Musibah, Takdir Konoha, & Kartu Spesial
    │   ├── laws.ts             # RUU Parlemen & template Breaking News
    │   ├── luxuryProperties.ts # Properti mewah pencucian uang
    │   └── tiles.ts            # Petak papan perimeter & Rute Korupsi
    ├── utils/
    │   ├── format.ts           # Formatter Rupiah (penuh & singkat) dan persen
    │   └── sound.ts            # Synthesizer Web Audio API & ambient makroekonomi
    └── components/             # Komponen UI papan, HUD, chart, dan modal
```

## Memulai Secara Lokal

```bash
# 1. Clone repositori
git clone https://github.com/zakiafuadi925-ops/monopoliwni-gas.git
cd monopoliwni-gas

# 2. Install dependensi (pilih salah satu)
bun install
# atau: npm install

# 3. Jalankan development server (port 3000)
bun run dev
# atau: npm run dev
```

Buka `http://localhost:3000` di browser.

## Script yang Tersedia

| Script    | Perintah                          | Deskripsi                                       |
| --------- | --------------------------------- | ----------------------------------------------- |
| `dev`     | `vite --port=3000 --host=0.0.0.0` | Menjalankan server pengembangan frontend lokal  |
| `server`  | `tsx server/index.ts`             | Menjalankan RESTful API, MongoDB, & Multiplayer |
| `build`   | `vite build`                      | Build produksi ke folder `dist/`                |
| `preview` | `vite preview`                    | Pratinjau hasil build produksi lokal            |
| `lint`    | `tsc --noEmit`                    | Pemeriksaan tipe TypeScript                     |
| `test`    | `vitest run`                      | Menjalankan seluruh unit & API integration test |
| `clean`   | `rm -rf dist`                     | Menghapus artefak build                         |

## Deploy

Project ini merupakan aplikasi frontend statis Vite dan dapat langsung di-deploy ke Vercel/Netlify dengan build command `npm run build` (atau `bun run build`) dan output directory `dist`.

## Dokumentasi Lanjutan

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Peta arsitektur, alur giliran, dan struktur state
- [ROADMAP.md](./ROADMAP.md) — Roadmap pengembangan fitur & refactoring
- [AGENTS.md](./AGENTS.md) — Panduan & batasan teknis untuk AI coding agent
- [CHANGELOG.md](./CHANGELOG.md) — Catatan perubahan proyek
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Panduan kontribusi & standar kode
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Panduan deploy frontend, MongoDB, & backend API

## Lisensi & Kontak

- **Lisensi:** [MIT License](./LICENSE)
- **GitHub:** [@zakiafuadi925-ops](https://github.com/zakiafuadi925-ops)
- **Repositori:** [monopoliwni-gas](https://github.com/zakiafuadi925-ops/monopoliwni-gas)
