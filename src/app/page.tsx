"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';
import { ReceptionView } from '@/components/reception/ReceptionView';
import { DoctorStationView } from '@/components/doctor/DoctorStationView';
import { PharmacyView } from '@/components/pharmacy/PharmacyView';
import { InventoryView } from '@/components/inventory/InventoryView';
import { BillingView } from '@/components/billing/BillingView';
import { ReportsView } from '@/components/reports/ReportsView';
import { ActiveTab } from '@/types/medipulse';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar onRefresh={handleRefresh} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto bg-slate-950/50">
          {activeTab === 'overview' && (
            <OverviewDashboard onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'reception' && (
            <ReceptionView />
          )}

          {activeTab === 'doctor' && (
            <DoctorStationView />
          )}

          {activeTab === 'pharmacy' && (
            <PharmacyView />
          )}

          {activeTab === 'inventory' && (
            <InventoryView />
          )}

          {activeTab === 'billing' && (
            <BillingView />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}
        </main>
      </div>
    </div>
  );
}
