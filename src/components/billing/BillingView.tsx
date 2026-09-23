"use client";

import React, { useEffect, useState } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Banknote, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { StorageEngine } from '@/lib/storage';
import { BillingInvoice, QueueItem } from '@/types/medipulse';
import { ReceiptModal } from './ReceiptModal';

export const BillingView: React.FC = () => {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'QRIS' | 'ASURANSI_BPJS'>('TUNAI');
  const [cashInput, setCashInput] = useState<number>(0);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<BillingInvoice | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [qrisTimer, setQrisTimer] = useState<number>(900); // 15 minutes

  const loadData = () => {
    const invList = StorageEngine.getInvoices();
    const qList = StorageEngine.getQueues();
    setInvoices(invList);
    setQueues(qList);

    const unpaid = invList.filter((inv) => inv.paymentStatus === 'BELUM_BAYAR');
    if (unpaid.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(unpaid[0].id);
      setCashInput(unpaid[0].totalAmount);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('medipulse_invoices_updated', loadData);
    window.addEventListener('medipulse_queues_updated', loadData);
    return () => {
      window.removeEventListener('medipulse_invoices_updated', loadData);
      window.removeEventListener('medipulse_queues_updated', loadData);
    };
  }, []);

  // QRIS countdown timer
  useEffect(() => {
    if (paymentMethod === 'QRIS') {
      const timer = setInterval(() => {
        setQrisTimer((prev) => (prev > 0 ? prev - 1 : 900));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [paymentMethod]);

  const activeInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  const cashChange = activeInvoice ? Math.max(0, cashInput - activeInvoice.totalAmount) : 0;
  const isCashInsufficient = activeInvoice && paymentMethod === 'TUNAI' && cashInput < activeInvoice.totalAmount;

  const handleSelectInvoice = (inv: BillingInvoice) => {
    setSelectedInvoiceId(inv.id);
    setCashInput(inv.totalAmount);
  };

  const handleFinalizePayment = () => {
    if (!activeInvoice) return;
    if (isCashInsufficient) {
      alert('Nominal uang tunai kurang dari total tagihan!');
      return;
    }

    const currentInvoices = StorageEngine.getInvoices();
    const currentQueues = StorageEngine.getQueues();

    const updatedInvoices = currentInvoices.map((inv) =>
      inv.id === activeInvoice.id
        ? {
            ...inv,
            paymentStatus: 'LUNAS' as const,
            paymentMethod,
            paidAt: new Date().toISOString(),
          }
        : inv
    );

    const updatedQueues = currentQueues.map((q) =>
      q.id === activeInvoice.queueId || q.medicalRecordNumber === activeInvoice.medicalRecordNumber
        ? {
            ...q,
            status: 'SELESAI' as const,
            completedAt: new Date().toISOString(),
          }
        : q
    );

    StorageEngine.saveInvoices(updatedInvoices);
    StorageEngine.saveQueues(updatedQueues);

    const paidInvoice = updatedInvoices.find((i) => i.id === activeInvoice.id) || activeInvoice;
    setActiveReceiptInvoice(paidInvoice);
    setIsReceiptOpen(true);

    setToastMessage(`Pembayaran tagihan ${paidInvoice.invoiceNumber} berhasil dilunasi via ${paymentMethod}!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const unpaidInvoices = invoices.filter((i) => i.paymentStatus === 'BELUM_BAYAR');
  const paidInvoices = invoices.filter((i) => i.paymentStatus === 'LUNAS');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Receipt className="h-4 w-4" />
            <span>Kasir Medis & Billing Otomatis</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Stasiun Kasir & Pelunasan Pasien</h1>
          <p className="text-xs text-slate-400 mt-1">
            Konsolidasi rincian biaya pendaftaran, tindakan medis dokter, obat farmasi, dan multi-channel pembayaran.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>{unpaidInvoices.length} Menunggu Pembayaran</span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800/70 text-emerald-200 text-xs flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Invoice Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Tagihan Siap Bayar ({unpaidInvoices.length})
            </h2>

            {unpaidInvoices.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                Tidak ada tagihan yang tertunda saat ini.
              </div>
            ) : (
              <div className="space-y-2">
                {unpaidInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => handleSelectInvoice(inv)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedInvoiceId === inv.id
                        ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-600 shadow-lg'
                        : 'bg-slate-950 hover:bg-slate-800/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-xs font-bold text-white">
                        Rp {inv.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200 mt-1">{inv.patientName}</p>
                    <p className="text-xs text-slate-500">{inv.medicalRecordNumber}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Riwayat Tagihan Lunas */}
            {paidInvoices.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Riwayat Lunas Hari Ini ({paidInvoices.length})
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {paidInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="text-slate-300 font-medium">{inv.patientName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{inv.invoiceNumber} • {inv.paymentMethod}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="font-bold text-emerald-400">
                          Rp {inv.totalAmount.toLocaleString('id-ID')}
                        </span>
                        <button
                          onClick={() => {
                            setActiveReceiptInvoice(inv);
                            setIsReceiptOpen(true);
                          }}
                          title="Cetak Ulang Kwitansi"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout & Payment Station */}
        <div className="lg:col-span-8 space-y-5">
          {activeInvoice ? (
            <div className="space-y-5">
              {/* Invoice Breakdown Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Rincian Tagihan Perawatan
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1">{activeInvoice.patientName}</h2>
                    <p className="text-xs text-slate-400">
                      No. RM: <strong className="text-slate-200">{activeInvoice.medicalRecordNumber}</strong> • Invoice: {activeInvoice.invoiceNumber}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400">Total Pembayaran</span>
                    <div className="text-2xl font-black text-emerald-400">
                      Rp {activeInvoice.totalAmount.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Breakdown Items */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span>1. Biaya Pendaftaran & Administrasi Klinik</span>
                    <span className="font-semibold">Rp {activeInvoice.registrationFee.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span>2. Jasa Konsultasi & Tindakan Medis Dokter</span>
                    <span className="font-semibold">Rp {activeInvoice.doctorConsultationFee.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="py-1 space-y-1">
                    <span className="text-slate-400 font-semibold block">3. Biaya Obat & Alat Kesehatan (Apotek):</span>
                    {activeInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between pl-3 text-slate-400 text-[11px]">
                        <span>• {item.description}</span>
                        <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Metode Pembayaran Kasir</h3>
                  <span className="text-xs text-slate-400">Pilih salah satu metode</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TUNAI')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'TUNAI'
                        ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <Banknote className="h-5 w-5 text-emerald-400" />
                    <span className="text-xs font-bold">Tunai (Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'QRIS'
                        ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <QrCode className="h-5 w-5 text-cyan-400" />
                    <span className="text-xs font-bold">QRIS Interaktif</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ASURANSI_BPJS')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'ASURANSI_BPJS'
                        ? 'bg-purple-950/70 border-purple-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <ShieldCheck className="h-5 w-5 text-purple-400" />
                    <span className="text-xs font-bold">BPJS / Asuransi</span>
                  </button>
                </div>

                {/* TUNAI MODE */}
                {paymentMethod === 'TUNAI' && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 font-medium">Uang Tunai Diterima (Rp)</label>
                      <input
                        type="number"
                        value={cashInput}
                        onChange={(e) => setCashInput(Number(e.target.value))}
                        className="w-full mt-1.5 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {/* Quick Cash Buttons */}
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1.5">Pecahan Cepat:</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setCashInput(activeInvoice.totalAmount)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700"
                        >
                          Uang Pas
                        </button>
                        {[50000, 100000, 150000, 200000, 500000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCashInput(amt)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700"
                          >
                            Rp {amt.toLocaleString('id-ID')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Change Display */}
                    <div className="pt-2 flex justify-between items-center text-sm border-t border-slate-800">
                      <span className="text-slate-400 font-medium">Uang Kembalian:</span>
                      <span className={`text-base font-black ${isCashInsufficient ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isCashInsufficient ? 'Uang Kurang!' : `Rp ${cashChange.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* QRIS MODE */}
                {paymentMethod === 'QRIS' && (
                  <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center space-y-3">
                    <div className="p-4 bg-white rounded-2xl shadow-xl">
                      {/* Interactive Mock QRIS SVG */}
                      <svg viewBox="0 0 100 100" className="w-40 h-40">
                        <rect width="100" height="100" fill="white" />
                        <rect x="10" y="10" width="25" height="25" fill="#020617" />
                        <rect x="15" y="15" width="15" height="15" fill="white" />
                        <rect x="18" y="18" width="9" height="9" fill="#020617" />
                        <rect x="65" y="10" width="25" height="25" fill="#020617" />
                        <rect x="70" y="15" width="15" height="15" fill="white" />
                        <rect x="73" y="18" width="9" height="9" fill="#020617" />
                        <rect x="10" y="65" width="25" height="25" fill="#020617" />
                        <rect x="15" y="70" width="15" height="15" fill="white" />
                        <rect x="18" y="73" width="9" height="9" fill="#020617" />
                        {/* Data dots */}
                        <circle cx="45" cy="20" r="3" fill="#020617" />
                        <circle cx="55" cy="25" r="2.5" fill="#020617" />
                        <circle cx="48" cy="45" r="4" fill="#020617" />
                        <circle cx="65" cy="50" r="3" fill="#020617" />
                        <circle cx="45" cy="70" r="2.5" fill="#020617" />
                        <circle cx="75" cy="75" r="3" fill="#020617" />
                        <circle cx="85" cy="65" r="2.5" fill="#020617" />
                      </svg>
                    </div>

                    <div className="text-xs text-slate-400">
                      Scan QRIS melalui BCA Mobile, GoPay, OVO, ShopeePay, atau Livin' Mandiri.
                    </div>
                    <div className="font-mono text-xs text-cyan-400 font-bold">
                      Sisa Waktu QR: {Math.floor(qrisTimer / 60)}:{(qrisTimer % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                )}

                {/* ASURANSI MODE */}
                {paymentMethod === 'ASURANSI_BPJS' && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verifikasi Klaim Asuransi / BPJS Kesehatan</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400">Nomor Kartu / NIK</label>
                        <input
                          type="text"
                          defaultValue="0002983192831"
                          className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400">Status Kepesertaan</label>
                        <div className="mt-1 px-3 py-1.5 bg-emerald-950 border border-emerald-800 rounded-lg text-xs font-bold text-emerald-400">
                          Aktif (Cover 100%)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Finalize */}
                <div className="pt-3 flex justify-end">
                  <button
                    onClick={handleFinalizePayment}
                    disabled={isCashInsufficient}
                    className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
                      isCashInsufficient
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                    }`}
                  >
                    <span>Selesaikan Pembayaran & Cetak Kwitansi</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
              <Receipt className="h-10 w-10 mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-medium">Pilih tagihan pasien di sebelah kiri untuk memulai pembayaran.</p>
            </div>
          )}
        </div>
      </div>

      {/* Kwitansi Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoice={activeReceiptInvoice}
        cashReceived={cashInput}
        cashChange={cashChange}
      />
    </div>
  );
};
