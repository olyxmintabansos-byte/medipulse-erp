"use client";

import React, { useState } from 'react';
import { X, Printer, Check, AlertCircle } from 'lucide-react';
import { PrescriptionItem, Patient } from '@/types/medipulse';

interface MedicineLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  prescriptions: PrescriptionItem[];
}

export const MedicineLabelModal: React.FC<MedicineLabelModalProps> = ({
  isOpen,
  onClose,
  patient,
  prescriptions,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const activePrescription = prescriptions[selectedIdx] || prescriptions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 no-print">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Printer className="h-4 w-4 text-cyan-400" />
              <span>Cetak Etiket Label Obat Resmi</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Standar Farmasi: Etiket Putih (Obat Dalam) & Etiket Biru (Obat Luar)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Prescription Selector Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex gap-2 overflow-x-auto no-print">
          {prescriptions.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedIdx === idx
                  ? p.category === 'OBAT_DALAM'
                    ? 'bg-slate-100 text-slate-950 border border-white'
                    : 'bg-blue-600 text-white border border-blue-400'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {p.category === 'OBAT_DALAM' ? '⚪ Putih: ' : '🔵 Biru: '}
              {p.medicineName}
            </button>
          ))}
        </div>

        {/* Label Preview Container */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-950/40">
          {activePrescription && (
            <div
              className={`w-full max-w-md p-6 rounded-xl border-2 transition-all shadow-xl font-sans ${
                activePrescription.category === 'OBAT_DALAM'
                  ? 'bg-white text-slate-950 border-slate-300'
                  : 'bg-blue-50 text-slate-950 border-blue-600'
              }`}
            >
              {/* Header Klinik */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <h4 className="font-extrabold text-sm uppercase tracking-wide">
                  KLINIK PRATAMA SEHAT MANDIRI
                </h4>
                <p className="text-[10px] text-slate-600 leading-tight">
                  SIA: 503/014/FARM/2026 • Apoteker: apt. Sarah Amalia, S.Farm
                </p>
                <p className="text-[10px] text-slate-600">
                  Jl. Merdeka No. 45, Jakarta • Telp: (021) 555-0199
                </p>
              </div>

              {/* Patient Info */}
              <div className="py-2.5 text-xs border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">No. Resep:</span>
                  <span className="font-mono font-bold">{patient.medicalRecordNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Tanggal:</span>
                  <span>{currentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Nama Pasien:</span>
                  <span className="font-bold text-slate-900">{patient.fullName}</span>
                </div>
              </div>

              {/* Medicine & Signa Instruction */}
              <div className="py-4 text-center space-y-2">
                <div className="text-sm font-bold text-slate-950">
                  {activePrescription.medicineName}
                </div>
                <div className="text-xs text-slate-600">
                  Jumlah: <span className="font-bold">{activePrescription.quantity} {activePrescription.unit}</span>
                </div>

                <div
                  className={`py-2 px-3 rounded-lg font-bold text-base tracking-wide ${
                    activePrescription.category === 'OBAT_DALAM'
                      ? 'bg-slate-100 border border-slate-300 text-slate-900'
                      : 'bg-blue-600 text-white shadow-sm'
                  }`}
                >
                  {activePrescription.dosageRule}
                </div>

                {activePrescription.notes && (
                  <p className="text-[11px] italic text-slate-600">
                    Catatan: {activePrescription.notes}
                  </p>
                )}
              </div>

              {/* Footer Indicator / Warning Banner */}
              {activePrescription.category === 'OBAT_LUAR' ? (
                <div className="mt-2 py-1.5 px-2 bg-blue-700 text-white text-[11px] font-black text-center uppercase tracking-wider rounded border border-blue-900">
                  ⚠️ OBAT LUAR — TIDAK BOLEH DITELAN ⚠️
                </div>
              ) : (
                <div className="mt-2 py-1 px-2 text-[10px] text-center text-slate-500 font-semibold border-t border-slate-200">
                  Simpan di tempat sejuk (15-25°C) & terlindung dari cahaya matahari
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between no-print">
          <div className="text-xs text-slate-400">
            Total Etiket: <strong className="text-white">{prescriptions.length} Obat</strong>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Etiket Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
