"use client";

import React, { useEffect, useState } from 'react';
import { Activity, Clock, RefreshCw, Bell, ShieldCheck, HeartPulse } from 'lucide-react';
import { StorageEngine } from '@/lib/storage';

interface NavbarProps {
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh }) => {
  const [timeString, setTimeString] = useState<string>('');
  const [activeQueueCount, setActiveQueueCount] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkQueues = () => {
      const q = StorageEngine.getQueues();
      const waiting = q.filter((item) => item.status !== 'SELESAI' && item.status !== 'BATAL').length;
      setActiveQueueCount(waiting);
    };

    checkQueues();
    window.addEventListener('medipulse_queues_updated', checkQueues);
    return () => window.removeEventListener('medipulse_queues_updated', checkQueues);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-900/20">
          <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <HeartPulse className="h-5 w-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-white">MediPulse</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded">
              v1.0 ERP
            </span>
          </div>
          <p className="text-xs text-slate-400">Klinik Pratama Sehat Mandiri</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-mono">{timeString || 'Memuat waktu...'}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-xs text-emerald-400">
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          <span>Antrean Aktif: <strong>{activeQueueCount}</strong> Pasien</span>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset seluruh data ke demo awal?')) {
              StorageEngine.resetAllData();
            }
          }}
          title="Reset Demo Data"
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
            DR
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-slate-200">dr. Pratama, Sp.A</p>
            <p className="text-[10px] text-slate-500">Super Admin / Dokter</p>
          </div>
        </div>
      </div>
    </header>
  );
};
