import { Patient, QueueItem, MedicalRecord, Medicine, BillingInvoice } from '@/types/medipulse';
import { INITIAL_PATIENTS, INITIAL_QUEUES, INITIAL_MEDICINES, INITIAL_INVOICES } from './mock-data';

const STORAGE_KEYS = {
  PATIENTS: 'medipulse_patients_v1',
  QUEUES: 'medipulse_queues_v1',
  RECORDS: 'medipulse_records_v1',
  MEDICINES: 'medipulse_medicines_v1',
  INVOICES: 'medipulse_invoices_v1',
};

export const StorageEngine = {
  getPatients(): Patient[] {
    if (typeof window === 'undefined') return INITIAL_PATIENTS;
    const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
      return INITIAL_PATIENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_PATIENTS;
    }
  },

  savePatients(patients: Patient[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    window.dispatchEvent(new Event('medipulse_patients_updated'));
  },

  getQueues(): QueueItem[] {
    if (typeof window === 'undefined') return INITIAL_QUEUES;
    const data = localStorage.getItem(STORAGE_KEYS.QUEUES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(INITIAL_QUEUES));
      return INITIAL_QUEUES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_QUEUES;
    }
  },

  saveQueues(queues: QueueItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queues));
    window.dispatchEvent(new Event('medipulse_queues_updated'));
  },

  getMedicalRecords(): MedicalRecord[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveMedicalRecords(records: MedicalRecord[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    window.dispatchEvent(new Event('medipulse_records_updated'));
  },

  getMedicines(): Medicine[] {
    if (typeof window === 'undefined') return INITIAL_MEDICINES;
    const data = localStorage.getItem(STORAGE_KEYS.MEDICINES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(INITIAL_MEDICINES));
      return INITIAL_MEDICINES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MEDICINES;
    }
  },

  saveMedicines(medicines: Medicine[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
    window.dispatchEvent(new Event('medipulse_medicines_updated'));
  },

  getInvoices(): BillingInvoice[] {
    if (typeof window === 'undefined') return INITIAL_INVOICES;
    const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_INVOICES;
    }
  },

  saveInvoices(invoices: BillingInvoice[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    window.dispatchEvent(new Event('medipulse_invoices_updated'));
  },

  resetAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
    localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(INITIAL_QUEUES));
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(INITIAL_MEDICINES));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    window.location.reload();
  },
};
