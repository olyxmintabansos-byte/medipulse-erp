"use client";

import React, { useState, useMemo } from 'react';
import { Search, Plus, X, FileText, Stethoscope, Activity } from 'lucide-react';
import { QueueItem, Patient, Medicine, MedicalRecord, PrescriptionItem, ICD10Item, VitalSigns } from '@/types/medipulse';
import { StorageEngine } from '@/lib/storage';
import { ICD10_DICTIONARY } from '@/lib/mock-data';
import { PrescriptionBuilder } from './PrescriptionBuilder';
import { MedicalSummaryModal } from './MedicalSummaryModal';

interface MedicalRecordFormProps {
  queue: QueueItem;
  patient: Patient | undefined;
  medicines: Medicine[];
  onDone: () => void;
}

const calcBMI = (weight: number, height: number) => {
  if (!weight || !height) return { bmi: 0, status: '-' };
  const h = height / 100;
  const bmi = weight / (h * h);
  let status = '';
  if (bmi < 18.5) status = 'Berat Badan Kurang';
  else if (bmi < 25) status = 'Normal';
  else if (bmi < 30) status = 'Kelebihan Berat Badan';
  else status = 'Obesitas';
  return { bmi: parseFloat(bmi.toFixed(1)), status };
};

const calcBPCategory = (systolic: number, diastolic: number) => {
  if (!systolic || !diastolic) return { label: '-', color: 'text-slate-400' };
  if (systolic < 120 && diastolic < 80) return { label: 'Normal', color: 'text-emerald-400' };
  if (systolic < 130 && diastolic < 80) return { label: 'Pre-Hipertensi', color: 'text-amber-400' };
  return { label: 'Hipertensi', color: 'text-rose-400' };
};

