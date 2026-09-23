"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';
import { ReceptionView } from '@/components/reception/ReceptionView';
import { DoctorStationView } from '@/components/doctor/DoctorStationView';
import { ActiveTab } from '@/types/medipulse';
import { Construction } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Navbar onRefresh={handleRefresh} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto bg-slate-950/50">
          {activeTab === 'overview' && (
            <OverviewDashboard onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'reception' && <ReceptionView />}

          {activeTab === 'doctor' && <DoctorStationView />}

          {activeTab !== 'overview' && activeTab !== 'reception' && activeTab !== 'doctor' && (
            <div className="p-8 max-w-4xl mx-auto text-center mt-12">
              <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400">
                <Construction className="h-8 w-8 animate-bounce" />
              </div>
              <h2 className="text-xl font-bold text-white capitalize">
                Modul {activeTab.replace('_', ' ')} Siap Dieksekusi pada Sprint Berikutnya
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Fondasi tipe data, skema database LocalStorage, dan layout telah aktif 100%. Lanjutkan ke direktif Sprint berikutnya untuk menyuntikkan fungsionalitas penuh modul ini!
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="mt-6 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                Kembali ke Dashboard Utama
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
