export type PoliType = 'POLI_UMUM' | 'POLI_GIGI' | 'POLI_ANAK';

export type QueueStatus = 'MENUNGGU' | 'DIPERIKSA' | 'FARMASI' | 'KASIR' | 'SELESAI' | 'BATAL';

export interface Patient {
  id: string;
  medicalRecordNumber: string; // e.g., "RM-2026-0012"
  nik: string;
  fullName: string;
  birthDate: string;
  gender: 'L' | 'P';
  phone: string;
  address: string;
  bloodType?: 'A' | 'B' | 'AB' | 'O';
  allergies: string[];
  createdAt: string;
}

export interface QueueItem {
  id: string;
  ticketNumber: string; // e.g., "A-01", "G-04", "K-02"
  patientId: string;
  patientName: string;
  medicalRecordNumber: string;
  poli: PoliType;
  status: QueueStatus;
  calledCount: number;
  registeredAt: string;
  doctorExaminedAt?: string;
  pharmacyDispensedAt?: string;
  completedAt?: string;
}

export interface VitalSigns {
  systolic: number; // mmHg
  diastolic: number; // mmHg
  heartRate: number; // bpm
  respiratoryRate: number; // breath/min
  temperature: number; // Celsius
  weight: number; // kg
  height: number; // cm
  oxygenSaturation: number; // %
}

export interface ICD10Item {
  code: string;
  nameIndonesian: string;
  category: string;
}

export interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosageRule: string; // e.g., "3x1 Sehari Sesudah Makan"
  quantity: number;
  unit: string; // "Tablet", "Sirup", "Kapsul"
  category: 'OBAT_DALAM' | 'OBAT_LUAR';
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  queueId: string;
  patientId: string;
  doctorName: string;
  poli: PoliType;
  anamnesis: string;
  vitals: VitalSigns;
  physicalExamination: string;
  primaryDiagnosis: ICD10Item;
  secondaryDiagnoses?: ICD10Item[];
  prescriptions: PrescriptionItem[];
  doctorNotes: string;
  consultationFee: number;
  createdAt: string;
}

export interface MedicineBatch {
  id: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface Medicine {
  id: string;
  code: string;
  name: string;
  category: 'OBAT_DALAM' | 'OBAT_LUAR';
  unit: string;
  minStockAlert: number;
  batches: MedicineBatch[];
}

export interface BillingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string; // e.g., "INV-2026-0891"
  queueId: string;
  patientId: string;
  patientName: string;
  medicalRecordNumber: string;
  registrationFee: number;
  doctorConsultationFee: number;
  items: BillingItem[];
  totalAmount: number;
  paymentMethod: 'TUNAI' | 'QRIS' | 'ASURANSI_BPJS';
  paymentStatus: 'BELUM_BAYAR' | 'LUNAS';
  paidAt?: string;
  cashierName: string;
}

export type ActiveTab = 'overview' | 'reception' | 'doctor' | 'pharmacy' | 'inventory' | 'billing' | 'reports';
