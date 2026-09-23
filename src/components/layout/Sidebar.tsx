"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Pill, 
  Boxes, 
  Receipt, 
  BarChart3,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { ActiveTab } from '@/types/medipulse';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string; desc: string }[] = [
    {
      id: 'overview',
      label: 'Ringkasan Utama',
      icon: <LayoutDashboard className="h-4 w-4" />,
      desc: 'Live KPI & Pantauan Sistem',
    },
    {
      id: 'reception',
      label: 'Loket & Antrean',
      icon: <Users className="h-4 w-4" />,
      badge: 'Poli',
      desc: 'Pendaftaran & Pemanggil Suara',
    },
    {
      id: 'doctor',
      label: 'Ruang Dokter & RME',
      icon: <Stethoscope className="h-4 w-4" />,
      badge: 'ICD-10',
      desc: 'Pemeriksaan Klinis & E-Resep',
    },
    {
      id: 'pharmacy',
      label: 'Apotek & Farmasi',
      icon: <Pill className="h-4 w-4" />,
      desc: 'Dispensing & Etiket Obat',
    },
    {
      id: 'inventory',
      label: 'Stok Obat (FEFO)',
      icon: <Boxes className="h-4 w-4" />,
      desc: 'Batch & Peringatan Expired',
    },
    {
      id: 'billing',
      label: 'Kasir & Billing',
      icon: <Receipt className="h-4 w-4" />,
      desc: 'Kwitansi & Pembayaran QRIS',
    },
    {
      id: 'reports',
      label: 'Laporan & Morbiditas',
      icon: <BarChart3 className="h-4 w-4" />,
      desc: 'Top 10 Penyakit & Export CSV',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Modul Operasional
        </div>

        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-800/60 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg ${
                    isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">{item.label}</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-none">{item.desc}</p>
                </div>
              </div>

              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 m-3 rounded-xl border">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Local-First SPA Engine</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          100% data tersimpan di LocalStorage browser ThinkPad L480 Anda. Siap deploy langsung ke GitHub Pages.
        </p>
      </div>
    </aside>
  );
};
