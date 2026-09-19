/**
 * API Service Layer
 * -----------------
 * This module acts as a bridge between React page components and the data layer.
 *
 * CURRENT STATE: All functions call the in-memory localStorage store directly.
 *
 * FUTURE (Spring Boot): Each team member replaces the body of their module's
 * functions with real HTTP calls to the Java REST API. Page components stay
 * unchanged — they only import from this file.
 *
 * Example migration:
 *   BEFORE (localStorage):
 *     export async function bookMedical(store, data) {
 *       return store.bookMedical(data);
 *     }
 *
 *   AFTER (Spring Boot):
 *     export async function bookMedical(_store, data) {
 *       const res = await fetch('/api/medical/book', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
 *         body: JSON.stringify(data),
 *       });
 *       if (!res.ok) throw new Error(await res.text());
 *       return res.json();
 *     }
 *
 * Each member should only modify the functions that belong to their major function.
 */

// ----- Helper for future JWT auth -----
// TODO: Replace with real token management when Spring Boot is connected
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('nmta-jwt');
  } catch {
    return null;
  }
}

// TODO: Replace with your Spring Boot base URL
export const API_BASE = '/api';

// ----- Generic fetch wrapper (for future use) -----
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    try {
      const errJson = JSON.parse(errorText);
      throw new Error(errJson.error || errJson.message || errorText);
    } catch (e: any) {
      if (e.message && e.message !== errorText && !e.message.startsWith('Unexpected')) {
        throw e;
      }
      throw new Error(errorText || `HTTP ${res.status}`);
    }
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

/* ================================================================== */
/*  Module: Authentication (shared)                                    */
/* ================================================================== */

/**
 * Calls POST /api/auth/login on the Java Spring Boot backend.
 * Returns the User object from SQL Server on success.
 * Throws an error string on failure.
 */
