# Panduan Deployment & Sinkronisasi GitHub

Dokumen ini berisi langkah-langkah untuk memperbarui kode ke GitHub dan melakukan publikasi (deployment) ke layanan hosting seperti **Vercel** atau **Netlify**.

---

## 1. Sinkronisasi ke GitHub
Jika Anda telah melakukan perubahan kode di komputer lokal (VS Code), gunakan perintah berikut di terminal:

```bash
# 1. Tambahkan semua perubahan
git add .

# 2. Simpan perubahan dengan pesan (bebas)
git commit -m "Update fitur dan desain terbaru"

# 3. Kirim ke GitHub
git push origin main
```

---

## 2. Deployment ke Vercel (Rekomendasi)
Vercel adalah pilihan tercepat dan paling stabil untuk aplikasi React ini.

### Langkah-langkah:
1. Buka terminal proyek, ketik: `npx vercel --prod`
2. Jika ini pertama kali, ikuti instruksi login dan pilih **"Create new project"**.
3. **PENTING: Pengaturan Variabel Env**
   Masuk ke Dashboard Vercel > Klik Proyek Anda > **Settings** > **Environment Variables**.
   Tambahkan 2 variabel berikut dari file `.env` Anda:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy ulang jika perlu: `npx vercel --prod`

---

## 3. Deployment ke Netlify
Jika Anda lebih suka menggunakan Netlify:

### Langkah-langkah:
1. Jalankan build lokal: `npm run build`
2. Jalankan perintah deploy: `npx netlify-cli deploy --prod --dir=dist`
3. **PENTING: Pengaturan Variabel Env**
   Masuk ke Dashboard Netlify > Site Configuration > **Environment Variables**.
   Masukkan kunci Supabase yang sama seperti di atas.
4. **Perbaikan Refresh (404 Error)**
   Pastikan file `public/_redirects` sudah berisi: `/*  /index.html  200` (Sudah saya buatkan).

---

## 4. Tips Pemecahan Masalah
- **Error Login**: Gunakan `npx vercel login` atau `npx netlify login` jika terminal menolak akses.
- **Data Tidak Tampil**: Biasanya karena kunci Supabase di Dashboard (Vercel/Netlify) belum dimasukkan atau salah ketik.
- **Nama Situs**: Anda bisa mengubah nama domain gratis Anda di menu *Domain Settings* masing-masing dashboard.

---

*Dibuat oleh AI Assistant untuk Felix - Smart QR Class Buddy*
