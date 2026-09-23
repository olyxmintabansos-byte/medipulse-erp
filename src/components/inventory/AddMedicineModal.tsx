"use client";

import React, { useState } from 'react';
import { X, Plus, PackagePlus, Layers } from 'lucide-react';
import { Medicine, MedicineBatch } from '@/types/medipulse';
import { StorageEngine } from '@/lib/storage';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMedicines: Medicine[];
  selectedMedicineForBatch?: Medicine | null;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  isOpen,
  onClose,
  existingMedicines,
  selectedMedicineForBatch,
}) => {
  const [mode, setMode] = useState<'NEW_MEDICINE' | 'ADD_BATCH'>(
    selectedMedicineForBatch ? 'ADD_BATCH' : 'NEW_MEDICINE'
  );

  // New Medicine Form State
  const [code, setCode] = useState<string>('OBT-0' + Math.floor(10 + Math.random() * 90));
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<'OBAT_DALAM' | 'OBAT_LUAR'>('OBAT_DALAM');
  const [unit, setUnit] = useState<string>('Tablet');
  const [minStockAlert, setMinStockAlert] = useState<number>(50);

  // Batch Form State
  const [selectedMedId, setSelectedMedId] = useState<string>(
    selectedMedicineForBatch ? selectedMedicineForBatch.id : existingMedicines[0]?.id || ''
  );
  const [batchNumber, setBatchNumber] = useState<string>('BATCH-2026-X' + Math.floor(10 + Math.random() * 90));
  const [expiryDate, setExpiryDate] = useState<string>('2027-06-30');
  const [stock, setStock] = useState<number>(100);
  const [purchasePrice, setPurchasePrice] = useState<number>(500);
  const [sellingPrice, setSellingPrice] = useState<number>(1200);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentMeds = [...StorageEngine.getMedicines()];

    if (mode === 'NEW_MEDICINE') {
      if (!name.trim()) {
        alert('Nama obat wajib diisi!');
        return;
      }

      const initialBatch: MedicineBatch = {
        id: `batch-${Date.now()}`,
        batchNumber,
        expiryDate,
        stock: Number(stock),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
      };

      const newMedicine: Medicine = {
        id: `med-${Date.now()}`,
        code,
        name,
        category,
        unit,
        minStockAlert: Number(minStockAlert),
        batches: [initialBatch],
      };

      currentMeds.push(newMedicine);
      StorageEngine.saveMedicines(currentMeds);
    } else {
      // Add batch to existing medicine
      const targetMed = currentMeds.find((m) => m.id === selectedMedId);
      if (!targetMed) {
        alert('Pilih obat tujuan!');
        return;
      }

      const newBatch: MedicineBatch = {
        id: `batch-${Date.now()}`,
        batchNumber,
        expiryDate,
        stock: Number(stock),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
      };

      targetMed.batches.push(newBatch);
      StorageEngine.saveMedicines(currentMeds);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              {mode === 'NEW_MEDICINE' ? 'Tambah Master Obat Baru' : 'Penerimaan Batch Baru (Restock)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('NEW_MEDICINE')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'NEW_MEDICINE'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            + Master Obat Baru
          </button>
          <button
            type="button"
            onClick={() => setMode('ADD_BATCH')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'ADD_BATCH'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            + Tambah Batch Restock
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'NEW_MEDICINE' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Kode Obat</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="OBAT_DALAM">Obat Dalam (Oral / Putih)</option>
                    <option value="OBAT_LUAR">Obat Luar (Topikal / Biru)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Nama Obat Lengkap & Dosis</label>
                <input
                  type="text"
                  placeholder="Contoh: Ibuprofen 400mg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Bentuk Sediaan</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Kapsul">Kapsul</option>
                    <option value="Sirup">Sirup</option>
                    <option value="Tube">Tube (Salep)</option>
                    <option value="Botol">Botol</option>
                    <option value="Ampul">Ampul</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Batas Minimum Peringatan Stok</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    required
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs text-slate-400 font-medium">Pilih Obat yang Direstock</label>
              <select
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                {existingMedicines.map((med) => (
                  <option key={med.id} value={med.id}>
                    [{med.code}] {med.name} ({med.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Batch Information Section */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>Rincian Batch Masuk (FEFO Tracking)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Nomor Batch Pabrik</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Tanggal Kedaluwarsa (Expired)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Kuantitas Masuk</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  min={1}
                  required
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Harga Beli (Rp)</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  min={0}
                  required
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Harga Jual (Rp)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  min={0}
                  required
                  className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20"
            >
              Simpan Data Obat & Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