export async function loginUser(email: string, password: string) {
  return apiFetch<{
    id: string; name: string; email: string; nic: string;
    phone: string; role: string; active: boolean;
    address?: string; dob?: string; gender?: string; createdAt: string;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Calls POST /api/auth/register on the Java Spring Boot backend.
 * Saves the new user to SQL Server and returns the saved User object.
 */
export async function registerUser(data: {
  name: string; nic: string; email: string;
  phone: string; password: string; role: string;
}) {
  return apiFetch<{
    id: string; name: string; email: string; nic: string;
    phone: string; role: string; active: boolean; createdAt: string;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* ================================================================== */
/*  Module: Medical Test Booking                                       */
/*  Owner: Weerasinghe W.P.D.V (IT25100817)                           */
/*  Connected to /api/medical/*                                        */
/* ================================================================== */

export interface BackendMedicalAppointment {
  id: number;
  applicantId: string;
  centreId: number;
  centreName: string;
  slotId: number;
  date: string;
  timeSlot: string;
  status: string;
  result: string | null;
  remarks: string | null;
  medicalReportPath: string | null;
  vision: string | null;
  hearing: string | null;
  bloodPressure: string | null;
  medicalOfficerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function bookMedicalAPI(data: {
  applicantId: string; slotId: number;
}): Promise<BackendMedicalAppointment> {
  return apiFetch('/medical/book', { method: 'POST', body: JSON.stringify(data) });
}

export async function getMedicalsByApplicantAPI(applicantId: string): Promise<BackendMedicalAppointment[]> {
  return apiFetch(`/medical/user/${applicantId}`);
}

export async function rescheduleMedicalAPI(id: number, slotId: number): Promise<BackendMedicalAppointment> {
  return apiFetch(`/medical/${id}/reschedule`, { method: 'PUT', body: JSON.stringify({ slotId }) });
}

export async function cancelMedicalAPI(id: number): Promise<void> {
  await apiFetch(`/medical/${id}`, { method: 'DELETE' });
}

export async function recordMedicalResultAPI(id: number, data: {
  officerId: string; result: string; remarks?: string;
  vision?: string; hearing?: string; bloodPressure?: string;
}): Promise<BackendMedicalAppointment> {
  return apiFetch(`/medical/${id}/result`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function getAllMedicalsAPI(): Promise<BackendMedicalAppointment[]> {
  return apiFetch('/medical/all');
}

export async function checkMedicalPassedAPI(applicantId: string): Promise<{ passed: boolean }> {
  return apiFetch(`/medical/check/${applicantId}`);
}

/* ================================================================== */
/*  Module: License Application & Document Uploading                   */
/*  Owner: Simra M.A.F (IT25100815)                                    */
/*  Connected to /api/applications/*                                   */
/* ================================================================== */

/** Shape of a LicenseApplication returned by the Spring Boot backend */
export interface BackendApplication {
  id: number;
  applicantId: string;
  applicantName: string;
  licenseClasses: string;
  oneDayService: boolean;
  fullName: string;
  nic: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  bloodGroup: string;
  emergencyContact: string | null;
  nicCopyPath: string;
  passportPhotoPath: string;
  medicalReportPath: string;
  status: string;
  rejectionReason: string | null;
  officerNotes: string | null;
  submittedAt: string;
  updatedAt: string;
}

export async function createApplicationAPI(data: {
  licenseClasses: string;
  oneDayService: boolean;
  fullName: string;
  nic: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  bloodGroup: string;
  emergencyContact?: string;
  applicantId: string;
  applicantName: string;
  nicCopy: File;
  passportPhoto: File;
  medicalReport?: File;
}): Promise<BackendApplication> {
  const form = new FormData();
  form.append('licenseClasses', data.licenseClasses);
  form.append('oneDayService', String(data.oneDayService));
  form.append('fullName', data.fullName);
  form.append('nic', data.nic);
  form.append('dateOfBirth', data.dateOfBirth);
  form.append('gender', data.gender);
  form.append('address', data.address);
  form.append('phone', data.phone);
  form.append('email', data.email);
  form.append('bloodGroup', data.bloodGroup || '');
  if (data.emergencyContact) form.append('emergencyContact', data.emergencyContact);
  form.append('applicantId', data.applicantId);
  form.append('applicantName', data.applicantName);
  form.append('nicCopy', data.nicCopy);
  form.append('passportPhoto', data.passportPhoto);
  if (data.medicalReport) form.append('medicalReport', data.medicalReport);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/applications`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getApplicationByIdAPI(id: number): Promise<BackendApplication> {
  return apiFetch<BackendApplication>(`/applications/${id}`);
}

export async function getApplicationsByApplicantAPI(applicantId: string): Promise<BackendApplication[]> {
  return apiFetch<BackendApplication[]>(`/applications/applicant/${applicantId}`);
}

export async function getApplicationsByStatusAPI(status: string): Promise<BackendApplication[]> {
  return apiFetch<BackendApplication[]>(`/applications/status/${status}`);
}

export async function updateApplicationStatusAPI(
  id: number, status: string, officerNotes?: string, rejectionReason?: string,
): Promise<BackendApplication> {
  return apiFetch<BackendApplication>(`/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, officerNotes: officerNotes ?? '', rejectionReason: rejectionReason ?? '' }),
  });
}

export async function getAllApplicationsAPI(): Promise<BackendApplication[]> {
  return apiFetch<BackendApplication[]>('/applications/all');
}

export async function editApplicationAPI(
  id: number, data: {
    fullName?: string; nic?: string; dateOfBirth?: string; gender?: string;
    address?: string; phone?: string; email?: string; bloodGroup?: string;
    emergencyContact?: string; nicCopy?: File; passportPhoto?: File; medicalReport?: File;
  },
): Promise<BackendApplication> {
  const form = new FormData();
  if (data.fullName) form.append('fullName', data.fullName);
  if (data.nic) form.append('nic', data.nic);
  if (data.dateOfBirth) form.append('dateOfBirth', data.dateOfBirth);
  if (data.gender) form.append('gender', data.gender);
  if (data.address) form.append('address', data.address);
  if (data.phone) form.append('phone', data.phone);
  if (data.email) form.append('email', data.email);
  if (data.bloodGroup) form.append('bloodGroup', data.bloodGroup);
  if (data.emergencyContact) form.append('emergencyContact', data.emergencyContact);
  if (data.nicCopy) form.append('nicCopy', data.nicCopy);
  if (data.passportPhoto) form.append('passportPhoto', data.passportPhoto);
  if (data.medicalReport) form.append('medicalReport', data.medicalReport);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/applications/${id}/edit`, {
    method: 'PUT', headers, body: form,
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteApplicationAPI(id: number): Promise<void> {
  await apiFetch(`/applications/${id}`, { method: 'DELETE' });
}

export function getDocumentUrl(filePath: string): string {
  const filename = filePath.split('/').pop();
  return `${API_BASE}/applications/files/${filename}`;
}

/* ================================================================== */
/*  Module: Driving Exam Booking                                       */
/*  Owner: Madampage K.S (IT25100851)                                  */
/*  Connected to /api/exams/*                                          */
/* ================================================================== */

export interface BackendExamBooking {
  id: number;
  applicantId: string;
  applicationId: number;
  centreId: number;
  centreName: string;
  slotId: number;
  date: string;
  timeSlot: string;
  status: string;
  result: string | null;
  score: number | null;
  remarks: string | null;
  examinerId: string | null;
  attempt: number;
  createdAt: string;
  updatedAt: string;
}

export async function bookExamAPI(data: {
  applicantId: string; applicationId: number; slotId: number;
}): Promise<BackendExamBooking> {
  return apiFetch('/exams/book', { method: 'POST', body: JSON.stringify(data) });
}

export async function getExamsByApplicantAPI(applicantId: string): Promise<BackendExamBooking[]> {
  return apiFetch(`/exams/user/${applicantId}`);
}

export async function rescheduleExamAPI(id: number, slotId: number): Promise<BackendExamBooking> {
  return apiFetch(`/exams/${id}/reschedule`, { method: 'PUT', body: JSON.stringify({ slotId }) });
}

export async function cancelExamAPI(id: number): Promise<void> {
  await apiFetch(`/exams/${id}`, { method: 'DELETE' });
}

export async function recordExamResultAPI(id: number, data: {
  examinerId: string; result: string; score?: number; remarks?: string;
}): Promise<BackendExamBooking> {
  return apiFetch(`/exams/${id}/result`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, score: data.score != null ? String(data.score) : undefined }),
  });
}

export async function getAllExamsAPI(): Promise<BackendExamBooking[]> {
  return apiFetch('/exams/all');
}

/* ================================================================== */
/*  Module: Driving Trial Booking                                      */
/*  Owner: Fernando U.A.E.N (IT25100821)                               */
/*  Connected to /api/trials/*                                         */
/* ================================================================== */

export interface BackendTrialBooking {
  id: number;
  applicantId: string;
  applicationId: number;
  examBookingId: number;
  centreId: number;
  centreName: string;
  slotId: number;
  date: string;
  timeSlot: string;
  status: string;
  result: string | null;
  remarks: string | null;
  examinerId: string | null;
  trainerType: string;
  trainerId: string | null;
  privateTrainerName: string | null;
  attempt: number;
  examPassDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTrainerBooking {
  id: number;
  applicantId: string;
  trialBookingId: number;
  trainerType: string;
  trainerName: string | null;
  trainerPhone: string | null;
  sessions: number;
  notes: string | null;
  status: string;
  createdAt: string;
}

export async function bookTrialAPI(data: {
  applicantId: string; applicationId: number; slotId: number;
  trainerType: string; trainerId?: string; privateTrainerName?: string;
}): Promise<BackendTrialBooking> {
  return apiFetch('/trials/book', { method: 'POST', body: JSON.stringify(data) });
}

export async function getTrialsByApplicantAPI(applicantId: string): Promise<BackendTrialBooking[]> {
  return apiFetch(`/trials/user/${applicantId}`);
}

export async function rescheduleTrialAPI(id: number, slotId: number): Promise<BackendTrialBooking> {
  return apiFetch(`/trials/${id}/reschedule`, { method: 'PUT', body: JSON.stringify({ slotId }) });
}

export async function cancelTrialAPI(id: number): Promise<void> {
  await apiFetch(`/trials/${id}`, { method: 'DELETE' });
}

export async function recordTrialResultAPI(id: number, data: {
  examinerId: string; result: string; remarks?: string;
}): Promise<BackendTrialBooking> {
  return apiFetch(`/trials/${id}/result`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function bookTrainerAPI(trialId: number, data: {
  applicantId: string; trainerType: string;
  trainerName?: string; trainerPhone?: string;
}): Promise<BackendTrainerBooking> {
  return apiFetch(`/trials/${trialId}/trainer`, { method: 'POST', body: JSON.stringify(data) });
}

export async function getTrainersByApplicantAPI(applicantId: string): Promise<BackendTrainerBooking[]> {
  return apiFetch(`/trials/trainers/${applicantId}`);
}

export async function getAllTrialsAPI(): Promise<BackendTrialBooking[]> {
  return apiFetch('/trials/all');
}

/* ================================================================== */
/*  Module: License Approval & Issuing                                 */
/*  Owner: Thasalogithan S (IT25100830)                                */
/*  Connected to /api/licenses/*                                       */
/* ================================================================== */

export interface BackendLicenseRecord {
  id: number;
  applicantId: string;
  applicationId: number;
  licenseNumber: string;
  category: string;
  issuedAt: string;
  expiresAt: string;
  status: string;
  issuedBy: string | null;
  revokeReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function issueLicenseAPI(applicationId: number, officerId: string): Promise<BackendLicenseRecord> {
  return apiFetch('/licenses/issue', {
    method: 'POST',
    body: JSON.stringify({ applicationId: String(applicationId), officerId }),
  });
}

export async function getAllLicensesAPI(): Promise<BackendLicenseRecord[]> {
  return apiFetch('/licenses/all');
}

export async function getLicensesByApplicantAPI(applicantId: string): Promise<BackendLicenseRecord[]> {
  return apiFetch(`/licenses/user/${applicantId}`);
}

export async function updateLicenseStatusAPI(id: number, status: string, reason?: string): Promise<BackendLicenseRecord> {
  return apiFetch(`/licenses/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, reason: reason ?? '' }),
  });
}

