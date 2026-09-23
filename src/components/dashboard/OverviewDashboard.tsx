"use client";

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Stethoscope, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Receipt, 
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { StorageEngine } from '@/lib/storage';
import { QueueItem, Medicine, BillingInvoice, ActiveTab } from '@/types/medipulse';

interface OverviewDashboardProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);

  useEffect(() => {
    const loadAll = () => {
      setQueues(StorageEngine.getQueues());
      setMedicines(StorageEngine.getMedicines());
      setInvoices(StorageEngine.getInvoices());
    };
    loadAll();
    window.addEventListener('medipulse_queues_updated', loadAll);
    window.addEventListener('medipulse_medicines_updated', loadAll);
    window.addEventListener('medipulse_invoices_updated', loadAll);
    return () => {
      window.removeEventListener('medipulse_queues_updated', loadAll);
      window.removeEventListener('medipulse_medicines_updated', loadAll);
      window.removeEventListener('medipulse_invoices_updated', loadAll);
    };
  }, []);

  const totalPatientsWaiting = queues.filter((q) => q.status === 'MENUNGGU').length;
  const totalPatientsDoctor = queues.filter((q) => q.status === 'DIPERIKSA').length;
  const totalPatientsPharmacy = queues.filter((q) => q.status === 'FARMASI').length;
  const totalCompleted = queues.filter((q) => q.status === 'SELESAI').length;

  // FEFO Near Expiry calculation (within 90 days from today)
  const today = new Date();
  const ninetyDaysAhead = new Date();
  ninetyDaysAhead.setDate(today.getDate() + 90);

  let nearExpiryCount = 0;
  medicines.forEach((med) => {
    med.batches.forEach((b) => {
      const exp = new Date(b.expiryDate);
      if (exp <= ninetyDaysAhead && b.stock > 0) {
        nearExpiryCount++;
      }
    });
  });

  const totalRevenue = invoices
    .filter((inv) => inv.paymentStatus === 'LUNAS')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 p-6 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Sistem Operasi Fasilitas Kesehatan Mandiri</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">Dashboard Terpadu MediPulse Clinic</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Antrean pasien terintegrasi langsung dengan Rekam Medis Elektronik (RME) ICD-10, sistem dispensing apotek, kartu stok obat FEFO, dan kasir billing otomatis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('reception')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-1.5"
            >
              <Users className="h-4 w-4" />
              <span>Loket Registrasi</span>
            </button>
            <button
              onClick={() => onNavigate('doctor')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Stethoscope className="h-4 w-4 text-emerald-400" />
              <span>Ruang Dokter</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Antrean Menunggu</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalPatientsWaiting}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Poli Umum, Gigi & Anak</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sedang Diperiksa Dokter</span>
            <Stethoscope className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalPatientsDoctor}</div>
          <div className="text-[11px] text-cyan-400/80 mt-1">Pemeriksaan RME Aktif</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Antrean Resep Farmasi</span>
            <Pill className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalPatientsPharmacy}</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Peracikan & Telaah Resep</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Peringatan Kedaluwarsa (FEFO)</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{nearExpiryCount} Batch</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Mendekati &lt;90 Hari Expired</div>
        </div>
      </div>

      {/* Live Operational Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Antrean Berjalan */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/40 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Status Antrean Real-Time</h2>
              <p className="text-xs text-slate-400">Daftar pasien aktif di seluruh loket & poli hari ini</p>
            </div>
            <button
              onClick={() => onNavigate('reception')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>Buka Loket Penuh</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {queues.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Belum ada data antrean hari ini.</p>
            ) : (
              queues.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold px-2 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-400">
                      {item.ticketNumber}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.patientName}</p>
                      <p className="text-xs text-slate-500">{item.medicalRecordNumber} • {item.poli.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.status === 'MENUNGGU'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : item.status === 'DIPERIKSA'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : item.status === 'FARMASI'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : item.status === 'KASIR'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Launchpad & Fast Actions */}
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-900/40 border border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Aksi Cepat Fasilitas</h2>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('reception')}
                className="w-full text-left p-3 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Cetak Tiket Antrean</p>
                  <p className="text-[11px] text-slate-400">Poli Umum, Gigi, & Anak</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('pharmacy')}
                className="w-full text-left p-3 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Cetak Etiket Obat</p>
                  <p className="text-[11px] text-slate-400">Label Putih (Dalam) & Biru (Luar)</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('inventory')}
                className="w-full text-left p-3 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">Audit FEFO Batch Obat</p>
                  <p className="text-[11px] text-slate-400">Cek obat mendekati masa kedaluwarsa</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-800/30 p-5">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
              <div className="flex items-center gap-1.5">
                <Receipt className="h-4 w-4" />
                <span>Omzet Kasir Medis</span>
              </div>
              <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded">Hari Ini</span>
            </div>
            <div className="text-xl font-bold text-white">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Konsolidasi biaya registrasi, jasa dokter, dan penjualan obat apotek.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
