# LAWATAN MURID SAMBIL BELAJAR - Portal

Portal permohonan lawatan murid untuk Jabatan Pendidikan Negeri Pahang.

## 🌟 Ciri-ciri Utama

- ✅ Borang permohonan lawatan secara online
- ✅ Sistem semakan pegawai dengan query management
- ✅ Kelulusan Timbalan Pengarah
- ✅ Penjanaan surat kelulusan automatik
- ✅ Muat naik dokumen PDF (maks 10MB setiap fail)
- ✅ Annotate PDF dengan cop dan teks

## 📁 Struktur Fail
```
LSBMuridPahang/
├── index.html          # Landing page
├── app.html            # Main application
├── css/
│   └── styles.css      # Custom styles
├── js/
│   ├── config.js       # Configuration
│   ├── utils.js        # Utility functions
│   ├── auth.js         # Authentication
│   └── forms.js        # Form handling
├── images/
│   ├── IMAGE1.png      # Header image
│   └── IMAGE2.png      # Logo
└── README.md           # Documentation
```

## 🚀 Cara Guna

### 1. **Sekolah (Hantar Permohonan)**
- Buka `index.html` → Klik "Masuk Ke Sistem"
- Isi borang permohonan
- Muat naik 5 dokumen PDF yang diperlukan
- Klik "Hantar Permohonan"

### 2. **Pegawai (Semakan)**
- Login menggunakan kata laluan pegawai
- Semak permohonan baru
- Boleh hantar Query atau Lulus terus ke Timbalan
- Annotate PDF dengan cop jika perlu

### 3. **Timbalan Pengarah (Kelulusan)**
- Login menggunakan kata laluan Timbalan
- Semak permohonan yang sudah disemak pegawai
- Klik "Lulus & Hantar Surat" untuk meluluskan
- Surat kelulusan dijana automatik

### 4. **Sekolah (Respon Query)**
- Jika terima email Query, gunakan tab "Tindak Balas Query"
- Masukkan Query ID dan email sekolah
- Muat naik fail yang telah diperbaiki

## 🔧 Setup

### Configuration
Semua konfigurasi ada dalam `js/config.js`:
- Google Apps Script URL
- Saiz maksimum fail (10MB)
- Tempoh notis minimum (30 hari)
- Tempoh lawatan maksimum (4 hari)

## 🛠️ Teknologi

- **Frontend:** HTML5, Tailwind CSS, JavaScript (Vanilla)
- **Backend:** Google Apps Script
- **Storage:** Google Drive
- **PDF Processing:** pdf-lib.js
- **Alerts:** SweetAlert2

## 📧 Sokongan

Untuk sokongan teknikal, hubungi:
- **Email:** sektorpengurusansekolahpahang@gmail.com
- **Unit:** Sektor Pengurusan Sekolah, JPN Pahang

## 📝 Nota Penting

1. **Fail PDF sahaja** - Sistem hanya menerima fail PDF (maks 10MB setiap)
2. **30 hari notis** - Permohonan mesti dibuat sekurang-kurangnya 30 hari sebelum tarikh lawatan
3. **Maksimum 4 hari** - Tempoh lawatan maksimum adalah 4 hari
4. **Email penting** - Pastikan email sekolah betul untuk menerima notifikasi

## 🔐 Keselamatan

- Sistem menggunakan kata laluan untuk akses pegawai dan Timbalan
- Semua fail disimpan dengan selamat di Google Drive
- Tiada data sensitif disimpan dalam kod frontend

## 📅 Versi

**Versi 1.1** - November 2025
- 🎗️ FARIZAN,ZACK,ALIAS.IZZAT,SHAMIL
- ✅ Sistem annotate PDF dengan cop
- ✅ Query management yang lebih baik
- ✅ UI/UX yang diperbaiki
- ✅ Mobile responsive
