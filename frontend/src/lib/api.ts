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
/*  TODO: Connect to /api/applications/*                               */
/* ================================================================== */

// POST   /api/applications
// GET    /api/applications/:id
// PUT    /api/applications/:id
// POST   /api/applications/:id/documents
// DELETE /api/applications/:id/documents/:docId

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
