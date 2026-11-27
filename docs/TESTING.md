# Panduan Pengujian & QA Checklist

Panduan ini mencakup verifikasi otomatis (TypeScript, Vitest, Vite build) dan pengujian manual untuk fitur mobile serta multiplayer.

---

## 1. Perintah Verifikasi Otomatis

Jalankan dari root repositori:

```bash
npm run lint   # Typecheck TypeScript (tsc --noEmit)
npm test       # Menjalankan seluruh unit & API test (vitest run)
npm run build  # Memverifikasi build produksi Vite (dist/)
```

---

## 2. Daftar Test Suite (`vitest`)

| Kategori | File Test | Fokus Pengujian |
| :--- | :--- | :--- |
| **Utilitas** | [src/utils/__tests__/format.test.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/utils/__tests__/format.test.ts) | Format Rupiah (`formatRupiah`, `formatRupiahShort`). |
| **Data Game** | [src/utils/__tests__/gameData.test.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/utils/__tests__/gameData.test.ts) | Integritas petak papan, kartu, karakter, dan RUU. |
| **State Reducer** | [src/context/__tests__/gameReducer.test.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/context/__tests__/gameReducer.test.ts) | Inisialisasi permainan, `RESUME_GAME`, dan aksi state utama. |
| **Ekonomi** | [src/engine/__tests__/economy.test.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/engine/__tests__/economy.test.ts) | Kalkulasi sewa, nilai jual properti, likuidasi utang, siklus makro. |
| **AI & Politik** | [src/engine/__tests__/aiAndPolitics.test.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/engine/__tests__/aiAndPolitics.test.ts) | Keputusan bot AI, kuorum koalisi, dan target penyitaan aset. |
| **Barter Properti** | [src/engine/__tests__/trade.test.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/engine/__tests__/trade.test.ts) | Validasi & eksekusi penawaran barter antar pemain. |
| **Event Musiman** | [src/engine/__tests__/seasonalEvents.test.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/engine/__tests__/seasonalEvents.test.ts) | Efek pergantian bulan dan event musiman. |
| **Narator** | [src/engine/__tests__/narrator.test.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/engine/__tests__/narrator.test.ts) | Pembentukan konteks narator dan fallback *Breaking News*. |
| **Cloud API Client** | [src/engine/__tests__/cloudApi.test.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/src/engine/__tests__/cloudApi.test.ts) | Serialisasi simpanan & panggilan API cloud. |
| **Backend API** | [server/__tests__/api.test.ts](file:///mnt/data/BACK_UP/Code/monopoliwni-gas/server/__tests__/api.test.ts) | Endpoint `/api/health`, `/api/saves`, `/api/leaderboard`, `/api/rooms`. |

---

## 3. QA Checklist Manual

### A. Tampilan Mobile (`< 1024px` / `lg:hidden`)
- [ ] Header ringkas menampilkan judul, putaran, badge room online, dan tombol *drawer* menu lipat (`GameHeader.tsx`).
- [ ] `MobileActionDock` menempel rapi di bawah layar tanpa menutupi papan permainan atau terpotong *safe-area*.
- [ ] Tombol aksi kontekstual (*Kocok Dadu*, *Suap Keluar Penjara*, *Beli Properti*, *Akhiri Giliran*) berfungsi normal dengan sekali ketuk.
- [ ] Modal (`SetupGameModal`, `MultiplayerLobbyModal`, `RentCrisisModal`, `DrawCardModal`, `ParliamentModal`) dapat di-scroll dan tombol konfirmasinya mudah dijangkau di layar kecil.

### B. Multiplayer Online & Cloud Save
1. Jalankan backend: `npm run server` (port `3001`).
2. Jalankan frontend: `npm run dev` (port `3000`).
3. Buka 2 tab browser berbeda:
   - [ ] Tab 1 membuat room baru via **Online Lobby** dan status server terbaca *online*.
   - [ ] Tab 2 bergabung memakai kode room yang sama; daftar peserta langsung ter-update via SSE.
   - [ ] Host memulai game; giliran pemain non-aktif terkunci (`isOnlineTurnLocked`) dan menampilkan banner menunggu giliran di `GameNoticesBanner`.
   - [ ] Klik **Simpan** di header untuk memastikan cloud save tercatat ke `POST /api/saves` dan bisa dimuat kembali dari `SetupGameModal`.

### C. Mode Fallback Offline
- [ ] Hentikan `npm run server`, lalu jalankan game lokal: permainan tetap berjalan penuh menggunakan `localStorage` dan template *Breaking News* lokal.
