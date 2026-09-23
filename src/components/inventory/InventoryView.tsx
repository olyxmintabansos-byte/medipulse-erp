"use client";

import React, { useEffect, useState } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { StorageEngine } from '@/lib/storage';
import { Medicine } from '@/types/medipulse';
import { AddMedicineModal } from './AddMedicineModal';

export const InventoryView: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LOW_STOCK' | 'NEAR_EXPIRY'>('ALL');
  const [expandedMedIds, setExpandedMedIds] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedMedForBatch, setSelectedMedForBatch] = useState<Medicine | null>(null);

  const loadMedicines = () => {
    setMedicines(StorageEngine.getMedicines());
  };

  useEffect(() => {
    loadMedicines();
    window.addEventListener('medipulse_medicines_updated', loadMedicines);
    return () => window.removeEventListener('medipulse_medicines_updated', loadMedicines);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedMedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const today = new Date();
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(today.getDate() + 30);
  const ninetyDaysAhead = new Date();
  ninetyDaysAhead.setDate(today.getDate() + 90);

  // Compute stats
  let totalStockCount = 0;
  let lowStockCount = 0;
  let nearExpiryCount = 0;

  medicines.forEach((med) => {
    const totalMedStock = med.batches.reduce((sum, b) => sum + b.stock, 0);
    totalStockCount += totalMedStock;
    if (totalMedStock <= med.minStockAlert) {
      lowStockCount++;
    }
    med.batches.forEach((b) => {
      const exp = new Date(b.expiryDate);
      if (exp <= ninetyDaysAhead && b.stock > 0) {
        nearExpiryCount++;
      }
    });
  });

  // Filtered Medicines
  const filteredMedicines = medicines.filter((med) => {
    const totalMedStock = med.batches.reduce((sum, b) => sum + b.stock, 0);
    const matchesSearch =
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === 'ALL' || med.category === filterCategory;

    if (!matchesSearch || !matchesCategory) return false;

    if (filterStatus === 'LOW_STOCK') {
      return totalMedStock <= med.minStockAlert;
    }
    if (filterStatus === 'NEAR_EXPIRY') {
      return med.batches.some(
        (b) => new Date(b.expiryDate) <= ninetyDaysAhead && b.stock > 0
      );
    }
    return true;
  });

  const exportCSV = () => {
    const rows = [
      ['Kode Obat', 'Nama Obat', 'Kategori', 'Satuan', 'No Batch', 'Expired Date', 'Stok', 'Harga Jual'].join(','),
    ];
    medicines.forEach((m) => {
      m.batches.forEach((b) => {
        rows.push([m.code, `"${m.name}"`, m.category, m.unit, b.batchNumber, b.expiryDate, b.stock, b.sellingPrice].join(','));
      });
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stok-obat-fefo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Boxes className="h-4 w-4" />
            <span>Smart Inventory & FEFO Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Gudang Farmasi & Radar Kedaluwarsa</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manajemen stok obat multi-batch terintegrasi dengan pemantauan First Expired, First Out.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setSelectedMedForBatch(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Obat / Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Total Macam Obat</div>
          <div className="text-2xl font-bold text-white mt-1">{medicines.length} SKU</div>
          <div className="text-[11px] text-slate-500 mt-1">Obat Oral & Topikal</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Total Kuantitas Fisik</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{totalStockCount} Unit</div>
          <div className="text-[11px] text-cyan-400/70 mt-1">Seluruh Batch Aktif</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Stok Kritis / Menipis</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{lowStockCount} SKU</div>
          <div className="text-[11px] text-amber-400/70 mt-1">Di bawah batas alert</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Peringatan Expired (&lt;90 Hari)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{nearExpiryCount} Batch</div>
          <div className="text-[11px] text-rose-400/70 mt-1">Prioritaskan FEFO keluar</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode atau nama obat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="OBAT_DALAM">Obat Dalam</option>
            <option value="OBAT_LUAR">Obat Luar</option>
          </select>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus('LOW_STOCK')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'LOW_STOCK' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stok Tipis
            </button>
            <button
              onClick={() => setFilterStatus('NEAR_EXPIRY')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'NEAR_EXPIRY' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Radar Expired (&lt;90h)
            </button>
          </div>
        </div>
      </div>

      {/* Main Inventory Table with Expandable Batches */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Nama Obat</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Total Stok</th>
                <th className="py-3 px-4">Status & Radar FEFO</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Tidak ada data obat yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const totalStock = med.batches.reduce((sum, b) => sum + b.stock, 0);
                  const isLow = totalStock <= med.minStockAlert;
                  const isExpanded = !!expandedMedIds[med.id];

                  // Check batches nearest expiry
                  const nearestBatch = [...med.batches].sort(
                    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                  )[0];

                  const daysUntilNearest = nearestBatch
                    ? Math.ceil(
                        (new Date(nearestBatch.expiryDate).getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 999;

                  return (
                    <React.Fragment key={med.id}>
                      <tr className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold">
                          {med.code}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div>{med.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Sediaan: {med.unit} • Batas Alert: {med.minStockAlert} {med.unit}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              med.category === 'OBAT_DALAM'
                                ? 'bg-white text-slate-950'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {med.category === 'OBAT_DALAM' ? 'Obat Dalam' : 'Obat Luar'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-bold ${isLow ? 'text-amber-400' : 'text-slate-200'}`}>
                            {totalStock} {med.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isLow && (
                              <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-semibold">
                                Stok Tipis
                              </span>
                            )}
                            {daysUntilNearest <= 30 ? (
                              <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-bold">
                                Kritis ({daysUntilNearest} hari)
                              </span>
                            ) : daysUntilNearest <= 90 ? (
                              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-semibold">
                                Warning ({daysUntilNearest} hari)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-medium">
                                Aman (&gt;90h)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedMedForBatch(med);
                                setIsModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                            >
                              + Restock
                            </button>
                            <button
                              onClick={() => toggleExpand(med.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                              title="Tampilkan Batch"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Batches Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70">
                          <td colSpan={6} className="p-4">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
                              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5" />
                                <span>Daftar Multi-Batch (Prioritas Pengurangan FEFO)</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                {med.batches.map((batch) => {
                                  const batchDays = Math.ceil(
                                    (new Date(batch.expiryDate).getTime() - today.getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  );

                                  return (
                                    <div
                                      key={batch.id}
                                      className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-bold text-white">
                                          {batch.batchNumber}
                                        </span>
                                        <span
                                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                            batchDays <= 30
                                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                              : batchDays <= 90
                                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                          }`}
                                        >
                                          Exp: {batch.expiryDate}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-[11px] text-slate-400">
                                        <span>Sisa Stok:</span>
                                        <strong className="text-white">{batch.stock} {med.unit}</strong>
                                      </div>
                                      <div className="flex justify-between text-[11px] text-slate-400">
                                        <span>Beli / Jual:</span>
                                        <span>
                                          Rp {batch.purchasePrice.toLocaleString('id-ID')} /{' '}
                                          <strong className="text-emerald-400">
                                            Rp {batch.sellingPrice.toLocaleString('id-ID')}
                                          </strong>
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Restock Modal */}
      <AddMedicineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMedForBatch(null);
        }}
        existingMedicines={medicines}
        selectedMedicineForBatch={selectedMedForBatch}
      />
    </div>
  );
};
