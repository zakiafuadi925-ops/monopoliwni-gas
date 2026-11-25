# Panduan Deployment — Monopoli WNI Simulator

Aplikasi ini terdiri dari dua bagian yang dapat di-deploy secara terpisah maupun bersamaan:
1. **Frontend (Vite + React 19)** — Aplikasi statis di folder `dist/`.
2. **Backend RESTful API & Multiplayer (`server/index.ts`)** — Server Node.js/TypeScript ringan untuk MongoDB Cloud Save, Global Leaderboard, AI Breaking News, dan Room Multiplayer SSE.

> Catatan: Frontend tetap dapat berjalan **100% standalone** tanpa backend (mode lokal/AI menggunakan `localStorage` dan template berita statis).

---

## 1. Deploy Frontend (Vercel / Netlify / Cloudflare Pages)

1. Hubungkan repositori GitHub ke platform hosting pilihan Anda.
2. Atur konfigurasi build:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install --legacy-peer-deps`
3. Jika Anda men-deploy backend API, tambahkan Environment Variable berikut di dashboard hosting frontend:
   - `VITE_API_URL=https://api-domain-anda.com`

---

## 2. Deploy Backend API + MongoDB (Render / Railway / VPS)

### Persiapan Database MongoDB
1. Buat cluster gratis di [MongoDB Atlas](https://www.mongodb.com/atlas) (atau gunakan MongoDB lokal/Docker).
2. Buat user database dan izinkan IP server hosting Anda di *Network Access*.
3. Salin *Connection String* ke variabel `MONGODB_URI`.

### Variabel Lingkungan Backend (`.env`)
```env
API_PORT=3001
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB_NAME="monopoli_wni"

# Opsional: untuk AI Breaking News Dinamis
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
```

### Menjalankan di Server / VPS
```bash
# Install dependensi (termasuk driver mongodb)
npm install --legacy-peer-deps

# Jalankan server API
npm run server
```

Untuk produksi di VPS dengan **PM2**:
```bash
pm2 start "npm run server" --name monopoli-wni-api
```

---

## 3. Verifikasi Setelah Deploy

1. Buka `https://api-domain-anda.com/api/health`:
   - Pastikan respons mengembalikan `"ok": true` dan `"database": { "connected": true, "mode": "mongodb" }`.
2. Buka frontend di browser:
   - Cek modal setup awal untuk memastikan status **Simpanan Cloud (MongoDB) — Terhubung**.
   - Uji tombol **Main Online** di 2 tab berbeda untuk memastikan stream SSE (`/api/rooms/:code/events`) tidak terblokir buffering reverse proxy (bila memakai Nginx, tambahkan `proxy_buffering off;` untuk rute `/api/rooms/`).
