"use client";

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Ticket,
  Volume2,
  Stethoscope,
  XCircle,
  Printer,
  Monitor,
  Plus,
  X
} from 'lucide-react';
import { Patient, QueueItem, PoliType, QueueStatus } from '@/types/medipulse';
import { StorageEngine } from '@/lib/storage';
import { formatPoliNameIndonesian, announceQueue } from '@/lib/speech-announcer';
import { QueueTicketModal } from './QueueTicketModal';
import { PublicDisplayModal } from './PublicDisplayModal';

export const ReceptionView: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected / Form Patient State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [nik, setNik] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bloodType, setBloodType] = useState<'A' | 'B' | 'AB' | 'O'>('O');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  // Queue State
  const [selectedPoli, setSelectedPoli] = useState<PoliType>('POLI_UMUM');

  // Modals
  const [activeModalTicket, setActiveModalTicket] = useState<QueueItem | null>(null);
  const [showPublicDisplay, setShowPublicDisplay] = useState(false);

  const loadData = () => {
    setPatients(StorageEngine.getPatients());
    setQueues(StorageEngine.getQueues());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('medipulse_patients_updated', loadData);
    window.addEventListener('medipulse_queues_updated', loadData);
    return () => {
      window.removeEventListener('medipulse_patients_updated', loadData);
      window.removeEventListener('medipulse_queues_updated', loadData);
    };
  }, []);

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    return `${years} Th ${months} Bln`;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      resetForm();
      return;
    }

    const found = patients.find(
      (p) =>
        p.nik.toLowerCase().includes(query.toLowerCase()) ||
        p.medicalRecordNumber.toLowerCase().includes(query.toLowerCase()) ||
        p.fullName.toLowerCase().includes(query.toLowerCase())
    );

    if (found) {
      setSelectedPatientId(found.id);
      setNik(found.nik);
      setFullName(found.fullName);
      setBirthDate(found.birthDate);
      setGender(found.gender);
      setPhone(found.phone);
      setAddress(found.address);
      setBloodType(found.bloodType || 'O');
      setAllergies(found.allergies || []);
    }
  };

  const resetForm = () => {
    setSelectedPatientId(null);
    setNik('');
    setFullName('');
    setBirthDate('');
    setGender('L');
    setPhone('');
    setAddress('');
    setBloodType('O');
    setAllergies([]);
    setSearchQuery('');
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (tag: string) => {
    setAllergies(allergies.filter((a) => a !== tag));
  };

  const handleRegisterAndTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !nik) {
      alert('Mohon isi Nama Lengkap dan NIK pasien.');
      return;
    }

    let patientId = selectedPatientId;
    let medicalRecordNumber = '';

    if (patientId) {
      const existing = patients.find((p) => p.id === patientId);
      if (existing) medicalRecordNumber = existing.medicalRecordNumber;
    } else {
      const nextIndex = patients.length + 1;
      medicalRecordNumber = `RM-2026-${String(nextIndex).padStart(4, '0')}`;
      patientId = `pat-${Date.now()}`;

      const newPatient: Patient = {
        id: patientId,
        medicalRecordNumber,
        nik,
        fullName,
        birthDate: birthDate || '1990-01-01',
        gender,
        phone,
        address,
        bloodType,
        allergies,
        createdAt: new Date().toISOString(),
      };

      const updatedPatients = [newPatient, ...patients];
      StorageEngine.savePatients(updatedPatients);
    }

    const prefixMap: Record<PoliType, string> = {
      POLI_UMUM: 'A',
      POLI_GIGI: 'G',
      POLI_ANAK: 'K',
    };
    const prefix = prefixMap[selectedPoli];
    const samePoliQueues = queues.filter((q) => q.poli === selectedPoli);
    const ticketSeq = samePoliQueues.length + 1;
    const ticketNumber = `${prefix}-${String(ticketSeq).padStart(2, '0')}`;

    const newQueueItem: QueueItem = {
      id: `q-${Date.now()}`,
      ticketNumber,
      patientId: patientId || `pat-${Date.now()}`,
      patientName: fullName,
      medicalRecordNumber,
      poli: selectedPoli,
      status: 'MENUNGGU',
      calledCount: 0,
      registeredAt: new Date().toISOString(),
    };

    const updatedQueues = [newQueueItem, ...queues];
    StorageEngine.saveQueues(updatedQueues);

    setActiveModalTicket(newQueueItem);
    resetForm();
  };

  const handleCallPatient = (item: QueueItem) => {
    announceQueue(item.ticketNumber, item.poli);
    const updated = queues.map((q) => {
      if (q.id === item.id) {
        return { ...q, calledCount: (q.calledCount || 0) + 1 };
      }
      return q;
    });
    StorageEngine.saveQueues(updated);
  };

  const handleSendToDoctor = (item: QueueItem) => {
    const updated = queues.map((q) => {
      if (q.id === item.id) {
        return {
          ...q,
          status: 'DIPERIKSA' as QueueStatus,
          doctorExaminedAt: new Date().toISOString(),
        };
      }
      return q;
    });
    StorageEngine.saveQueues(updated);
  };

  const handleCancelQueue = (item: QueueItem) => {
    if (!confirm(`Batalkan antrean ${item.ticketNumber} (${item.patientName})?`)) return;
    const updated = queues.map((q) => {
      if (q.id === item.id) {
        return { ...q, status: 'BATAL' as QueueStatus };
      }
      return q;
    });
    StorageEngine.saveQueues(updated);
  };

  const getWaitingAheadCount = (ticket: QueueItem) => {
    return queues.filter(
      (q) => q.poli === ticket.poli && q.status === 'MENUNGGU' && new Date(q.registeredAt) < new Date(ticket.registeredAt)
    ).length;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wide">
            <Users className="h-4 w-4" />
            <span>Modul Loket Registrasi & Antrean</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Pendaftaran Pasien & Pemanggil Suara</h1>
        </div>

        <button
          onClick={() => setShowPublicDisplay(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-950 flex items-center justify-center gap-2"
        >
          <Monitor className="h-4 w-4" />
          <span>Layar Monitor TV Ruang Tunggu</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Form Registrasi Pasien */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-cyan-400" />
              <span>{selectedPatientId ? 'Pasien Terdaftar' : 'Form Registrasi Pasien'}</span>
            </h2>
            {selectedPatientId && (
              <button
                onClick={resetForm}
                className="text-[11px] text-cyan-400 hover:underline font-medium"
              >
                + Buat Baru
              </button>
            )}
          </div>

          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari NIK / No. RM / Nama..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <form onSubmit={handleRegisterAndTicket} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                NIK (16 Digit) *
              </label>
              <input
                type="text"
                required
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="3201..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Nama Lengkap Pasien *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Siti Rahmawati"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                {birthDate && (
                  <p className="text-[10px] text-cyan-400 font-semibold mt-1">
                    Umur: {calculateAge(birthDate)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="L">Laki-Laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  No. WhatsApp / HP
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Golongan Darah
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value as 'A' | 'B' | 'AB' | 'O')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="O">O</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Alamat Domisili
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Merdeka No. 45"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Drug Allergies Tag Input */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Riwayat Alergi Obat
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  placeholder="Misal: Amoxicillin"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {allergies.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(a)}
                        className="hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Poli Selection & Submit Button */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-cyan-400 mb-1 uppercase tracking-wide">
                  Pilihan Poli Tujuan *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'POLI_UMUM', label: 'Poli Umum', prefix: 'A' },
                    { id: 'POLI_GIGI', label: 'Poli Gigi', prefix: 'G' },
                    { id: 'POLI_ANAK', label: 'Poli Anak', prefix: 'K' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPoli(item.id as PoliType)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        selectedPoli === item.id
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-400 font-bold shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <p className="text-xs font-semibold leading-none">{item.label}</p>
                      <p className="text-[10px] opacity-70 mt-1 font-mono">Kode: {item.prefix}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950 transition-all flex items-center justify-center gap-2"
              >
                <Ticket className="h-4 w-4" />
                <span>Daftarkan Pasien & Ambil Tiket Struk</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 7 Cols: Active Queue Management Table */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Daftar Antrean Pasien Hari Ini</h2>
              <p className="text-xs text-slate-400">Panggil suara & kelola status pemeriksaan poli</p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-lg text-cyan-400 border border-slate-700">
              Total: {queues.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                  <th className="py-2.5 px-3">Tiket</th>
                  <th className="py-2.5 px-3">Pasien</th>
                  <th className="py-2.5 px-3">Poli</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Dipanggil</th>
                  <th className="py-2.5 px-3 text-right">Aksi Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {queues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Belum ada data antrean terdaftar hari ini.
                    </td>
                  </tr>
                ) : (
                  queues.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {item.ticketNumber}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-200">{item.patientName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{item.medicalRecordNumber}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {formatPoliNameIndonesian(item.poli)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
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
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {item.calledCount || 0}x
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Voice Call Button */}
                          <button
                            onClick={() => handleCallPatient(item)}
                            className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800/80 transition-colors"
                            title="Panggil Suara (Web Speech API)"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Print Ticket Button */}
                          <button
                            onClick={() => setActiveModalTicket(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Cetak Tiket Thermal"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {/* Send to Doctor */}
                          {item.status === 'MENUNGGU' && (
                            <button
                              onClick={() => handleSendToDoctor(item)}
                              className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-400 text-[10px] font-bold border border-emerald-800 transition-colors flex items-center gap-1"
                              title="Kirim ke Ruang Dokter"
                            >
                              <Stethoscope className="h-3 w-3" />
                              <span>Ke Dokter</span>
                            </button>
                          )}

                          {/* Cancel */}
                          {item.status !== 'SELESAI' && item.status !== 'BATAL' && (
                            <button
                              onClick={() => handleCancelQueue(item)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Batalkan Antrean"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket Print Modal */}
      {activeModalTicket && (
        <QueueTicketModal
          ticket={activeModalTicket}
          waitingAheadCount={getWaitingAheadCount(activeModalTicket)}
          onClose={() => setActiveModalTicket(null)}
        />
      )}

      {/* Public TV Display Modal */}
      {showPublicDisplay && (
        <PublicDisplayModal onClose={() => setShowPublicDisplay(false)} />
      )}
    </div>
  );
};
