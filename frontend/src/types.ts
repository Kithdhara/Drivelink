export type Role =
  | 'applicant'
  | 'officer'
  | 'coordinator'
  | 'examiner'
  | 'trainer'
  | 'medical'
  | 'admin';

export type ApplicationType = 'new' | 'renewal';

export type LicenseCategory = 'A' | 'A1' | 'B' | 'B1' | 'C' | 'C1' | 'D' | 'G' | 'CE';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'documents_verified'
  | 'medical_pending'
  | 'medical_passed'
  | 'medical_failed'
  | 'exam_pending'
  | 'exam_passed'
  | 'exam_failed'
  | 'trial_pending'
  | 'trial_passed'
  | 'trial_failed'
  | 'approved'
  | 'rejected'
  | 'license_issued';

export type DocType = 'nic' | 'photo' | 'medical' | 'existing_license' | 'other';

export type PaymentType =
  | 'application'
  | 'exam'
  | 'trial'
  | 'medical'
  | 'one_day'
  | 'renewal';

export type PaymentMethod = 'card' | 'bank' | 'wallet';

export type BookingStatus = 'booked' | 'completed' | 'cancelled' | 'no_show';

export interface User {
  id: string;
  name: string;
  nic: string;
  email: string;
  phone: string;
  password?: string;
  role: Role;
  active: boolean;
  address?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  createdAt: string;
}

export interface PersonalDetails {
  fullName: string;
  nic: string;
  dob: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  bloodGroup?: string;
  emergencyContact?: string;
}

export interface DocumentFile {
  id: string;
  applicationId: string;
  type: DocType;
  name: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  verified?: boolean;
}

export interface Application {
  id: string;
  applicantId: string;
  type: ApplicationType;
  category: LicenseCategory;
  status: ApplicationStatus;
  oneDayService: boolean;
  personal: PersonalDetails;
  documents: DocumentFile[];
  trainerType?: 'department' | 'private';
  trainerId?: string;
  privateTrainerName?: string;
  officerId?: string;
  officerNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  type: 'medical' | 'exam' | 'trial' | 'both';
  capacity: number;
  phone?: string;
}

export interface Schedule {
  id: string;
  type: 'medical' | 'exam' | 'trial';
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  examKind?: 'written' | 'computer';
}

export interface MedicalAppointment {
  id: string;
  applicationId: string;
  applicantId: string;
  scheduleId: string;
  locationId: string;
  date: string;
  time: string;
  status: BookingStatus;
  result?: 'pass' | 'fail';
  remarks?: string;
  officerId?: string;
  vision?: string;
  hearing?: string;
  bloodPressure?: string;
}

export interface ExamBooking {
  id: string;
  applicationId: string;
  applicantId: string;
  scheduleId: string;
  locationId: string;
  kind: 'written' | 'computer';
  date: string;
  time: string;
  status: BookingStatus;
  result?: 'pass' | 'fail';
  score?: number;
  remarks?: string;
  examinerId?: string;
  attempt: number;
}

export interface TrialBooking {
  id: string;
  applicationId: string;
  applicantId: string;
  scheduleId: string;
  locationId: string;
  date: string;
  time: string;
  trainerType: 'department' | 'private';
  trainerId?: string;
  status: BookingStatus;
  result?: 'pass' | 'fail';
  remarks?: string;
  examinerId?: string;
  attempt: number;
}

export interface LicenseRecord {
  id: string;
  applicationId: string;
  applicantId: string;
  licenseNumber: string;
  category: LicenseCategory;
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface Payment {
  id: string;
  userId: string;
  applicationId?: string;
  type: PaymentType;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  reference: string;
  cardLast4?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  kind: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  subject: string;
  category: 'service' | 'booking' | 'payment' | 'staff' | 'other';
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  response?: string;
  createdAt: string;
}

export interface TrainingNote {
  id: string;
  trainerId: string;
  applicantId: string;
  applicationId: string;
  note: string;
  progress: number;
  sessionDate: string;
  createdAt: string;
}

export interface TrainerScheduleItem {
  id: string;
  trainerId: string;
  date: string;
  startTime: string;
  endTime: string;
  applicantId?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface ResetToken {
  email: string;
  token: string;
  expiresAt: number;
}

export interface AppState {
  users: User[];
  applications: Application[];
  locations: Location[];
  schedules: Schedule[];
  medicals: MedicalAppointment[];
  exams: ExamBooking[];
  trials: TrialBooking[];
  licenses: LicenseRecord[];
  payments: Payment[];
  notifications: AppNotification[];
  complaints: Complaint[];
  trainingNotes: TrainingNote[];
  trainerSchedules: TrainerScheduleItem[];
  audit: AuditLog[];
  resetTokens: ResetToken[];
}

export const LICENSE_CATEGORIES: { id: LicenseCategory; name: string; desc: string }[] = [
  { id: 'A', name: 'Motorcycle', desc: 'Motorcycles above 125cc' },
  { id: 'A1', name: 'Light Motorcycle', desc: 'Motorcycles up to 125cc' },
  { id: 'B', name: 'Light Vehicle', desc: 'Cars, dual-purpose vehicles up to 3,500kg' },
  { id: 'B1', name: 'Three-Wheeler', desc: 'Motor tricycles and three-wheelers' },
  { id: 'C', name: 'Heavy Goods', desc: 'Goods vehicles above 3,500kg' },
  { id: 'C1', name: 'Light Goods', desc: 'Goods vehicles 3,500–7,500kg' },
  { id: 'D', name: 'Passenger Bus', desc: 'Passenger vehicles above 16 seats' },
  { id: 'G', name: 'Agricultural', desc: 'Land vehicles and agricultural machinery' },
  { id: 'CE', name: 'Articulated', desc: 'Combination vehicles / trailers' },
];

export const FEES: Record<PaymentType, number> = {
  application: 2500,
  exam: 1500,
  trial: 2000,
  medical: 1800,
  one_day: 7500,
  renewal: 3500,
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  documents_verified: 'Documents Verified',
  medical_pending: 'Medical Pending',
  medical_passed: 'Medical Passed',
  medical_failed: 'Medical Failed',
  exam_pending: 'Exam Pending',
  exam_passed: 'Exam Passed',
  exam_failed: 'Exam Failed',
  trial_pending: 'Trial Pending',
  trial_passed: 'Trial Passed',
  trial_failed: 'Trial Failed',
  approved: 'Approved',
  rejected: 'Rejected',
  license_issued: 'License Issued',
};

export const ROLE_LABELS: Record<Role, string> = {
  applicant: 'Citizen / Applicant',
  officer: 'License Registration Officer',
  coordinator: 'Driving Test Coordinator',
  examiner: 'Driving Examiner',
  trainer: 'Driving Trainer',
  medical: 'Medical Officer',
  admin: 'System Administrator',
};

export const ROLE_HOME: Record<Role, string> = {
  applicant: '/app',
  officer: '/officer',
  coordinator: '/coordinator',
  examiner: '/examiner',
  trainer: '/trainer',
  medical: '/medical',
  admin: '/admin',
};

export const TIMELINE_STEPS: { key: ApplicationStatus; label: string }[] = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'medical_passed', label: 'Medical Passed' },
  { key: 'exam_passed', label: 'Exam Passed' },
  { key: 'trial_passed', label: 'Trial Passed' },
  { key: 'approved', label: 'Approved' },
  { key: 'license_issued', label: 'License Issued' },
];
