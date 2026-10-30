# Monopoli WNI Gas

**Monopoli WNI** adalah game monopoli multiplayer untuk warga negara Indonesia (WNI), dibangun dengan teknologi modern yang menyoroti interaksi sosial, strategi ekonomi, dan pengalaman game yang imersif.

## 🎮 Tentang Game

Monopoli WNI adalah adaptasi digital klasik game monopoli yang dimodifikasi untuk mencerminkan realita ekonomi Indonesia. Mainkan dengan teman atau lawan AI, belikan properti, bayar sewa, dan jadi pemain terkaya.

### Fitur Utama

- **Multiplayer Realtime** — Sesi game live dengan beberapa pemain
- **Mekanika Monopoli Lengkap** — Pembelian properti, sewa, perjudian, bangkrut, dan transaksi perantara
- **Karakter & Token** — Pilih token unik masing-masing pemain dengan kemampuan khas
- **Kartu Acara & Kejadian** — Kartu Acara Minggu & Kartu Kejadian yang mempengaruhi alur game
- **Luas Lapangan** — 28 properti (termasuk properti kelas atas, menengah, dan bawah) dengan harga dan sewa yang berbeda-beda
- **Sistem Perjudian** — Mekanika melepaskan rumah/hotel dan mortgaging properti
- **Indikator Makro** — Grafik dan indikator ekonomi dalam game (inflasi, suku bunga, dll)

### Teknologi

- **Frontend**: Svelte 5 (runes), TypeScript, Tailwind CSS v4
- **Runtime**: Bun (default), kompatibel dengan Node.js
- **Realtime**: Supabase (PostgREST + Realtime subscriptions)
- **Build**: Vite 8.x
- **Styling**: Tailwind CSS v4 dengan konfigurasi custom

### Struktur Projek

```text
monopoliwni-gas/
├── .env                 # Environment variables (API keys - JANGAN publik!)
├── .env.example         # Template yang aman untuk divisikan
├── .gitignore           # Pengecualian node_modules, dist, build, .env*
├── bun.lockb            # Lockfile Bun
├── package.json         # Dependencies dan script
├── vite.config.ts       # Konfigurasi Vite
├── tsconfig.json        # Konfigurasi TypeScript
├── index.html           # Entry point HTML
├── metadata.json        # Metadata aplikasi
└── src/
    ├── main.ts          # Root component
    ├── App.svelte       # Komponen utama game
    ├── index.css        # Styles global
    ├── assets/          # Gambar & sumber daya statis
    ├── components/      # UI komponen ( Board, HUD, Modals, dll )
    │   ├── Board.svelte             # Papan permainan
    │   ├── PlayerHUD.svelte         # Indikator pemain
    │   ├── DiceRoller.svelte        # Melempar dadu
    │   ├── TileDetailModal.svelte   # Detail properti
    │   └── ... (modal & komponen lain)
    ├── data/            # Data game (cards, characters, laws, tiles)
    │   ├── cards.ts           # Kartu Acara & Kejadian
    │   ├── characters.ts      # Token & kemampuan pemain
    │   ├── eventCards.ts      # Event cards deck
    │   ├── laws.ts            # Aturan khusus
    │   ├── luxuryProperties.ts# Properti kelas atas
    │   └── tiles.ts           # Definisi tile papan
    └── utils/           # Utilitas bantu
        ├── format.ts          # Format angka/rupiah
        └── sound.ts           # Efek suara
```

### Memulai

```bash
# 1. Clone repositori
git clone https://github.com/zakiafuadi925-ops/monopoliwni-gas.git
cd monopoliwni-gas

# 2. Install dependensi (Bun atau npm)
bun install
# atau: npm install

# 3. Konfigurasikan environment
cp .env.example .env
# Isi variabel Supabase di .env

# 4. Jalankan development server
bun run dev
# atau: npm run dev

# 5. Buka http://localhost:5173 di browser (atau port sesuai vite.config.ts)
```

### Script yang Tersedia

| Script    | Deskripsi                  |
| --------- | -------------------------- |
| `dev`     | Jalankan Vite server       |
| `build`   | Build produksi ke `dist/`  |
| `preview` | Pratinjau build lokal      |
| `clean`   | Hapus file build           |
| `lint`    | Cek TypeScript dengan tsc  |

### Kontribusi

1. Fork repositori
2. Buat cabang fitur (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur X'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

### Lisensi

Proprietary — digunakan untuk tujuan pengajaran dan demonstrasi.

### Kontak

- GitHub: [@zakiafuadi925-ops](https://github.com/zakiafuadi925-ops)
- Project: [monopoliwni-gas](https://github.com/zakiafuadi925-ops/monopoliwni-gas)