export const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  queue,
  patient,
  medicines,
  onDone,
}) => {
  const [anamnesis, setAnamnesis] = useState('');
  const [physicalExam, setPhysicalExam] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [vitals, setVitals] = useState<VitalSigns>({
    systolic: 120, diastolic: 80, heartRate: 80,
    respiratoryRate: 18, temperature: 36.5,
    weight: 60, height: 165, oxygenSaturation: 98,
  });
  const [icdQuery, setIcdQuery] = useState('');
  const [primaryDx, setPrimaryDx] = useState<ICD10Item | null>(null);
  const [secondaryDx, setSecondaryDx] = useState<ICD10Item[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [savedRecord, setSavedRecord] = useState<MedicalRecord | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const filteredICD = useMemo(() => {
    if (!icdQuery.trim()) return [];
    const q = icdQuery.toLowerCase();
    return ICD10_DICTIONARY.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.nameIndonesian.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [icdQuery]);

  const { bmi, status: bmiStatus } = calcBMI(vitals.weight, vitals.height);
  const bpCat = calcBPCategory(vitals.systolic, vitals.diastolic);

  const updateVital = (key: keyof VitalSigns, val: string) => {
    setVitals((prev) => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const addSecondaryDx = (item: ICD10Item) => {
    if (!secondaryDx.find((d) => d.code === item.code) && item.code !== primaryDx?.code) {
      setSecondaryDx([...secondaryDx, item]);
    }
    setIcdQuery('');
  };

  const handleSaveAndDispatch = () => {
    if (!primaryDx) { alert('Mohon pilih Diagnosis Primer (ICD-10).'); return; }
    if (!anamnesis.trim()) { alert('Mohon isi kolom Anamnesis / Keluhan Utama.'); return; }

    const records = StorageEngine.getMedicalRecords();
    const consultFee = 75000;

    const newRecord: MedicalRecord = {
      id: `rec-${Date.now()}`,
      queueId: queue.id,
      patientId: queue.patientId,
      doctorName: 'dr. Pratama, Sp.A',
      poli: queue.poli,
      anamnesis,
      vitals,
      physicalExamination: physicalExam,
      primaryDiagnosis: primaryDx,
      secondaryDiagnoses: secondaryDx.length > 0 ? secondaryDx : undefined,
      prescriptions,
      doctorNotes,
      consultationFee: consultFee,
      createdAt: new Date().toISOString(),
    };

    StorageEngine.saveMedicalRecords([newRecord, ...records]);

    const queues = StorageEngine.getQueues();
    const nextStatus = prescriptions.length > 0 ? 'FARMASI' : 'KASIR';
    const updated = queues.map((q) => {
      if (q.id === queue.id) {
        return {
          ...q,
          status: nextStatus as 'FARMASI' | 'KASIR',
          pharmacyDispensedAt: prescriptions.length > 0 ? new Date().toISOString() : undefined,
        };
      }
      return q;
    });
    StorageEngine.saveQueues(updated);

    setSavedRecord(newRecord);
    setShowSummaryModal(true);
  };

  return (
    <div className="flex flex-col gap-5 pb-8 max-w-4xl mx-auto">
      {/* Patient Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Rekam Medis Elektronik — {queue.poli.replace('_', ' ')}</p>
          <h2 className="text-lg font-bold text-white mt-1">{queue.patientName}</h2>
          <p className="text-xs font-mono text-slate-400">{queue.medicalRecordNumber} • Tiket: <span className="text-cyan-400 font-bold">{queue.ticketNumber}</span></p>
        </div>
        {patient && patient.allergies.length > 0 && (
          <div className="bg-rose-950/70 border border-rose-700 rounded-xl px-4 py-2 animate-pulse flex-shrink-0">
            <p className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>PERINGATAN ALERGI</span>
            </p>
            <p className="text-xs text-rose-200 mt-0.5">{patient.allergies.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Anamnesis */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          <span>Anamnesis & Keluhan</span>
        </h3>
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Keluhan Utama (Chief Complaint) *</label>
          <textarea
            required
            rows={2}
            value={anamnesis}
            onChange={(e) => setAnamnesis(e.target.value)}
            placeholder="Pasien datang dengan keluhan demam 3 hari, batuk berdahak, dan pilek..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Pemeriksaan Fisik & Temuan Objektif</label>
          <textarea
            rows={2}
            value={physicalExam}
            onChange={(e) => setPhysicalExam(e.target.value)}
            placeholder="Kesadaran Kompos Mentis, Konjungtiva anemis (-), Sklera ikterik (-), Ronkhi (-/-), Wheezing (-/-)"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
          />
        </div>
      </div>

      {/* Vital Signs */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" />
          <span>Tanda-Tanda Vital (Vital Signs)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Sistolik (mmHg)', key: 'systolic' as keyof VitalSigns },
            { label: 'Diastolik (mmHg)', key: 'diastolic' as keyof VitalSigns },
            { label: 'Nadi (bpm)', key: 'heartRate' as keyof VitalSigns },
            { label: 'Laju Napas (x/mnt)', key: 'respiratoryRate' as keyof VitalSigns },
            { label: 'Suhu Tubuh (°C)', key: 'temperature' as keyof VitalSigns },
            { label: 'SpO2 (%)', key: 'oxygenSaturation' as keyof VitalSigns },
            { label: 'Berat Badan (kg)', key: 'weight' as keyof VitalSigns },
            { label: 'Tinggi Badan (cm)', key: 'height' as keyof VitalSigns },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">{label}</label>
              <input
                type="number"
                step="0.1"
                value={vitals[key]}
                onChange={(e) => updateVital(key, e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          ))}
        </div>

        {/* Auto calculated values */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Tekanan Darah:</span>
            <span className={`text-xs font-bold ${bpCat.color}`}>{bpCat.label}</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">BMI: <span className="font-mono text-white">{bmi}</span></span>
            <span className={`text-xs font-bold ${bmi < 18.5 ? 'text-blue-400' : bmi < 25 ? 'text-emerald-400' : bmi < 30 ? 'text-amber-400' : 'text-rose-400'}`}>
              {bmiStatus}
            </span>
          </div>
        </div>
      </div>

      {/* ICD-10 Diagnosis */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Stethoscope className="h-3.5 w-3.5" />
          <span>Diagnosis ICD-10</span>
        </h3>

        {/* ICD Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={icdQuery}
            onChange={(e) => setIcdQuery(e.target.value)}
            placeholder="Ketik nama penyakit atau kode ICD-10 (misal: ISPA, J06.9, Hipertensi)"
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
          {filteredICD.length > 0 && (
            <div className="absolute top-full mt-1 left-0 w-full bg-slate-900 border border-slate-700 rounded-xl z-20 overflow-hidden shadow-xl">
              {filteredICD.map((item) => (
                <div
                  key={item.code}
                  className="px-4 py-2.5 hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 last:border-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs text-cyan-400 font-bold">{item.code}</span>
                      <span className="text-xs text-slate-200 ml-2">{item.nameIndonesian}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => { setPrimaryDx(item); setIcdQuery(''); }}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-900 text-cyan-400 border border-cyan-700 hover:bg-cyan-800 font-semibold"
                      >
                        Primer
                      </button>
                      <button
                        type="button"
                        onClick={() => addSecondaryDx(item)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 font-semibold"
                      >
                        Sekunder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Diagnoses */}
        <div className="space-y-2">
          {primaryDx ? (
            <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-800/60 rounded-xl px-3 py-2">
              <span className="text-[10px] font-bold text-white bg-cyan-700 px-1.5 py-0.5 rounded shrink-0">PRIMER</span>
              <span className="font-mono text-xs font-bold text-cyan-300">{primaryDx.code}</span>
              <span className="text-xs text-slate-200 flex-1">{primaryDx.nameIndonesian}</span>
              <button onClick={() => setPrimaryDx(null)} className="text-slate-500 hover:text-rose-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-amber-400 flex items-center gap-1">
              <span>⚠️</span>
              <span>Diagnosis Primer wajib dipilih sebelum menyimpan rekam medis.</span>
            </p>
          )}
          {secondaryDx.map((d) => (
            <div key={d.code} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded shrink-0">SEKUNDER</span>
              <span className="font-mono text-xs font-bold text-slate-400">{d.code}</span>
              <span className="text-xs text-slate-300 flex-1">{d.nameIndonesian}</span>
              <button onClick={() => setSecondaryDx(secondaryDx.filter((x) => x.code !== d.code))} className="text-slate-500 hover:text-rose-400">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* E-Prescription Builder */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
        <PrescriptionBuilder
          medicines={medicines}
          patientAllergies={patient?.allergies || []}
          prescriptions={prescriptions}
          onPrescriptionsChange={setPrescriptions}
        />
      </div>

      {/* Doctor Notes */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
        <label className="block text-[11px] font-medium text-slate-400 mb-1">Catatan & Instruksi Dokter (Tambahan)</label>
        <textarea
          rows={2}
          value={doctorNotes}
          onChange={(e) => setDoctorNotes(e.target.value)}
          placeholder="Misal: Pasien dianjurkan istirahat 3 hari, kembali kontrol jika demam tidak turun dalam 2 hari."
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
        >
          Kembali ke Daftar Antrean
        </button>
        <button
          type="button"
          onClick={handleSaveAndDispatch}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {prescriptions.length > 0 ? 'Simpan RME & Kirim ke Farmasi' : 'Simpan RME & Kirim ke Kasir'}
        </button>
      </div>

      {showSummaryModal && savedRecord && (
        <MedicalSummaryModal
          record={savedRecord}
          patient={patient}
          onClose={() => { setShowSummaryModal(false); onDone(); }}
        />
      )}
    </div>
  );
};
