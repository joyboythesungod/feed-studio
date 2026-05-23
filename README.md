# Feed Studio

Aplikasi web (PWA) untuk generate konten Instagram feed/carousel ala akun edukasi `@ardisantoso`. Bisa dipakai di HP maupun komputer, bisa di-install ke home screen HP.

## Fitur

- **2 mode**: AI Auto (tempel teks mentah → AI rapikan & susun otomatis) dan Manual (atur per block)
- **Block editor**: Heading, Paragraf, Bullet (dengan 7 ikon), Callout, Gambar
- **Stabilo / highlight** teks dengan 6 warna pastel
- **Carousel**: multi-slide dengan indikator halaman
- **Font Montserrat** + 5 alternatif (Poppins, Inter, Playfair, Lora, Nunito)
- **Layout settings**: margin, jarak header-konten (= jarak footer-konten), line height, jarak antar block
- **Custom**: foto profil, badge centang biru, catatan kaki otomatis
- **Export PNG 1080×1350** per slide atau semua sekaligus
- **PWA**: bisa di-install di iOS/Android sebagai aplikasi mandiri
- **AI dengan Google Gemini** — GRATIS, tanpa kartu kredit

---

## Cara Deploy ke Vercel (untuk pakai di HP)

### Persiapan akun (semua GRATIS)

1. **GitHub** — https://github.com (simpan source code)
2. **Vercel** — https://vercel.com (hosting, login pakai GitHub)
3. **Google AI Studio** — https://aistudio.google.com (API key Gemini)

### Langkah 1 — Dapatkan API Key Gemini (GRATIS)

1. Buka https://aistudio.google.com
2. Login dengan akun Google
3. Klik **"Get API key"** di pojok kiri atas
4. Klik **"Create API key"** → pilih project atau buat baru
5. Copy API key (formatnya seperti: `AIzaSyXXXXXXXXX...`)
6. Simpan dulu, nanti dipakai di Langkah 3

**Free tier Gemini**:
- 1.500 request/hari (lebih dari cukup untuk pemakaian harian)
- 15 request/menit
- Tanpa kartu kredit
- Tidak ada expiration date

### Langkah 2 — Push ke GitHub

```bash
# Di folder feed-studio (setelah extract zip)
git init
git add .
git commit -m "Initial commit"

# Buat repository baru di github.com (kosong, tanpa README)
# Lalu push:
git remote add origin https://github.com/USERNAME/feed-studio.git
git branch -M main
git push -u origin main
```

### Langkah 3 — Deploy ke Vercel

1. Buka https://vercel.com/new
2. Import repository `feed-studio` dari GitHub
3. **JANGAN klik Deploy dulu!** Scroll ke bawah ke section **Environment Variables**
4. Tambahkan:
   - Name: `GEMINI_API_KEY`
   - Value: `AIzaSyXXXXXXXXX...` (API key dari Langkah 1)
5. Klik **Deploy**

Setelah selesai (~1 menit), Vercel kasih URL seperti `feed-studio-xxx.vercel.app`.

### Langkah 4 — Install sebagai App di HP

**Android (Chrome):**
1. Buka URL Vercel di Chrome HP
2. Tap menu titik tiga → "Install app" atau "Add to Home screen"
3. App muncul di home screen seperti aplikasi biasa

**iOS (Safari):**
1. Buka URL Vercel di Safari
2. Tap tombol Share (kotak dengan panah ke atas)
3. Scroll → "Add to Home Screen"
4. Beri nama → Add

App akan muncul di home screen dengan icon Feed Studio.

---

## Development Lokal

```bash
# Install dependencies
npm install

# Buat file .env.local berisi:
GEMINI_API_KEY=AIzaSyXXXXX

# Jalankan dev server
npm run dev

# Build untuk production
npm run build
```

Akses di `http://localhost:5173`. Untuk testing API serverless function di lokal, gunakan `vercel dev` (perlu `npm i -g vercel`).

---

## Struktur Project

```
feed-studio/
├── api/
│   └── generate.js          ← Serverless function (proxy ke Gemini API)
├── public/
│   ├── favicon.svg
│   ├── icon-192.png         ← PWA icon
│   └── icon-512.png         ← PWA icon
├── src/
│   ├── App.jsx              ← Komponen utama
│   └── main.jsx             ← Entry point
├── index.html
├── package.json
├── vite.config.js           ← Vite + PWA plugin
├── vercel.json
└── .env.example
```

---

## Biaya

- **Vercel**: GRATIS untuk hobby/personal use
- **Gemini API**: GRATIS — 1.500 request/hari
- **GitHub**: GRATIS
- **Domain custom** (opsional): bisa pakai domain Joyboy (mis. `feed.netterproduktif.com`) — atur di Vercel project settings

**Total biaya: Rp 0** untuk pemakaian normal.

---

## Tips Pemakaian

- **AI Auto** paling enak buat naskah panjang dari dr. Ardi — tempel mentahan, biarkan AI yang nentuin mana judul, mana bullet, mana stabilo.
- **Manual** buat fine-tuning setelahnya — edit teks langsung di sidebar kanan, pilih font/warna per block.
- **Margin & spasi** di sidebar kiri — atur sekali, berlaku semua slide.
- **Multi-slide carousel** — kalau AI generate banyak slide otomatis, atau klik "+ Tambah Slide" manual.

---

## Troubleshooting

**Error "GEMINI_API_KEY not configured"**: 
Pastikan environment variable di Vercel sudah di-set. Settings → Environment Variables → tambah `GEMINI_API_KEY`. Setelah set, perlu redeploy (Deployments → klik titik tiga deployment terakhir → Redeploy).

**Error "Quota exceeded"**: 
Free tier Gemini 1.500 request/hari. Tunggu sampai besok (reset jam 12 malam waktu Pacific / sekitar jam 14-15 WIB) atau upgrade ke paid tier di Google AI Studio.

**Hasil AI tidak rapi / format aneh**: 
Klik tombol Generate lagi — Gemini kadang variatif. Atau switch ke mode Manual untuk koreksi.
