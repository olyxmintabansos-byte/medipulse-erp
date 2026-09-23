"use client";

import React from 'react';
import { X, Printer, HeartPulse } from 'lucide-react';
import { QueueItem } from '@/types/medipulse';
import { formatPoliNameIndonesian } from '@/lib/speech-announcer';

interface QueueTicketModalProps {
  ticket: QueueItem | null;
  waitingAheadCount: number;
  onClose: () => void;
}

export const QueueTicketModal: React.FC<QueueTicketModalProps> = ({
  ticket,
  waitingAheadCount,
  onClose,
}) => {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(ticket.registeredAt).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Action Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 no-print">
          <span className="text-xs font-semibold text-slate-400">Struk Tiket Thermal (58mm)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Thermal Ticket Content */}
        <div className="p-6 bg-white text-slate-950 font-mono text-center select-none print:p-0 print:m-0" id="thermal-receipt">
          <div className="flex items-center justify-center gap-2 border-b border-dashed border-slate-400 pb-3 mb-3">
            <HeartPulse className="h-5 w-5 text-slate-800" />
            <div>
              <h3 className="font-bold text-sm leading-tight uppercase tracking-tight">Klinik Pratama Sehat Mandiri</h3>
              <p className="text-[10px] text-slate-600 font-sans">Jl. Merdeka No. 45, Jakarta • 021-555123</p>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase text-slate-700">Nomor Antrean Anda</p>
          <div className="my-3 text-5xl font-black tracking-tight text-slate-950 font-mono">
            {ticket.ticketNumber}
          </div>

          <div className="inline-block px-3 py-1 rounded bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 uppercase mb-3">
            {formatPoliNameIndonesian(ticket.poli)}
          </div>

          <div className="text-xs text-slate-800 space-y-1 border-t border-b border-dashed border-slate-400 py-3 my-2 text-left font-sans">
            <div className="flex justify-between">
              <span className="text-slate-500">Pasien:</span>
              <span className="font-semibold text-slate-950 truncate max-w-[170px]">{ticket.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">No. RM:</span>
              <span className="font-mono font-semibold text-slate-950">{ticket.medicalRecordNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu:</span>
              <span className="text-[11px] text-slate-950">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Menunggu di depan:</span>
              <span className="font-bold text-amber-600">{waitingAheadCount} Pasien</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-sans mt-3">
            Harap memperhatikan layar panggil antrean di ruang tunggu. Terima kasih.
          </p>
        </div>
      </div>
    </div>
  );
};
