"use client";

import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, HeartPulse } from 'lucide-react';
import { BillingInvoice } from '@/types/medipulse';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: BillingInvoice | null;
  cashReceived?: number;
  cashChange?: number;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
  cashReceived = 0,
  cashChange = 0,
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(invoice.paidAt || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header Modal (No-print) */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 no-print">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="text-sm font-bold text-white">Kwitansi Pembayaran Sah</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 bg-slate-950/40 flex justify-center">
          <div className="w-full bg-white text-slate-950 p-6 rounded-xl border border-slate-300 shadow-xl font-mono text-xs space-y-3">
            {/* Header Klinik */}
            <div className="text-center pb-3 border-b-2 border-slate-800">
              <div className="font-extrabold text-sm tracking-wider uppercase">
                KLINIK PRATAMA SEHAT MANDIRI
              </div>
              <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                Izin Operasional: 445/092/KLINIK/2026
              </p>
              <p className="text-[10px] text-slate-600">
                Jl. Merdeka No. 45, Jakarta Selatan • Telp: (021) 555-0199
              </p>
              <div className="mt-2 py-0.5 px-2 bg-slate-900 text-white font-bold text-[10px] tracking-widest inline-block rounded">
                BUKTI PEMBAYARAN / KWITANSI
              </div>
            </div>

            {/* Invoice & Patient Meta */}
            <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-600">No. Kwitansi:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tanggal & Waktu:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Nama Pasien:</span>
                <span className="font-bold text-slate-900">{invoice.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">No. Rekam Medis:</span>
                <span className="font-bold">{invoice.medicalRecordNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Kasir:</span>
                <span>{invoice.cashierName}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 py-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase">
                <span>Rincian Layanan / Obat</span>
                <span>Subtotal (Rp)</span>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Biaya Registrasi & Administrasi</span>
                <span>{invoice.registrationFee.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Konsultasi & Jasa Medis Dokter</span>
                <span>{invoice.doctorConsultationFee.toLocaleString('id-ID')}</span>
              </div>

              {invoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{item.description}</span>
                  <span>{item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            {/* Grand Total & Payment Method */}
            <div className="pt-2 space-y-1 text-xs">
              <div className="flex justify-between font-black text-sm">
                <span>TOTAL TAGIHAN:</span>
                <span>Rp {invoice.totalAmount.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between text-slate-700 text-[11px]">
                <span>Metode Pembayaran:</span>
                <span className="font-bold uppercase">{invoice.paymentMethod}</span>
              </div>

              {invoice.paymentMethod === 'TUNAI' && cashReceived > 0 && (
                <>
                  <div className="flex justify-between text-slate-700 text-[11px]">
                    <span>Uang Diterima:</span>
                    <span>Rp {cashReceived.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 text-[11px]">
                    <span>Kembalian:</span>
                    <span className="font-bold">Rp {cashChange.toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-[11px] pt-1">
                <span>Status Pelunasan:</span>
                <span className="font-black text-emerald-700 tracking-wider">
                  *** LUNAS ***
                </span>
              </div>
            </div>

            {/* Footer / Signature Note */}
            <div className="pt-4 text-center border-t border-dashed border-slate-300 text-[9px] text-slate-500 space-y-0.5">
              <p>Terima kasih atas kepercayaan Anda berobat di Klinik Kami.</p>
              <p>Semoga lekas sembuh dan sehat selalu.</p>
              <p className="font-bold text-[8px] mt-1">
                Dicetak otomatis oleh Sistem Operasi MediPulse ERP v1.0
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions (No-print) */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Kwitansi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
