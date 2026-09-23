# 🏥 MediPulse: Clinic & Pharmacy ERP

> **Sistem Operasi Terpadu Fasilitas Kesehatan Mandiri — Rekam Medis Elektronik (RME) ICD-10, Antrean Real-Time, E-Resep, & Manajemen Farmasi FEFO.**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.2.0-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0.9-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Pages-222222?logo=githubpages&logoColor=white)](https://olyxmintabansos-byte.github.io/medipulse-erp/)

---

## 🌟 Demo Langsung
Kunjungi aplikasi live tanpa instalasi server:  
👉 **[https://olyxmintabansos-byte.github.io/medipulse-erp/](https://olyxmintabansos-byte.github.io/medipulse-erp/)**

---

## 🎯 Mengapa MediPulse ERP?
Sistem operasional klinik medis konvensional umumnya terpisah-pisah: antrean loket tidak terhubung dengan ruang dokter, dan dokter menulis resep manual di kertas yang rawan salah baca di apotek.

**MediPulse ERP** menyatukan seluruh rantai layanan fasilitas kesehatan dalam satu sistem **Local-First & Client-Side SPA**:
* ⚡ **Zero-Backend Infrastructure:** 100% data tersimpan aman di browser via `LocalStorage` terstruktur dan dapat diekspor kapan saja.
* 📋 **Alur Pelayanan Pasien Mulus:**
  1. **Loket Pendaftaran:** Ambil nomor antrean per Poli (Umum, Gigi, Anak).
  2. **Ruang Dokter:** Pemeriksaan klinis terstandar dengan kamus diagnosis ICD-10 dan E-Resep langsung terkirim ke farmasi.
  3. **Apotek Farmasi:** Penerimaan resep instan, telaah dosis, dan cetak etiket obat (etiket putih obat dalam & etiket biru obat luar).
  4. **Smart Inventory (FEFO):** Pelacakan batch obat berdasarkan tanggal kedaluwarsa (*First Expired, First Out*).
  5. **Kasir Billing:** Konsolidasi otomatis biaya registrasi, jasa dokter, dan obat apotek dalam satu kwitansi resmi.

---

## 🛠️ Modul Operasional (Roadmap)
- [x] **Sprint 1: Core Shell, Layout & System Engine**
  - Navigation bar dengan jam real-time WIB dan indikator antrean aktif.
  - Sidebar modular 7 modul operasional.
  - Overview Dashboard dengan metrik KPI, live queue feed, dan quick launchpad.
  - Storage engine LocalStorage reaktif dengan TypeScript types lengkap.
- [ ] **Sprint 2: Loket Registrasi & Web Speech Queue Announcer**
- [ ] **Sprint 3: Ruang Dokter & Rekam Medis Elektronik (RME ICD-10)**
- [ ] **Sprint 4: Apotek Farmasi & Cetak Etiket Obat**
- [ ] **Sprint 5: Gudang Obat FEFO & Kasir Billing QRIS**
- [ ] **Sprint 6: Laporan Morbiditas 10 Besar Penyakit & Export CSV**

---

## 🚀 Menjalankan Secara Lokal

```bash
# Clone repository
git clone https://github.com/olyxmintabansos-byte/medipulse-erp.git
cd medipulse-erp

# Install dependensi
npm install

# Jalankan development server
npm run dev

# Kompilasi build statis untuk GitHub Pages
npm run build
```

---

## 📄 Lisensi
Didistribusikan di bawah Lisensi MIT. Bebas digunakan untuk keperluan edukasi, portofolio, dan implementasi klinik mandiri.
