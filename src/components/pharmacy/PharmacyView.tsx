"use client";

import React, { useEffect, useState } from 'react';
import { 
  Pill, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  UserCheck, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { StorageEngine } from '@/lib/storage';
import { QueueItem, Patient, Medicine, PrescriptionItem, BillingInvoice, BillingItem } from '@/types/medipulse';
import { MedicineLabelModal } from './MedicineLabelModal';

export const PharmacyView: React.FC = () => {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

  // Telaah Resep Verification State
  const [checklist, setChecklist] = useState({
    rightPatient: false,
    rightMedicine: false,
    rightDosage: false,
    rightRoute: false,
    noInteractions: false,
  });

  const [isLabelModalOpen, setIsLabelModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    const qList = StorageEngine.getQueues();
    const pList = StorageEngine.getPatients();
    const mList = StorageEngine.getMedicines();
    setQueues(qList);
    setPatients(pList);
    setMedicines(mList);

    const pharmacyQueues = qList.filter((q) => q.status === 'FARMASI');
    if (pharmacyQueues.length > 0 && !selectedQueueId) {
      setSelectedQueueId(pharmacyQueues[0].id);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('medipulse_queues_updated', loadData);
    window.addEventListener('medipulse_medicines_updated', loadData);
    return () => {
      window.removeEventListener('medipulse_queues_updated', loadData);
      window.removeEventListener('medipulse_medicines_updated', loadData);
    };
  }, []);

  const activeQueue = queues.find((q) => q.id === selectedQueueId);
  const activePatient = activeQueue
    ? patients.find((p) => p.id === activeQueue.patientId)
    : null;

  // Derive e-prescription items (fallback dynamically to realistic items if not yet committed in Doctor Station)
  const prescriptionItems: PrescriptionItem[] = React.useMemo(() => {
    if (!activeQueue) return [];
    const records = StorageEngine.getMedicalRecords();
    const record = records.find((r) => r.queueId === activeQueue.id);
    if (record && record.prescriptions.length > 0) {
      return record.prescriptions;
    }
    // Default prescription mock for incoming patient
    return [
      {
        medicineId: 'med-1',
        medicineName: 'Paracetamol 500mg',
        dosageRule: '3 x Sehari 1 Tablet (Sesudah Makan)',
        quantity: 10,
        unit: 'Tablet',
        category: 'OBAT_DALAM',
        notes: 'Bila demam di atas 38°C',
      },
      {
        medicineId: 'med-2',
        medicineName: 'Amoxicillin 500mg',
        dosageRule: '3 x Sehari 1 Kapsul (Habiskan)',
        quantity: 10,
        unit: 'Kapsul',
        category: 'OBAT_DALAM',
        notes: 'Antibiotik wajib dihabiskan 3 hari',
      },
      {
        medicineId: 'med-5',
        medicineName: 'Betadine Antiseptic Solution 60ml',
        dosageRule: '2 x Sehari Oleskan pada luka',
        quantity: 1,
        unit: 'Botol',
        category: 'OBAT_LUAR',
        notes: 'Bersihkan luka sebelum dioleskan',
      },
    ];
  }, [activeQueue]);

  const allVerified = Object.values(checklist).every(Boolean);

  // FEFO DEDUCTION & HANDOVER TO CASHIER
  const handleDispenseAndHandover = () => {
    if (!activeQueue || !activePatient) return;
    if (!allVerified) {
      alert('Harap lengkapi semua checklist telaah resep (5 Tepat) demi keselamatan pasien!');
      return;
    }

    const currentMeds = [...StorageEngine.getMedicines()];
    const billingItems: BillingItem[] = [];

    // Process each prescribed medicine via FEFO
    prescriptionItems.forEach((rx) => {
      const medIndex = currentMeds.findIndex(
        (m) => m.id === rx.medicineId || m.name.toLowerCase() === rx.medicineName.toLowerCase()
      );

      if (medIndex !== -1) {
        const med = currentMeds[medIndex];
        // Sort batches ascending by expiryDate (Earliest Expired First)
        med.batches.sort(
          (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );

        let needed = rx.quantity;
        let itemUnitPrice = 0;

        for (const batch of med.batches) {
          if (needed <= 0) break;
          if (batch.stock > 0) {
            itemUnitPrice = batch.sellingPrice;
            const deduct = Math.min(batch.stock, needed);
            batch.stock -= deduct;
            needed -= deduct;
          }
        }

        billingItems.push({
          description: `${med.name} (${rx.quantity} ${med.unit})`,
          quantity: rx.quantity,
          unitPrice: itemUnitPrice > 0 ? itemUnitPrice : 2000,
          subtotal: (itemUnitPrice > 0 ? itemUnitPrice : 2000) * rx.quantity,
        });
      } else {
        billingItems.push({
          description: `${rx.medicineName} (${rx.quantity} ${rx.unit})`,
          quantity: rx.quantity,
          unitPrice: 3000,
          subtotal: 3000 * rx.quantity,
        });
      }
    });

    // 1. Save updated medicine inventory with reduced stocks
    StorageEngine.saveMedicines(currentMeds);

    // 2. Advance Queue Status to KASIR
    const updatedQueues = queues.map((q) =>
      q.id === activeQueue.id
        ? {
            ...q,
            status: 'KASIR' as const,
            pharmacyDispensedAt: new Date().toISOString(),
          }
        : q
    );
    StorageEngine.saveQueues(updatedQueues);

    // 3. Create or Update Billing Invoice
    const currentInvoices = StorageEngine.getInvoices();
    const existingInvIndex = currentInvoices.findIndex((inv) => inv.queueId === activeQueue.id);

    const medSubtotal = billingItems.reduce((acc, it) => acc + it.subtotal, 0);
    const regFee = 25000;
    const docFee = 75000;

    const newInvoice: BillingInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      queueId: activeQueue.id,
      patientId: activePatient.id,
      patientName: activePatient.fullName,
      medicalRecordNumber: activePatient.medicalRecordNumber,
      registrationFee: regFee,
      doctorConsultationFee: docFee,
      items: billingItems,
      totalAmount: regFee + docFee + medSubtotal,
      paymentMethod: 'QRIS',
      paymentStatus: 'BELUM_BAYAR',
      cashierName: 'Kasir Utama',
    };

    if (existingInvIndex !== -1) {
      currentInvoices[existingInvIndex] = newInvoice;
    } else {
      currentInvoices.push(newInvoice);
    }
    StorageEngine.saveInvoices(currentInvoices);

    // Reset Checklist
    setChecklist({
      rightPatient: false,
      rightMedicine: false,
      rightDosage: false,
      rightRoute: false,
      noInteractions: false,
    });

    setNotification(
      `Obat untuk ${activePatient.fullName} (${activeQueue.ticketNumber}) berhasil disiapkan dengan algoritma FEFO & diteruskan ke Kasir Billing!`
    );
    setTimeout(() => setNotification(null), 6000);
  };

  const incomingPharmacyQueues = queues.filter((q) => q.status === 'FARMASI');
  const finishedPharmacyQueues = queues.filter((q) => q.status === 'KASIR' || q.status === 'SELESAI');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Pill className="h-4 w-4" />
            <span>Farmasi & E-Prescription Dispensing</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Stasiun Dispensing Apotek & Etiket</h1>
          <p className="text-xs text-slate-400 mt-1">
            Verifikasi telaah resep dokter, pengurangan kuota batch otomatis (FEFO), dan cetak label etiket obat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-xs text-purple-300 font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400 animate-pulse" />
            <span>{incomingPharmacyQueues.length} Resep Masuk</span>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Grid: Queue List + Dispensing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pharmacy Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Antrean Resep Siap Dilayani
            </h2>

            {incomingPharmacyQueues.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                Tidak ada antrean resep aktif di apotek saat ini.
              </div>
            ) : (
              <div className="space-y-2">
                {incomingPharmacyQueues.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedQueueId(item.id);
                      setChecklist({
                        rightPatient: false,
                        rightMedicine: false,
                        rightDosage: false,
                        rightRoute: false,
                        noInteractions: false,
                      });
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedQueueId === item.id
                        ? 'bg-gradient-to-r from-purple-950/80 to-slate-900 border-purple-600 shadow-lg'
                        : 'bg-slate-950 hover:bg-slate-800/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/50">
                        {item.ticketNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.poli.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-1">{item.patientName}</p>
                    <p className="text-xs text-slate-400">{item.medicalRecordNumber}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Riwayat Resep Selesai */}
            {finishedPharmacyQueues.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Telah Diserahkan ke Kasir ({finishedPharmacyQueues.length})
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {finishedPharmacyQueues.map((q) => (
                    <div
                      key={q.id}
                      className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-slate-300 font-medium">{q.patientName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{q.ticketNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Patient Prescription & Dispensing Station */}
        <div className="lg:col-span-8 space-y-5">
          {activePatient && activeQueue ? (
            <div className="space-y-5">
              {/* Patient Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-purple-900 text-purple-300">
                        {activeQueue.ticketNumber}
                      </span>
                      <h2 className="text-lg font-bold text-white">{activePatient.fullName}</h2>
                      <span className="text-xs text-slate-400">({activePatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      No. RM: <strong className="text-slate-200">{activePatient.medicalRecordNumber}</strong> • NIK: {activePatient.nik}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400">Poli Pengirim</span>
                    <p className="text-xs font-semibold text-cyan-400">{activeQueue.poli.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Patient Allergies Alert */}
                {activePatient.allergies && activePatient.allergies.length > 0 ? (
                  <div className="mt-4 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-center gap-2 text-rose-300 text-xs">
                    <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>
                      <strong>Peringatan Alergi Pasien:</strong> {activePatient.allergies.join(', ')}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Pasien tidak memiliki riwayat alergi obat yang tercatat.</span>
                  </div>
                )}
              </div>

              {/* Prescribed Medicines Table */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Rincian Obat & Aturan Pakai (E-Resep)</h3>
                    <p className="text-xs text-slate-400">Verifikasi sediaan dan kuantiti obat sebelum peracikan</p>
                  </div>
                  <button
                    onClick={() => setIsLabelModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Preview & Cetak Etiket</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 rounded-l-lg">Tipe Etiket</th>
                        <th className="py-2.5 px-3">Nama Obat</th>
                        <th className="py-2.5 px-3">Jumlah</th>
                        <th className="py-2.5 px-3">Signa / Aturan Minum</th>
                        <th className="py-2.5 px-3 rounded-r-lg">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {prescriptionItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.category === 'OBAT_DALAM'
                                  ? 'bg-white text-slate-950'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {item.category === 'OBAT_DALAM' ? 'Etiket Putih' : 'Etiket Biru'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-200">
                            {item.medicineName}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-cyan-300 font-medium">
                            {item.dosageRule}
                          </td>
                          <td className="py-3 px-3 text-slate-500 italic">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Telaah Resep Checklist (5 Tepat Farmasi) */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <FileCheck2 className="h-4 w-4 text-purple-400" />
                  <span>Protokol Keselamatan: Telaah Resep Apoteker</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-800/40 text-xs text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={checklist.rightPatient}
                      onChange={(e) => setChecklist({ ...checklist, rightPatient: e.target.checked })}
                      className="rounded border-slate-700 text-purple-600 focus:ring-0"
                    />
                    <span>1. Tepat Identitas Pasien & No. RM</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-800/40 text-xs text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={checklist.rightMedicine}
                      onChange={(e) => setChecklist({ ...checklist, rightMedicine: e.target.checked })}
                      className="rounded border-slate-700 text-purple-600 focus:ring-0"
                    />
                    <span>2. Tepat Nama & Sediaan Obat</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-800/40 text-xs text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={checklist.rightDosage}
                      onChange={(e) => setChecklist({ ...checklist, rightDosage: e.target.checked })}
                      className="rounded border-slate-700 text-purple-600 focus:ring-0"
                    />
                    <span>3. Tepat Dosis & Aturan Minum</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-800/40 text-xs text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={checklist.rightRoute}
                      onChange={(e) => setChecklist({ ...checklist, rightRoute: e.target.checked })}
                      className="rounded border-slate-700 text-purple-600 focus:ring-0"
                    />
                    <span>4. Tepat Rute (Oral / Luar)</span>
                  </label>

                  <label className="sm:col-span-2 flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-800/40 text-xs text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={checklist.noInteractions}
                      onChange={(e) => setChecklist({ ...checklist, noInteractions: e.target.checked })}
                      className="rounded border-slate-700 text-purple-600 focus:ring-0"
                    />
                    <span>5. Tidak Ada Kontraindikasi / Alergi Berbahaya</span>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">
                  Algoritma: <span className="text-purple-400 font-semibold">First Expired First Out (FEFO)</span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setIsLabelModalOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Cetak Etiket</span>
                  </button>

                  <button
                    onClick={handleDispenseAndHandover}
                    disabled={!allVerified}
                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      allVerified
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <span>Selesaikan Obat & Teruskan ke Kasir</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
              <Pill className="h-10 w-10 mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-medium">Pilih antrean resep di sebelah kiri untuk memulai penyiapan obat.</p>
            </div>
          )}
        </div>
      </div>

      {/* Label Modal */}
      {activePatient && (
        <MedicineLabelModal
          isOpen={isLabelModalOpen}
          onClose={() => setIsLabelModalOpen(false)}
          patient={activePatient}
          prescriptions={prescriptionItems}
        />
      )}
    </div>
  );
};
