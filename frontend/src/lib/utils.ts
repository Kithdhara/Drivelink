import type { ApplicationStatus, Role } from '../types';

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMoney(n: number): string {
  return `LKR ${n.toLocaleString('en-LK')}`;
}

export function hoursUntil(date: string, time: string): number {
  const t = new Date(`${date}T${time}:00`);
  return (t.getTime() - Date.now()) / 36e5;
}

export function canReschedule(date: string, time: string): boolean {
  return hoursUntil(date, time) >= 12;
}

export function isWithin12Hours(createdAt?: string | null): boolean {
  if (!createdAt) return true;
  const created = new Date(createdAt).getTime();
  if (isNaN(created)) return true;
  const elapsedHours = (Date.now() - created) / (1000 * 60 * 60);
  return elapsedHours <= 12;
}

export function remainingEditHours(createdAt?: string | null): number {
  if (!createdAt) return 12;
  const created = new Date(createdAt).getTime();
  if (isNaN(created)) return 12;
  const elapsedHours = (Date.now() - created) / (1000 * 60 * 60);
  return Math.max(0, Math.round((12 - elapsedHours) * 10) / 10);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function validateNIC(nic: string): string | null {
  const v = nic.replace(/\s+/g, '').toUpperCase();
  if (!/^\d{9}[VX]$/.test(v) && !/^\d{12}$/.test(v)) {
    return 'Enter a valid NIC (9 digits + V/X, or 12 digits).';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
  return null;
}

export function validatePhone(phone: string): string | null {
  const p = phone.replace(/\D/g, '');
  if (p.length < 9 || p.length > 15) return 'Enter a valid phone number.';
  return null;
}

export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Include at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Include at least one number.';
  return null;
}

export function statusTone(status: ApplicationStatus): string {
  switch (status) {
    case 'license_issued':
    case 'approved':
    case 'medical_passed':
    case 'exam_passed':
    case 'trial_passed':
    case 'documents_verified':
      return 'success';
    case 'rejected':
    case 'medical_failed':
    case 'exam_failed':
    case 'trial_failed':
      return 'danger';
    case 'submitted':
    case 'medical_pending':
    case 'exam_pending':
    case 'trial_pending':
      return 'warn';
    default:
      return 'neutral';
  }
}

export function roleAccent(role: Role): string {
  switch (role) {
    case 'applicant':
      return '#0E7C7B';
    case 'officer':
      return '#1D4E89';
    case 'coordinator':
      return '#7C3AED';
    case 'examiner':
      return '#B45309';
    case 'trainer':
      return '#0F766E';
    case 'medical':
      return '#0369A1';
    case 'admin':
      return '#9F1239';
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export function validateUpload(file: File): string | null {
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!ok.includes(file.type)) return 'Only JPG, PNG, WEBP or PDF files are accepted.';
  if (file.size > 20 * 1024 * 1024) return 'File must be 20 MB or smaller.';
  return null;
}

export function licenseNumber(): string {
  const y = new Date().getFullYear().toString().slice(2);
  const n = Math.floor(100000 + Math.random() * 900000);
  return `B${y}-${n}`;
}

export function paymentRef(): string {
  return `NMTA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function cls(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(' ');
}

export function timelineIndex(status: ApplicationStatus): number {
  const order: ApplicationStatus[] = [
    'submitted',
    'medical_passed',
    'exam_passed',
    'trial_passed',
    'approved',
    'license_issued',
  ];
  if (status === 'rejected') return -1;
  if (status === 'draft') return -1;
  if (status === 'documents_verified' || status === 'medical_pending' || status === 'medical_failed') return 0;
  if (status === 'exam_pending' || status === 'exam_failed') return 1;
  if (status === 'trial_pending' || status === 'trial_failed') return 2;
  const i = order.indexOf(status);
  return i;
}

export const DEMO_PASSWORD = 'Password123!';

export const DEMO_ACCOUNTS: { role: Role; email: string; name: string }[] = [
  { role: 'applicant', email: 'citizen@demo.gov', name: 'Amara Perera' },
  { role: 'officer', email: 'officer@demo.gov', name: 'Priyantha Gunasekara' },
  { role: 'coordinator', email: 'coordinator@demo.gov', name: 'Sanduni Weerasinghe' },
  { role: 'examiner', email: 'examiner@demo.gov', name: 'Lalith Senanayake' },
  { role: 'trainer', email: 'trainer@demo.gov', name: 'Indika Rathnayake' },
  { role: 'medical', email: 'medical@demo.gov', name: 'Dr. Anoma Pathirana' },
  { role: 'admin', email: 'admin@demo.gov', name: 'System Administrator' },
];

export function isDemoPassword(value: string): boolean {
  const v = value.trim();
  return v === DEMO_PASSWORD || v === 'demo' || v === 'Demo123!' || v === 'password';
}
