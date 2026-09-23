"use client";

import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle, X, Pill } from 'lucide-react';
import { Medicine, PrescriptionItem } from '@/types/medipulse';

const SIGNA_OPTIONS = [
  '3x1 Sehari Sesudah Makan',
  '3x1 Sehari Sebelum Makan',
  '2x1 Sehari Sesudah Makan',
  '2x1 Sehari Sebelum Makan',
  '1x1 Sehari Pagi Hari',
  '1x1 Sehari Malam Hari',
  '1x1 Sehari Sebelum Tidur',
  '4x1 Sehari (Setiap 6 Jam)',
  '3x1/2 Tablet Sehari Sesudah Makan',
  'Oleskan 2x Sehari pada Area yang Sakit',
  'Gunakan 1x Sehari sesuai Petunjuk Dokter',
];

interface PrescriptionBuilderProps {
  medicines: Medicine[];
  patientAllergies: string[];
  prescriptions: PrescriptionItem[];
  onPrescriptionsChange: (items: PrescriptionItem[]) => void;
}

export const PrescriptionBuilder: React.FC<PrescriptionBuilderProps> = ({
  medicines,
  patientAllergies,
  prescriptions,
  onPrescriptionsChange,
}) => {
  const [selectedMedId, setSelectedMedId] = useState('');
  const [signa, setSigna] = useState(SIGNA_OPTIONS[0]);
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');
  const [allergyWarning, setAllergyWarning] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<PrescriptionItem | null>(null);

  const getSelectedMedicine = () => medicines.find((m) => m.id === selectedMedId);

  const checkAndAdd = () => {
    const med = getSelectedMedicine();
    if (!med) return;

    const allergyMatch = patientAllergies.find((a) =>
      med.name.toLowerCase().includes(a.toLowerCase())
    );

    const item: PrescriptionItem = {
      medicineId: med.id,
      medicineName: med.name,
      dosageRule: signa,
      quantity,
      unit: med.unit,
      category: med.category,
      notes: notes || undefined,
    };

    if (allergyMatch) {
      setAllergyWarning(allergyMatch);
      setPendingItem(item);
      return;
    }

    onPrescriptionsChange([...prescriptions, item]);
    resetInputs();
  };

  const confirmOverrideAllergy = () => {
    if (pendingItem) {
      onPrescriptionsChange([...prescriptions, pendingItem]);
    }
    setAllergyWarning(null);
    setPendingItem(null);
    resetInputs();
  };

  const resetInputs = () => {
    setSelectedMedId('');
    setSigna(SIGNA_OPTIONS[0]);
    setQuantity(10);
    setNotes('');
  };

  const removeItem = (idx: number) => {
    onPrescriptionsChange(prescriptions.filter((_, i) => i !== idx));
  };

  const selectedMed = getSelectedMedicine();

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
        <Pill className="h-3.5 w-3.5" />
        <span>E-Resep Elektronik Farmasi</span>
      </h3>

      {/* Allergy Safety Warning Modal */}
      {allergyWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-rose-950/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-950 border border-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-400 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-rose-300 text-sm">PERINGATAN KEAMANAN RESEP</p>
                <p className="text-[11px] text-slate-400">Drug Allergy Safety Check</p>
              </div>
            </div>
            <p className="text-sm text-slate-200 mb-1">
              Pasien tercatat memiliki riwayat alergi terhadap:
            </p>
            <p className="text-base font-bold text-rose-300 mb-3">⚠️ {allergyWarning}</p>
            <p className="text-xs text-slate-400 mb-5">
              Obat yang dipilih kemungkinan mengandung zat yang bertentangan dengan alergi pasien. Tetap lanjutkan hanya atas pertimbangan klinis dokter yang bertanggung jawab.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setAllergyWarning(null); setPendingItem(null); }}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
              >
                Batal, Ganti Obat
              </button>
              <button
                onClick={confirmOverrideAllergy}
                className="flex-1 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold"
              >
                Lanjutkan (Override)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Input Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
        <div className="sm:col-span-4">
          <label className="block text-[10px] font-medium text-slate-400 mb-1">Pilih Obat Apotek</label>
          <select
            value={selectedMedId}
            onChange={(e) => setSelectedMedId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">-- Pilih Obat --</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.unit})
              </option>
            ))}
          </select>
          {selectedMed && (
            <p className={`text-[10px] mt-1 font-semibold ${selectedMed.category === 'OBAT_LUAR' ? 'text-blue-400' : 'text-emerald-400'}`}>
              {selectedMed.category === 'OBAT_LUAR' ? '🔵 Etiket Biru (Obat Luar)' : '⚪ Etiket Putih (Obat Dalam)'}
            </p>
          )}
        </div>

        <div className="sm:col-span-4">
          <label className="block text-[10px] font-medium text-slate-400 mb-1">Aturan Pakai / Signa</label>
          <select
            value={signa}
            onChange={(e) => setSigna(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {SIGNA_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-medium text-slate-400 mb-1">Jumlah</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-2 flex items-end">
          <button
            type="button"
            onClick={checkAndAdd}
            disabled={!selectedMedId}
            className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah</span>
          </button>
        </div>

        <div className="sm:col-span-12">
          <label className="block text-[10px] font-medium text-slate-400 mb-1">Catatan Khusus Racikan (Opsional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Misal: Haluskan, campur dengan madu, dll."
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Prescription Items List */}
      {prescriptions.length > 0 && (
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 text-left">#</th>
                <th className="py-2.5 px-3 text-left">Nama Obat</th>
                <th className="py-2.5 px-3 text-left">Aturan Pakai</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-center">Kategori</th>
                <th className="py-2.5 px-3 text-right">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {prescriptions.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{item.medicineName}</td>
                  <td className="py-2.5 px-3 text-slate-300">{item.dosageRule}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-300">{item.quantity} {item.unit}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.category === 'OBAT_LUAR' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-slate-800 text-slate-300'}`}>
                      {item.category === 'OBAT_LUAR' ? 'Luar' : 'Dalam'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button onClick={() => removeItem(idx)} className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {prescriptions.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4 border border-dashed border-slate-800 rounded-xl">
          Belum ada item resep. Pasien akan langsung diarahkan ke Kasir jika tidak ada resep.
        </p>
      )}
    </div>
  );
};
