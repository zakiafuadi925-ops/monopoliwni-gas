# Panduan Kontribusi — Monopoli WNI Simulator

Terima kasih sudah tertarik ikut mengembangkan **Monopoli WNI Simulator**! Panduan ini menjelaskan alur kerja, struktur kode, dan standar kualitas proyek.

---

## 1. Persiapan Lingkungan Lokal

```bash
# 1. Clone repositori
git clone https://github.com/zakiafuadi925-ops/monopoliwni-gas.git
cd monopoliwni-gas

# 2. Install dependensi
npm install --legacy-peer-deps

# 3. Salin konfigurasi lingkungan
cp .env.example .env
```

Jalankan server pengembangan:
- **Frontend (port 3000):** `npm run dev`
- **Backend API & Multiplayer (port 3001, opsional):** `npm run server`

---

## 2. Aturan Pengembangan & Arsitektur

1. **Bahasa & Gaya Konten:**
   - Seluruh teks UI, narasi kartu, log permainan, dan pesan error menggunakan **Bahasa Indonesia** dengan gaya satir ekonomi-politik Indonesia.
   - Selalu gunakan `formatRupiah` atau `formatRupiahShort` dari `src/utils/format.ts` untuk nilai mata uang IDR.
2. **Modularitas Engine:**
   - Logika bisnis murni (ekonomi, AI, politik, barter, event musiman, API client) ditempatkan di `src/engine/`, terpisah dari komponen React agar mudah diuji dengan Vitest.
   - Hindari menambah logika berat langsung ke `src/App.tsx`.
3. **Konfigurasi Vite:**
   - Jangan mengubah blok `hmr` dan `watch` di `vite.config.ts` karena disiapkan khusus untuk kompatibilitas AI Studio.
4. **Audio Tanpa Aset Eksternal:**
   - Semua efek suara berasal dari Web Audio API di `src/utils/sound.ts` (`soundManager`).

---

## 3. Verifikasi Sebelum Pull Request

Pastikan seluruh pemeriksaan berikut lolos tanpa error sebelum mengajukan perubahan:

```bash
npm run lint    # TypeScript check (tsc --noEmit)
npm test        # Seluruh unit & API test (vitest run)
npm run build   # Build produksi (vite build)
```

---

## 4. Konvensi Commit & PR

- Gunakan pesan commit yang jelas dan ringkas (misalnya: `feat: tambah event nasional pemilu`, `fix: validasi barter properti nol`).
- Sertakan unit test baru di `src/**/__tests__/` atau `server/__tests__/` untuk setiap fitur atau perbaikan bug di engine/API.
