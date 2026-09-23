"use client";

import React, { useState, useEffect } from 'react';
import { Stethoscope, Users, AlertTriangle, ClipboardList } from 'lucide-react';
import { QueueItem, Patient, Medicine, PoliType } from '@/types/medipulse';
import { StorageEngine } from '@/lib/storage';
import { MedicalRecordForm } from './MedicalRecordForm';
import { formatPoliNameIndonesian } from '@/lib/speech-announcer';

export const DoctorStationView: React.FC = () => {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [activePoli, setActivePoli] = useState<PoliType>('POLI_UMUM');
  const [examQueue, setExamQueue] = useState<QueueItem | null>(null);

  const loadData = () => {
    setQueues(StorageEngine.getQueues());
    setPatients(StorageEngine.getPatients());
    setMedicines(StorageEngine.getMedicines());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('medipulse_queues_updated', loadData);
    window.addEventListener('medipulse_patients_updated', loadData);
    window.addEventListener('medipulse_medicines_updated', loadData);
    return () => {
      window.removeEventListener('medipulse_queues_updated', loadData);
      window.removeEventListener('medipulse_patients_updated', loadData);
      window.removeEventListener('medipulse_medicines_updated', loadData);
    };
  }, []);

  const getPatient = (patientId: string) => patients.find((p) => p.id === patientId);

  const activeQueues = queues.filter(
    (q) => q.poli === activePoli && (q.status === 'DIPERIKSA' || q.status === 'MENUNGGU')
  );

  if (examQueue) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <MedicalRecordForm
          queue={examQueue}
          patient={getPatient(examQueue.patientId)}
          medicines={medicines}
          onDone={() => { setExamQueue(null); loadData(); }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wide">
          <Stethoscope className="h-4 w-4" />
          <span>Modul Ruang Dokter & Rekam Medis Elektronik (RME)</span>
        </div>
        <h1 className="text-xl font-bold text-white mt-1">Stasiun Pemeriksaan Dokter — ICD-10 & E-Resep</h1>
      </div>

      {/* Poli Switcher */}
      <div className="flex gap-3">
        {(['POLI_UMUM', 'POLI_GIGI', 'POLI_ANAK'] as PoliType[]).map((poli) => {
          const count = queues.filter((q) => q.poli === poli && (q.status === 'DIPERIKSA' || q.status === 'MENUNGGU')).length;
          return (
            <button
              key={poli}
              onClick={() => setActivePoli(poli)}
              className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                activePoli === poli
                  ? 'bg-cyan-950 border-cyan-600 text-cyan-300 shadow-md'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <span>{formatPoliNameIndonesian(poli)}</span>
              {count > 0 && (
                <span className="ml-2 text-[10px] font-bold bg-cyan-900/60 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded-full">
                  {count} antri
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Queue List */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">
              Antrean {formatPoliNameIndonesian(activePoli)}
            </span>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-lg text-cyan-400 border border-slate-700">
            {activeQueues.length} Pasien
          </span>
        </div>

        {activeQueues.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Tidak ada pasien yang sedang menunggu di {formatPoliNameIndonesian(activePoli)}.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {activeQueues.map((item) => {
              const patient = getPatient(item.patientId);
              const hasAllergy = patient && patient.allergies.length > 0;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-900/50 transition-colors gap-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="font-mono text-sm font-bold text-cyan-400 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-xl shrink-0">
                      {item.ticketNumber}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-200">{item.patientName}</p>
                        {hasAllergy && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded-full animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            Alergi: {patient.allergies.join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {item.medicalRecordNumber}
                        {patient && ` • ${patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • Gol. Darah ${patient.bloodType || '-'}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'DIPERIKSA'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                    <button
                      onClick={() => setExamQueue(item)}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all flex items-center gap-1.5"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      <span>Mulai Pemeriksaan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
