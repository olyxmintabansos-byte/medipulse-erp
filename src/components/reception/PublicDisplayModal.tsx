"use client";

import React, { useEffect, useState } from 'react';
import { X, Volume2, Monitor, HeartPulse } from 'lucide-react';
import { QueueItem, PoliType } from '@/types/medipulse';
import { StorageEngine } from '@/lib/storage';
import { formatPoliNameIndonesian, announceQueue } from '@/lib/speech-announcer';

interface PublicDisplayModalProps {
  onClose: () => void;
}

export const PublicDisplayModal: React.FC<PublicDisplayModalProps> = ({ onClose }) => {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');
  const [lastCalled, setLastCalled] = useState<QueueItem | null>(null);

  const loadQueues = () => {
    const items = StorageEngine.getQueues();
    setQueues(items);

    const calledItems = items
      .filter((i) => i.status === 'DIPERIKSA' || i.calledCount > 0)
      .sort((a, b) => (b.calledCount || 0) - (a.calledCount || 0));

    if (calledItems.length > 0) {
      setLastCalled(calledItems[0]);
    }
  };

  useEffect(() => {
    loadQueues();
    window.addEventListener('medipulse_queues_updated', loadQueues);

    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateString(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener('medipulse_queues_updated', loadQueues);
      clearInterval(timer);
    };
  }, []);

  const getActiveTicketForPoli = (poli: PoliType): QueueItem | undefined => {
    return queues.find((q) => q.poli === poli && q.status === 'DIPERIKSA') ||
           queues.find((q) => q.poli === poli && q.status === 'MENUNGGU');
  };

  const handleReannounce = (item: QueueItem) => {
    announceQueue(item.ticketNumber, item.poli);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
            <HeartPulse className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Klinik Pratama Sehat Mandiri</h1>
            <p className="text-xs text-slate-400">Layanan Informasi Antrean Pasien Real-Time</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-cyan-400">{timeString}</div>
            <div className="text-xs text-slate-400">{dateString}</div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Keluar Layar TV"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Display Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6 flex-1">
        {/* Big Active Calling Banner (Left 2 cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-3 py-1 rounded-full">
              Panggilan Aktif
            </span>
            {lastCalled && (
              <button
                onClick={() => handleReannounce(lastCalled)}
                className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl transition-all"
              >
                <Volume2 className="h-4 w-4 animate-bounce" />
                <span>Panggil Suara Ulang</span>
              </button>
            )}
          </div>

          {lastCalled ? (
            <div className="text-center my-auto py-6">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">
                {formatPoliNameIndonesian(lastCalled.poli)}
              </p>
              <div className="text-8xl lg:text-9xl font-black font-mono tracking-tighter text-cyan-400 animate-pulse drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
                {lastCalled.ticketNumber}
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mt-4">{lastCalled.patientName}</h2>
              <p className="text-sm text-slate-400 mt-1 font-mono">{lastCalled.medicalRecordNumber}</p>
            </div>
          ) : (
            <div className="text-center my-auto py-12 text-slate-500">
              <Monitor className="h-16 w-16 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Belum ada panggilan antrean aktif saat ini.</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <span>Harap menyiapkan kartu identitas / No. RM saat nomor dipanggil.</span>
            <span className="text-cyan-400 font-semibold">MediPulse Audio Synthesizer v1.0</span>
          </div>
        </div>

        {/* Poli Cards Column (Right 1 col) */}
        <div className="space-y-4 flex flex-col justify-between">
          {(['POLI_UMUM', 'POLI_GIGI', 'POLI_ANAK'] as PoliType[]).map((poli) => {
            const active = getActiveTicketForPoli(poli);
            return (
              <div
                key={poli}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between shadow-md"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {formatPoliNameIndonesian(poli)}
                  </p>
                  <p className="text-sm font-medium text-slate-200 mt-0.5 truncate max-w-[150px]">
                    {active ? active.patientName : 'Tidak ada antrean'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-mono font-bold text-emerald-400">
                    {active ? active.ticketNumber : '-'}
                  </span>
                  {active && (
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
                      {active.status}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Marquee Health Tips Footer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3 flex items-center gap-4 overflow-hidden">
        <span className="shrink-0 bg-cyan-950 text-cyan-400 text-xs font-bold px-3 py-1 rounded-lg border border-cyan-800/60 uppercase tracking-wider">
          Edukasi Kesehatan
        </span>
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="inline-block animate-marquee text-xs text-slate-300 font-medium space-x-12">
            <span>• Jaga kebersihan tangan dengan rutin mencuci tangan pakai sabun dan air mengalir.</span>
            <span>• Gunakan masker jika Anda sedang batuk atau flu demi kenyamanan bersama.</span>
            <span>• Istirahat yang cukup dan penuhi kebutuhan cairan tubuh minimal 2 liter sehari.</span>
            <span>• Klinik Sehat Mandiri melayani pemeriksaan BPJS Kesehatan dan Pasien Umum.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
