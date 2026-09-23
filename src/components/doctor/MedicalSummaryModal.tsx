"use client";

import React from 'react';
import { X, Printer, HeartPulse } from 'lucide-react';
import { MedicalRecord, Patient } from '@/types/medipulse';

interface MedicalSummaryModalProps {
  record: MedicalRecord;
  patient: Patient | undefined;
  onClose: () => void;
}

export const MedicalSummaryModal: React.FC<MedicalSummaryModalProps> = ({
  record,
  patient,
  onClose,
}) => {
  const bmi = record.vitals.weight && record.vitals.height
    ? (record.vitals.weight / Math.pow(record.vitals.height / 100, 2)).toFixed(1)
    : '-';

  const createdDate = new Date(record.createdAt).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl my-4" id="medical-summary-print">
        {/* Actions Bar - no-print */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-100 rounded-t-2xl border-b border-slate-200 no-print">
          <span className="text-xs font-semibold text-slate-500">Resume Medis Pasien — Format A4</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak / PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-8 font-sans text-sm space-y-5">
          {/* Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-10 w-10 text-slate-800" />
              <div>
                <h1 className="font-black text-lg uppercase tracking-tight">Klinik Pratama Sehat Mandiri</h1>
                <p className="text-xs text-slate-500">Jl. Merdeka No. 45, Jakarta Selatan | (021) 555-0123</p>
                <p className="text-xs text-slate-500">SIP Klinik: 503/KLINIK-0291/DINKES/2024</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Tanggal Pemeriksaan:</p>
              <p className="font-semibold text-sm">{createdDate}</p>
              <p className="text-xs text-slate-500 mt-1">No. RM: <span className="font-mono font-bold">{record.patientId}</span></p>
            </div>
          </div>

          {/* Patient Identity */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Data Identitas Pasien</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
              <div><span className="text-slate-500">Nama Lengkap:</span> <span className="font-semibold">{patient?.fullName || '-'}</span></div>
              <div><span className="text-slate-500">NIK:</span> <span className="font-mono">{patient?.nik || '-'}</span></div>
              <div><span className="text-slate-500">Jenis Kelamin:</span> <span>{patient?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span></div>
              <div><span className="text-slate-500">Tanggal Lahir:</span> <span>{patient?.birthDate || '-'}</span></div>
              <div><span className="text-slate-500">Golongan Darah:</span> <span>{patient?.bloodType || '-'}</span></div>
              <div><span className="text-slate-500">Alergi Obat:</span> <span className="text-rose-600 font-semibold">{patient?.allergies?.join(', ') || 'Tidak ada'}</span></div>
            </div>
          </div>

          {/* Vital Signs */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Tanda-Tanda Vital</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'TD', value: `${record.vitals.systolic}/${record.vitals.diastolic} mmHg` },
                { label: 'Nadi', value: `${record.vitals.heartRate} bpm` },
                { label: 'Suhu', value: `${record.vitals.temperature}°C` },
                { label: 'SpO2', value: `${record.vitals.oxygenSaturation}%` },
                { label: 'RR', value: `${record.vitals.respiratoryRate}x/mnt` },
                { label: 'BB', value: `${record.vitals.weight} kg` },
                { label: 'TB', value: `${record.vitals.height} cm` },
                { label: 'BMI', value: `${bmi}` },
              ].map((v) => (
                <div key={v.label} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-slate-400">{v.label}</p>
                  <p className="font-bold text-sm">{v.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Anamnesis & Physical Exam */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Anamnesis & Pemeriksaan</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50 w-40">Keluhan Utama</td>
                    <td className="py-2.5 px-3 text-slate-800">{record.anamnesis}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50">Pemeriksaan Fisik</td>
                    <td className="py-2.5 px-3 text-slate-800">{record.physicalExamination}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Diagnosis</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="text-[10px] font-bold text-white bg-slate-700 px-2 py-0.5 rounded">PRIMER</span>
                <span className="font-mono font-bold text-slate-700">{record.primaryDiagnosis.code}</span>
                <span className="text-slate-800">{record.primaryDiagnosis.nameIndonesian}</span>
              </div>
              {record.secondaryDiagnoses?.map((d) => (
                <div key={d.code} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">SEKUNDER</span>
                  <span className="font-mono font-bold text-slate-600">{d.code}</span>
                  <span className="text-slate-700">{d.nameIndonesian}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prescription */}
          {record.prescriptions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Resep Obat</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-400 font-semibold">
                      <th className="py-2 px-3 text-left">Nama Obat</th>
                      <th className="py-2 px-3 text-left">Aturan Pakai</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-center">Ket.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {record.prescriptions.map((p, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{i + 1}. {p.medicineName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{p.dosageRule}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{p.quantity} {p.unit}</td>
                        <td className="py-2.5 px-3 text-center text-[10px]">{p.category === 'OBAT_LUAR' ? 'Luar' : 'Dalam'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Doctor Notes & Signature */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Catatan & Instruksi Dokter</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 min-h-[40px]">
              {record.doctorNotes || 'Tidak ada catatan tambahan.'}
            </div>
          </div>

          {/* Signature Line */}
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
            <div className="text-center min-w-[200px]">
              <p className="text-xs text-slate-500">Dokter Pemeriksa,</p>
              <div className="h-16 border-b border-slate-300 mt-2 mb-1" />
              <p className="font-bold text-sm">{record.doctorName}</p>
              <p className="text-xs text-slate-500">SIP. Dokter / Spesialis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
