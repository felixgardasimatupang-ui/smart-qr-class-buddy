
# Aplikasi Absensi Digital Bimbel

## Overview
Aplikasi absensi digital berbasis web untuk lembaga bimbingan belajar dengan 3 role: Admin/Pengajar, Siswa, dan Orang Tua. Menggunakan QR Code untuk pencatatan kehadiran real-time, dilengkapi fitur evaluasi dan portal orang tua.

## Design System
- **Warna utama**: Indigo/biru (#4F46E5) dengan aksen hijau (#10B981) untuk status hadir
- **Status badges**: Hadir (hijau), Absen (merah), Izin (kuning)
- **Layout**: Sidebar navigation untuk Admin (desktop), bottom navigation untuk Siswa & Orang Tua (mobile-first)
- **Style**: Modern SaaS, card-based dashboard, clean typography
- **Dark/light mode** support

## Database Schema (Supabase)
- **profiles** — data user (nama, role-link, phone)
- **user_roles** — role management (admin, student, parent)
- **students** — data siswa (nama, kelas, linked parent)
- **classes** — kelas (nama, mata pelajaran, hari, jam)
- **class_students** — relasi siswa-kelas (many-to-many)
- **sessions** — sesi absensi (kelas, tanggal, jam mulai/selesai, pengajar, QR code)
- **attendance** — kehadiran (siswa, sesi, status: hadir/absen/izin, timestamp)
- **evaluations** — nilai & catatan pengajar per siswa per sesi
- **parents** — relasi orang tua ke siswa

## Halaman & Fitur

### Auth
- Login page dengan role-based redirect
- Registration untuk siswa dan orang tua

### Admin Dashboard
- **Dashboard utama**: ringkasan statistik (total siswa, kelas aktif, kehadiran hari ini)
- **Kelola Siswa**: CRUD siswa, assign ke kelas, link ke orang tua
- **Kelola Kelas**: CRUD kelas (nama, mapel, jadwal)
- **Sesi Absensi**: buat sesi baru (pilih kelas, tanggal, jam, pengajar) → generate QR Code unik → tampilkan QR besar di layar
- **Absensi Real-time**: lihat daftar hadir sesi aktif, update otomatis saat siswa scan
- **Input Evaluasi**: input nilai dan catatan per siswa per sesi
- **Laporan**: filter per siswa/kelas/periode, rekap kehadiran (%), rapor nilai, export/cetak

### Siswa (Mobile-first)
- **Home**: sesi aktif hari ini
- **Scan QR**: buka kamera, scan QR sesi untuk absen
- **Riwayat**: kehadiran dan nilai per sesi
- **Bottom navigation**: Home, Scan, Riwayat, Profil

### Orang Tua (Mobile-first, read-only)
- **Dashboard Anak**: status kehadiran hari ini
- **Rekap Bulanan**: persentase kehadiran per bulan
- **Nilai & Catatan**: evaluasi pengajar per sesi
- **Bottom navigation**: Dashboard, Rekap, Nilai, Profil

## Fitur Teknis
- QR Code generation per sesi (unique session ID + timestamp) menggunakan library `qrcode.react`
- QR Scanner menggunakan kamera device via `html5-qrcode`
- Real-time sync kehadiran via Supabase Realtime subscriptions
- RLS policies per role untuk keamanan data
- Responsive design untuk mobile dan desktop
