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
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(errorText || `HTTP ${res.status}`);
  }

  return res.json();
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
/*  TODO: Connect to /api/medical/*                                    */
/* ================================================================== */

// POST /api/medical/book
// GET  /api/medical/appointments
// PUT  /api/medical/:id/reschedule
// PUT  /api/medical/:id/cancel
// PUT  /api/medical/:id/result

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

/**
 * POST /api/applications  (multipart/form-data)
 * Submits a new licence application with uploaded documents.
 */
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

/** GET /api/applications/:id — fetch one application by numeric ID */
export async function getApplicationByIdAPI(id: number): Promise<BackendApplication> {
  return apiFetch<BackendApplication>(`/applications/${id}`);
}

/** GET /api/applications/applicant/:applicantId — all applications for a user */
export async function getApplicationsByApplicantAPI(applicantId: string): Promise<BackendApplication[]> {
  return apiFetch<BackendApplication[]>(`/applications/applicant/${applicantId}`);
}

/** GET /api/applications/status/:status — all applications filtered by status */
export async function getApplicationsByStatusAPI(status: string): Promise<BackendApplication[]> {
  return apiFetch<BackendApplication[]>(`/applications/status/${status}`);
}

/** PUT /api/applications/:id — officer updates status + notes + rejection reason */
export async function updateApplicationStatusAPI(
  id: number,
  status: string,
  officerNotes?: string,
  rejectionReason?: string,
): Promise<BackendApplication> {
  return apiFetch<BackendApplication>(`/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, officerNotes: officerNotes ?? '', rejectionReason: rejectionReason ?? '' }),
  });
}

/** GET /api/applications/all — officer fetches every application in the system */
export async function getAllApplicationsAPI(): Promise<BackendApplication[]> {
  return apiFetch<BackendApplication[]>('/applications/all');
}

/**
 * PUT /api/applications/:id/edit  (multipart/form-data)
 * Applicant edits personal details or replaces documents within 12 hours.
 * Throws 403 error if 12-hour window has passed.
 */
export async function editApplicationAPI(
  id: number,
  data: {
    fullName?: string;
    nic?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    phone?: string;
    email?: string;
    bloodGroup?: string;
    emergencyContact?: string;
    nicCopy?: File;
    passportPhoto?: File;
    medicalReport?: File;
  },
): Promise<BackendApplication> {
  const form = new FormData();
  if (data.fullName)        form.append('fullName', data.fullName);
  if (data.nic)             form.append('nic', data.nic);
  if (data.dateOfBirth)     form.append('dateOfBirth', data.dateOfBirth);
  if (data.gender)          form.append('gender', data.gender);
  if (data.address)         form.append('address', data.address);
  if (data.phone)           form.append('phone', data.phone);
  if (data.email)           form.append('email', data.email);
  if (data.bloodGroup)      form.append('bloodGroup', data.bloodGroup);
  if (data.emergencyContact) form.append('emergencyContact', data.emergencyContact);
  if (data.nicCopy)         form.append('nicCopy', data.nicCopy);
  if (data.passportPhoto)   form.append('passportPhoto', data.passportPhoto);
  if (data.medicalReport)   form.append('medicalReport', data.medicalReport);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/applications/${id}/edit`, {
    method: 'PUT',
    headers,
    body: form,
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Build a browser URL to preview an uploaded document */
export function getDocumentUrl(filePath: string): string {
  // filePath = "uploads/applications/nic_xxx.jpg"
  const filename = filePath.split('/').pop();
  return `${API_BASE}/applications/files/${filename}`;
}

/* ================================================================== */
/*  Module: Driving Exam Booking                                       */
/*  Owner: Madampage K.S (IT25100851)                                  */
/*  TODO: Connect to /api/exams/*                                      */
/* ================================================================== */

// POST /api/exams/book
// GET  /api/exams/schedule
// PUT  /api/exams/:id/reschedule
// PUT  /api/exams/:id/cancel
// PUT  /api/exams/:id/result

/* ================================================================== */
/*  Module: Driving Trial Booking                                      */
/*  Owner: Fernando U.A.E.N (IT25100821)                               */
/*  TODO: Connect to /api/trials/*                                     */
/* ================================================================== */

// POST /api/trials/book
// GET  /api/trials/schedule
// PUT  /api/trials/:id/reschedule
// PUT  /api/trials/:id/cancel
// PUT  /api/trials/:id/result

/* ================================================================== */
/*  Module: License Approval & Issuing                                 */
/*  Owner: Thasalogithan S (IT25100830)                                */
/*  TODO: Connect to /api/licenses/*                                   */
/* ================================================================== */

// GET  /api/applications?status=pending
// PUT  /api/applications/:id/verify
// PUT  /api/applications/:id/decide
// POST /api/licenses/issue

/* ================================================================== */
/*  Module: Driving License Renewal                                    */
/*  Owner: Karunarathne D.K.K.P (IT25100856)                          */
/*  TODO: Connect to /api/renewals/*                                   */
/* ================================================================== */

// POST /api/renewals
// GET  /api/renewals/:id
// PUT  /api/renewals/:id

/* ================================================================== */
/*  Shared: Payments, Notifications, Complaints                        */
/* ================================================================== */

// POST /api/payments
// GET  /api/payments?userId=...
// GET  /api/notifications?userId=...
// PUT  /api/notifications/:id/read
// POST /api/complaints
// PUT  /api/complaints/:id/respond

/* ================================================================== */
/*  Admin: User Management, Reports, Audit                             */
/* ================================================================== */

// GET    /api/admin/users
// POST   /api/admin/users
// PUT    /api/admin/users/:id
// DELETE /api/admin/users/:id
// GET    /api/admin/reports
// GET    /api/admin/audit
