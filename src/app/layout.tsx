import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediPulse: Clinic & Pharmacy ERP',
  description: 'Sistem Operasi Terpadu Klinik Mandiri, RME ICD-10, E-Resep, & Apotek FEFO',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