export async function revokeLicenseAPI(id: number, reason: string): Promise<BackendLicenseRecord> {
  return apiFetch(`/licenses/${id}/revoke`, { method: 'PUT', body: JSON.stringify({ reason }) });
}

export async function verifyDocumentsAPI(appId: number, officerId: string, notes?: string): Promise<BackendApplication> {
  return apiFetch(`/licenses/verify/${appId}`, {
    method: 'PUT',
    body: JSON.stringify({ officerId, notes: notes ?? '' }),
  });
}

export async function decideApplicationAPI(
  appId: number, officerId: string, decision: string, reason?: string,
): Promise<BackendApplication> {
  return apiFetch(`/licenses/decide/${appId}`, {
    method: 'PUT',
    body: JSON.stringify({ officerId, decision, reason: reason ?? '' }),
  });
}

/* ================================================================== */
/*  Module: Driving License Renewal                                    */
/*  Owner: Karunarathne D.K.K.P (IT25100856)                          */
/*  Connected to /api/renewals/*                                       */
/* ================================================================== */

export interface BackendRenewal {
  id: string;
  applicantId: string;
  licenseNumber: string;
  category: string;
  fullName: string;
  nic: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  oneDayService: boolean;
  nicCopyPath: string | null;
  photoPath: string | null;
  existingLicensePath: string | null;
  medicalReportPath: string | null;
  status: string;
  officerNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createRenewalAPI(data: {
  applicantId: string; licenseNumber: string; category: string;
  fullName: string; nic: string; phone?: string; email?: string;
  address?: string; oneDayService?: boolean;
  nicCopy?: File; passportPhoto?: File; medicalReport?: File;
}): Promise<BackendRenewal> {
  const form = new FormData();
  form.append('applicantId', data.applicantId);
  form.append('licenseNumber', data.licenseNumber.trim().toUpperCase());
  form.append('category', data.category);
  form.append('fullName', data.fullName);
  form.append('nic', data.nic);
  if (data.phone) form.append('phone', data.phone);
  if (data.email) form.append('email', data.email);
  if (data.address) form.append('address', data.address);
  form.append('oneDayService', String(Boolean(data.oneDayService)));
  if (data.nicCopy) form.append('nicCopy', data.nicCopy);
  if (data.passportPhoto) form.append('passportPhoto', data.passportPhoto);
  if (data.medicalReport) form.append('medicalReport', data.medicalReport);

  const res = await fetch(`${API_BASE}/renewals`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export function getRenewalDocumentUrl(path?: string | null): string {
  if (!path) return '';
  const filename = path.replace(/^.*[\\/]/, '');
  return `${API_BASE}/renewals/files/${encodeURIComponent(filename)}`;
}

export async function getRenewalsByApplicantAPI(applicantId: string): Promise<BackendRenewal[]> {
  return apiFetch(`/renewals/user/${applicantId}`);
}

export async function getRenewalByIdAPI(id: string): Promise<BackendRenewal> {
  return apiFetch(`/renewals/${id}`);
}

export async function editRenewalAPI(id: string, data: Partial<BackendRenewal>): Promise<BackendRenewal> {
  return apiFetch(`/renewals/${id}/edit`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function cancelRenewalAPI(id: string): Promise<{ message: string; status: string; renewal?: BackendRenewal }> {
  return apiFetch(`/renewals/${id}/cancel`, { method: 'PUT' });
}

export async function deleteRenewalAPI(id: string): Promise<void> {
  await apiFetch(`/renewals/${id}`, { method: 'DELETE' });
}

export async function checkRenewalEditableAPI(id: string): Promise<{ editable: boolean }> {
  return apiFetch(`/renewals/${id}/editable`);
}

export async function getAllRenewalsAPI(): Promise<BackendRenewal[]> {
  return apiFetch('/renewals/all');
}

export async function getPendingRenewalsAPI(): Promise<BackendRenewal[]> {
  return apiFetch('/renewals/pending');
}

export async function approveRenewalAPI(id: string, notes?: string): Promise<BackendRenewal> {
  return apiFetch(`/renewals/${id}/approve`, { method: 'PUT', body: JSON.stringify({ notes: notes ?? '' }) });
}

export async function rejectRenewalAPI(id: string, notes?: string, reason?: string): Promise<BackendRenewal> {
  return apiFetch(`/renewals/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ notes: notes ?? '', reason: reason ?? '' }),
  });
}

/* ================================================================== */
/*  Shared: Time Slots & Centres                                       */
/* ================================================================== */

export interface BackendTimeSlot {
  id: number;
  type: string;
  centreId: number;
  centreName: string;
  city?: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
}

export interface BackendCentre {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  capacity: number;
}

export async function getAvailableSlotsAPI(type: string): Promise<BackendTimeSlot[]> {
  return apiFetch(`/slots?type=${type}`);
}

export async function getAllSlotsAPI(): Promise<BackendTimeSlot[]> {
  return apiFetch('/slots');
}

export async function createSlotAPI(slot: Omit<BackendTimeSlot, 'id' | 'booked'>): Promise<BackendTimeSlot> {
  return apiFetch('/slots', { method: 'POST', body: JSON.stringify(slot) });
}

export async function deleteSlotAPI(id: number): Promise<void> {
  await apiFetch(`/slots/${id}`, { method: 'DELETE' });
}

export async function getAllCentresAPI(): Promise<BackendCentre[]> {
  return apiFetch('/slots/centres');
}

export async function createCentreAPI(centre: Omit<BackendCentre, 'id'>): Promise<BackendCentre> {
  return apiFetch('/slots/centres', { method: 'POST', body: JSON.stringify(centre) });
}

/* ================================================================== */
/*  Module: Support Tickets & Profile Override (Post-12-Hour)          */
/*  Connected to /api/tickets/*                                        */
/* ================================================================== */

export interface BackendTicket {
  id: number;
  ticketNumber: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicationId: number;
  requestedFullName?: string;
  requestedNic?: string;
  requestedDateOfBirth?: string;
  requestedGender?: string;
  requestedAddress?: string;
  requestedPhone?: string;
  requestedEmail?: string;
  requestedBloodGroup?: string;
  requestedEmergencyContact?: string;
  reason: string;
  nicCopyPath?: string;
  birthCertificatePath?: string;
  additionalDocPath?: string;
  status: 'PENDING_REVIEW' | 'OPEN' | 'RESOLVED' | 'REJECTED';
  officerId?: string;
  officerName?: string;
  officerNotes?: string;
  newApplicationId?: number;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export interface BackendAuditLog {
  id: number;
  officerId?: string;
  officerName?: string;
  action: string;
  ticketId?: number;
  oldApplicationId?: number;
  newApplicationId?: number;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export async function createTicketAPI(formData: FormData): Promise<BackendTicket> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    try {
      const err = JSON.parse(errorText);
      throw new Error(err.error || err.message || errorText);
    } catch {
      throw new Error(errorText || `HTTP ${res.status}`);
    }
  }

  return res.json();
}

export async function getTicketsByApplicantAPI(applicantId: string): Promise<BackendTicket[]> {
  return apiFetch(`/tickets/applicant/${applicantId}`);
}

export async function getTicketByIdAPI(id: number): Promise<BackendTicket> {
  return apiFetch(`/tickets/${id}`);
}

export async function getAllTicketsAPI(status?: string): Promise<BackendTicket[]> {
  return apiFetch(status ? `/tickets?status=${status}` : '/tickets');
}

export async function overrideTicketAPI(
  id: number,
  data: { officerId: string; officerName: string; officerNotes?: string }
): Promise<{ success: boolean; message: string; newApplicationId: number }> {
  return apiFetch(`/tickets/${id}/override`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function rejectTicketAPI(
  id: number,
  data: { officerId: string; officerName: string; reason: string }
): Promise<BackendTicket> {
  return apiFetch(`/tickets/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAuditLogsAPI(): Promise<BackendAuditLog[]> {
  return apiFetch('/tickets/audit');
}

export function getTicketDocumentUrl(filename?: string): string {
  if (!filename) return '';
  return `${API_BASE}/tickets/files/${filename}`;
}

