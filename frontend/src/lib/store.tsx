import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Application,
  ApplicationStatus,
  AppNotification,
  AppState,
  BookingStatus,
  Complaint,
  DocumentFile,
  ExamBooking,
  LicenseRecord,
  Location,
  MedicalAppointment,
  Payment,
  PaymentMethod,
  PaymentType,
  Role,
  Schedule,
  TrainerScheduleItem,
  TrainingNote,
  TrialBooking,
  User,
} from '../types';
import { FEES } from '../types';
import { buildSeed } from './seed';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, isDemoPassword, licenseNumber, paymentRef, uid } from './utils';

const KEY = 'nmta-dls-v2';

function emptyState(): AppState {
  return {
    users: [],
    applications: [],
    locations: [],
    schedules: [],
    medicals: [],
    exams: [],
    trials: [],
    licenses: [],
    payments: [],
    notifications: [],
    complaints: [],
    trainingNotes: [],
    trainerSchedules: [],
    audit: [],
    resetTokens: [],
  };
}

function ensureDemoUsers(state: AppState): AppState {
  const seed = buildSeed();
  const byEmail = new Map(state.users.map((u) => [u.email.toLowerCase(), u]));
  let changed = false;
  for (const demo of seed.users.filter((u) => DEMO_ACCOUNTS.some((d) => d.email === u.email))) {
    const existing = byEmail.get(demo.email.toLowerCase());
    if (!existing) {
      byEmail.set(demo.email.toLowerCase(), { ...demo, password: DEMO_PASSWORD, active: true });
      changed = true;
    } else if (existing.password !== DEMO_PASSWORD || !existing.active || existing.role !== demo.role) {
      byEmail.set(existing.email.toLowerCase(), {
        ...existing,
        password: DEMO_PASSWORD,
        active: true,
        role: demo.role,
        name: existing.name || demo.name,
      });
      changed = true;
    }
  }
  if (!changed && state.users.length) return state;
  return { ...state, users: [...byEmail.values()] };
}

function normalize(raw: Partial<AppState> | null | undefined): AppState {
  const base = emptyState();
  const merged: AppState = {
    ...base,
    ...raw,
    users: raw?.users ?? [],
    applications: raw?.applications ?? [],
    locations: raw?.locations ?? base.locations,
    schedules: raw?.schedules ?? [],
    medicals: raw?.medicals ?? [],
    exams: raw?.exams ?? [],
    trials: raw?.trials ?? [],
    licenses: raw?.licenses ?? [],
    payments: raw?.payments ?? [],
    notifications: raw?.notifications ?? [],
    complaints: raw?.complaints ?? [],
    trainingNotes: raw?.trainingNotes ?? [],
    trainerSchedules: raw?.trainerSchedules ?? [],
    audit: raw?.audit ?? [],
    resetTokens: raw?.resetTokens ?? [],
  };
  if (!merged.locations.length) merged.locations = buildSeed().locations;
  if (!merged.schedules.length) merged.schedules = buildSeed().schedules;
  return ensureDemoUsers(merged);
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem('nmta-dls-v1');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      if (parsed && Array.isArray(parsed.users)) return normalize(parsed);
    }
  } catch {
    /* ignore */
  }
  return buildSeed();
}

function persist(s: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode — keep working in memory */
  }
}

interface StoreApi {
  state: AppState;
  resetDemo: () => void;
  register: (input: {
    name: string;
    nic: string;
    email: string;
    phone: string;
    password: string;
  }) => { ok: true; user: User } | { ok: false; error: string };
  login: (email: string, password: string) => { ok: true; user: User } | { ok: false; error: string };
  requestReset: (email: string) => { ok: true; token: string } | { ok: false; error: string };
  resetPassword: (token: string, password: string) => { ok: true } | { ok: false; error: string };
  updateProfile: (userId: string, patch: Partial<User>) => void;
  createUser: (input: Omit<User, 'id' | 'createdAt'>) => { ok: true; user: User } | { ok: false; error: string };
  updateUser: (id: string, patch: Partial<User>) => void;
  deactivateUser: (id: string) => void;
  createApplication: (app: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: ApplicationStatus }) => Application;
  updateApplication: (id: string, patch: Partial<Application>) => void;
  addDocument: (applicationId: string, doc: Omit<DocumentFile, 'id' | 'applicationId' | 'uploadedAt'>) => void;
  verifyDocuments: (applicationId: string, officerId: string, notes?: string) => void;
  decideApplication: (applicationId: string, officerId: string, decision: 'approve' | 'reject', reason?: string) => void;
  issueLicense: (applicationId: string, officerId: string) => LicenseRecord | null;
  createSchedule: (s: Omit<Schedule, 'id' | 'booked'>) => Schedule;
  updateSchedule: (id: string, patch: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => { ok: true } | { ok: false; error: string };
  upsertLocation: (loc: Location) => void;
  bookMedical: (input: {
    applicationId: string;
    applicantId: string;
    scheduleId: string;
  }) => { ok: true; booking: MedicalAppointment } | { ok: false; error: string };
  cancelMedical: (id: string) => void;
  rescheduleMedical: (id: string, scheduleId: string) => { ok: true } | { ok: false; error: string };
  recordMedical: (
    id: string,
    officerId: string,
    result: 'pass' | 'fail',
    extras: { remarks?: string; vision?: string; hearing?: string; bloodPressure?: string },
  ) => void;
  bookExam: (input: {
    applicationId: string;
    applicantId: string;
    scheduleId: string;
    kind: 'written' | 'computer';
  }) => { ok: true; booking: ExamBooking } | { ok: false; error: string };
  cancelExam: (id: string) => void;
  rescheduleExam: (id: string, scheduleId: string) => { ok: true } | { ok: false; error: string };
  recordExam: (
    id: string,
    examinerId: string,
    result: 'pass' | 'fail',
    score?: number,
    remarks?: string,
  ) => void;
  bookTrial: (input: {
    applicationId: string;
    applicantId: string;
    scheduleId: string;
    trainerType: 'department' | 'private';
    trainerId?: string;
    privateTrainerName?: string;
  }) => { ok: true; booking: TrialBooking } | { ok: false; error: string };
  cancelTrial: (id: string) => void;
  rescheduleTrial: (id: string, scheduleId: string) => { ok: true } | { ok: false; error: string };
  recordTrial: (id: string, examinerId: string, result: 'pass' | 'fail', remarks?: string) => void;
  pay: (input: {
    userId: string;
    applicationId?: string;
    type: PaymentType;
    method: PaymentMethod;
    cardLast4?: string;
  }) => Payment;
  notify: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: (userId: string) => void;
  addComplaint: (c: Omit<Complaint, 'id' | 'createdAt' | 'status'>) => Complaint;
  respondComplaint: (id: string, response: string, status: Complaint['status']) => void;
  addTrainingNote: (n: Omit<TrainingNote, 'id' | 'createdAt'>) => void;
  addTrainerSlot: (s: Omit<TrainerScheduleItem, 'id'>) => void;
  removeTrainerSlot: (id: string) => void;
  sendTraineeReminder: (trainerId: string, applicantId: string, message: string) => void;
  log: (entry: Omit<import('../types').AuditLog, 'id' | 'createdAt'>) => void;
}

const StoreCtx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    persist(state);
  }, [state]);

  const patch = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => {
      const next = fn(prev);
      stateRef.current = next;
      return next;
    });
  }, []);

  const log = useCallback(
    (entry: Omit<import('../types').AuditLog, 'id' | 'createdAt'>) => {
      patch((s) => ({
        ...s,
        audit: [
          {
            ...entry,
            id: uid('au'),
            createdAt: new Date().toISOString(),
          },
          ...(s.audit ?? []),
        ],
      }));
    },
    [patch],
  );

  const notify = useCallback(
    (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      patch((s) => ({
        ...s,
        notifications: [
          {
            ...n,
            id: uid('nt'),
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...(s.notifications ?? []),
        ],
      }));
    },
    [patch],
  );

  const api = useMemo<StoreApi>(() => {
    return {
      state,
      resetDemo: () => {
        const next = buildSeed();
        stateRef.current = next;
        setState(next);
        try {
          localStorage.removeItem(KEY);
          persist(next);
        } catch {
          /* ignore */
        }
      },
      register: (input) => {
        const nic = input.nic.trim().toUpperCase();
        const email = input.email.trim().toLowerCase();
        const users = stateRef.current.users;
        if (users.some((u) => u.nic.toUpperCase() === nic)) {
          return { ok: false, error: 'An account already exists for this NIC.' };
        }
        if (users.some((u) => u.email.toLowerCase() === email)) {
          return { ok: false, error: 'An account already exists for this email.' };
        }
        const user: User = {
          id: uid('u'),
          name: input.name.trim(),
          nic,
          email,
          phone: input.phone.trim(),
          password: input.password,
          role: 'applicant',
          active: true,
          createdAt: new Date().toISOString(),
        };
        patch((s) => ({ ...s, users: [...s.users, user] }));
        return { ok: true, user };
      },
      login: (email, password) => {
        const needle = email.trim().toLowerCase();
        let live = ensureDemoUsers(stateRef.current);
        let user = live.users.find((u) => u.email.toLowerCase() === needle);
        if (!user) {
          const seedUser = buildSeed().users.find((u) => u.email.toLowerCase() === needle);
          if (seedUser) {
            user = { ...seedUser, password: DEMO_PASSWORD, active: true };
            live = { ...live, users: [...live.users, user] };
          }
        }
        if (live !== stateRef.current) {
          stateRef.current = live;
          setState(live);
        }
        if (!user) return { ok: false, error: 'No account found for that email.' };
        const demoMatch = DEMO_ACCOUNTS.some((d) => d.email.toLowerCase() === user.email.toLowerCase());
        const passwordOk = user.password === password || (demoMatch && isDemoPassword(password));
        if (!passwordOk) return { ok: false, error: 'Incorrect password. Demo accounts use Password123!' };
        if (!user.active && !demoMatch) {
          return { ok: false, error: 'This account has been deactivated. Contact the administrator.' };
        }
        const unlocked = { ...user, active: true, password: demoMatch ? DEMO_PASSWORD : user.password };
        if (unlocked.active !== user.active || unlocked.password !== user.password) {
          const next = {
            ...live,
            users: live.users.map((u) => (u.id === unlocked.id ? unlocked : u)),
          };
          stateRef.current = next;
          setState(next);
        }
        return { ok: true, user: unlocked };
      },
      requestReset: (email) => {
        const user = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user) return { ok: false, error: 'No account found for that email.' };
        const token = uid('rst').toUpperCase();
        patch((s) => ({
          ...s,
          resetTokens: [
            ...s.resetTokens.filter((t) => t.email !== user.email),
            { email: user.email, token, expiresAt: Date.now() + 1000 * 60 * 30 },
          ],
        }));
        return { ok: true, token };
      },
      resetPassword: (token, password) => {
        const rec = state.resetTokens.find((t) => t.token === token);
        if (!rec || rec.expiresAt < Date.now()) return { ok: false, error: 'This reset link is invalid or has expired.' };
        patch((s) => ({
          ...s,
          users: s.users.map((u) => (u.email === rec.email ? { ...u, password } : u)),
          resetTokens: s.resetTokens.filter((t) => t.token !== token),
        }));
        return { ok: true };
      },
      updateProfile: (userId, p) => {
        patch((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === userId ? { ...u, ...p, id: u.id, role: u.role } : u)),
        }));
      },
      createUser: (input) => {
        if (state.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
          return { ok: false, error: 'Email already in use.' };
        }
        if (state.users.some((u) => u.nic.toUpperCase() === input.nic.toUpperCase())) {
          return { ok: false, error: 'NIC already in use.' };
        }
        const user: User = { ...input, id: uid('u'), createdAt: new Date().toISOString() };
        patch((s) => ({ ...s, users: [...s.users, user] }));
        return { ok: true, user };
      },
      updateUser: (id, p) => {
        patch((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...p } : u)) }));
      },
      deactivateUser: (id) => {
        patch((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === id ? { ...u, active: false } : u)),
        }));
      },
      createApplication: (app) => {
        const n = 1000 + state.applications.length + 1;
        const created: Application = {
          ...app,
          id: `APP-${n}`,
          status: app.status ?? 'submitted',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        patch((s) => ({ ...s, applications: [created, ...s.applications] }));
        return created;
      },
      updateApplication: (id, p) => {
        patch((s) => ({
          ...s,
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, ...p, updatedAt: new Date().toISOString() } : a,
          ),
        }));
      },
      addDocument: (applicationId, doc) => {
        const file: DocumentFile = {
          ...doc,
          id: uid('doc'),
          applicationId,
          uploadedAt: new Date().toISOString(),
        };
        patch((s) => ({
          ...s,
          applications: s.applications.map((a) =>
            a.id === applicationId ? { ...a, documents: [...a.documents, file], updatedAt: new Date().toISOString() } : a,
          ),
        }));
      },
      verifyDocuments: (applicationId, officerId, notes) => {
        patch((s) => ({
          ...s,
          applications: s.applications.map((a) =>
            a.id === applicationId
              ? {
                  ...a,
                  status: a.status === 'submitted' ? 'documents_verified' : a.status,
                  officerId,
                  officerNotes: notes,
                  documents: a.documents.map((d) => ({ ...d, verified: true })),
                  updatedAt: new Date().toISOString(),
                }
              : a,
          ),
        }));
        const app = state.applications.find((a) => a.id === applicationId);
        if (app) {
          notify({
            userId: app.applicantId,
            title: 'Documents verified',
            message: `Documents for ${applicationId} have been verified. Please book your medical examination.`,
            kind: 'success',
            link: '/app/medical',
          });
        }
      },
      decideApplication: (applicationId, officerId, decision, reason) => {
        const next: ApplicationStatus = decision === 'approve' ? 'approved' : 'rejected';
        patch((s) => ({
          ...s,
          applications: s.applications.map((a) =>
            a.id === applicationId
              ? {
                  ...a,
                  status: next,
                  officerId,
                  rejectionReason: decision === 'reject' ? reason : undefined,
                  officerNotes: reason,
                  updatedAt: new Date().toISOString(),
                }
              : a,
          ),
        }));
        const app = state.applications.find((a) => a.id === applicationId);
        if (app) {
          notify({
            userId: app.applicantId,
            title: decision === 'approve' ? 'Application approved' : 'Application rejected',
            message:
              decision === 'approve'
                ? `${applicationId} has been approved. Your licence will be issued shortly.`
                : `${applicationId} was rejected. Reason: ${reason ?? 'Not specified.'}`,
            kind: decision === 'approve' ? 'success' : 'error',
            link: `/app/applications/${applicationId}`,
          });
        }
      },
      issueLicense: (applicationId, officerId) => {
        const app = state.applications.find((a) => a.id === applicationId);
        if (!app) return null;
        const existing = state.licenses.find((l) => l.applicationId === applicationId);
        if (existing) return existing;
        const rec: LicenseRecord = {
          id: uid('lic'),
          applicationId,
          applicantId: app.applicantId,
          licenseNumber: licenseNumber(),
          category: app.category,
          issuedAt: new Date().toISOString().slice(0, 10),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 8).toISOString().slice(0, 10),
          status: 'active',
        };
        patch((s) => ({
          ...s,
          licenses: [rec, ...s.licenses],
          applications: s.applications.map((a) =>
            a.id === applicationId
              ? { ...a, status: 'license_issued', officerId, updatedAt: new Date().toISOString() }
              : a,
          ),
        }));
        notify({
          userId: app.applicantId,
          title: 'Licence issued',
          message: `Licence ${rec.licenseNumber} is now active. Download your digital copy from the dashboard.`,
          kind: 'success',
          link: '/app',
        });
        return rec;
      },
      createSchedule: (s) => {
        const created: Schedule = { ...s, id: uid('sch'), booked: 0 };
        patch((st) => ({ ...st, schedules: [...st.schedules, created] }));
        return created;
      },
      updateSchedule: (id, p) => {
        patch((s) => ({
          ...s,
          schedules: s.schedules.map((x) => (x.id === id ? { ...x, ...p } : x)),
        }));
      },
      deleteSchedule: (id) => {
        const used =
          state.medicals.some((m) => m.scheduleId === id && m.status === 'booked') ||
          state.exams.some((m) => m.scheduleId === id && m.status === 'booked') ||
          state.trials.some((m) => m.scheduleId === id && m.status === 'booked');
        if (used) return { ok: false, error: 'Cannot delete a schedule that still has bookings.' };
        patch((s) => ({ ...s, schedules: s.schedules.filter((x) => x.id !== id) }));
        return { ok: true };
      },
      upsertLocation: (loc) => {
        patch((s) => {
          const exists = s.locations.some((l) => l.id === loc.id);
          return {
            ...s,
            locations: exists ? s.locations.map((l) => (l.id === loc.id ? loc : l)) : [...s.locations, loc],
          };
        });
      },
      bookMedical: (input) => {
        const sch = state.schedules.find((x) => x.id === input.scheduleId);
        if (!sch) return { ok: false, error: 'Slot not found.' };
        if (sch.booked >= sch.capacity) return { ok: false, error: 'This slot is fully booked.' };
        const already = state.medicals.find(
          (m) => m.applicationId === input.applicationId && m.status === 'booked',
        );
        if (already) return { ok: false, error: 'You already have a medical appointment. Reschedule or cancel it first.' };
        const booking: MedicalAppointment = {
          id: uid('med'),
          applicationId: input.applicationId,
          applicantId: input.applicantId,
          scheduleId: sch.id,
          locationId: sch.locationId,
          date: sch.date,
          time: sch.startTime,
          status: 'booked',
        };
        patch((s) => ({
          ...s,
          medicals: [booking, ...s.medicals],
          schedules: s.schedules.map((x) => (x.id === sch.id ? { ...x, booked: x.booked + 1 } : x)),
          applications: s.applications.map((a) =>
            a.id === input.applicationId
              ? { ...a, status: 'medical_pending', updatedAt: new Date().toISOString() }
              : a,
          ),
        }));
        notify({
          userId: input.applicantId,
          title: 'Medical appointment confirmed',
          message: `Booked for ${sch.date} at ${sch.startTime}. Bring your NIC.`,
          kind: 'success',
          link: '/app/medical',
        });
        return { ok: true, booking };
      },
      cancelMedical: (id) => {
        const rec = state.medicals.find((m) => m.id === id);
        if (!rec) return;
        patch((s) => ({
          ...s,
          medicals: s.medicals.map((m) => (m.id === id ? { ...m, status: 'cancelled' as BookingStatus } : m)),
          schedules: s.schedules.map((x) =>
            x.id === rec.scheduleId ? { ...x, booked: Math.max(0, x.booked - 1) } : x,
          ),
        }));
      },
      rescheduleMedical: (id, scheduleId) => {
        const rec = state.medicals.find((m) => m.id === id);
        const sch = state.schedules.find((x) => x.id === scheduleId);
        if (!rec || !sch) return { ok: false, error: 'Booking or slot not found.' };
        if (sch.booked >= sch.capacity) return { ok: false, error: 'That slot is fully booked.' };
        patch((s) => ({
          ...s,
          medicals: s.medicals.map((m) =>
            m.id === id
              ? { ...m, scheduleId: sch.id, locationId: sch.locationId, date: sch.date, time: sch.startTime, status: 'booked' }
              : m,
          ),
          schedules: s.schedules.map((x) => {
            if (x.id === rec.scheduleId) return { ...x, booked: Math.max(0, x.booked - 1) };
            if (x.id === sch.id) return { ...x, booked: x.booked + 1 };
            return x;
          }),
        }));
        return { ok: true };
      },
      recordMedical: (id, officerId, result, extras) => {
        const rec = state.medicals.find((m) => m.id === id);
        if (!rec) return;
        patch((s) => ({
          ...s,
          medicals: s.medicals.map((m) =>
            m.id === id
              ? { ...m, status: 'completed', result, officerId, ...extras }
              : m,
          ),
          applications: s.applications.map((a) =>
            a.id === rec.applicationId
              ? {
                  ...a,
                  status: result === 'pass' ? 'medical_passed' : 'medical_failed',
                  updatedAt: new Date().toISOString(),
                }
              : a,
          ),
        }));
        notify({
          userId: rec.applicantId,
          title: result === 'pass' ? 'Medical passed' : 'Medical requirements not met',
          message:
            result === 'pass'
              ? 'You may now book the written / computer test.'
              : extras.remarks ?? 'Please review the medical remarks and book a follow-up if eligible.',
          kind: result === 'pass' ? 'success' : 'error',
          link: result === 'pass' ? '/app/exam' : '/app/applications/' + rec.applicationId,
        });
      },
      bookExam: (input) => {
        const sch = state.schedules.find((x) => x.id === input.scheduleId);
        if (!sch) return { ok: false, error: 'Slot not found.' };
        if (sch.booked >= sch.capacity) return { ok: false, error: 'This slot is fully booked.' };
        const already = state.exams.find(
          (m) => m.applicationId === input.applicationId && m.status === 'booked',
        );
        if (already) return { ok: false, error: 'You already have an exam booking.' };
        const attempt =
          state.exams.filter((e) => e.applicationId === input.applicationId).length + 1;
        const booking: ExamBooking = {
          id: uid('ex'),
          applicationId: input.applicationId,
          applicantId: input.applicantId,
          scheduleId: sch.id,
          locationId: sch.locationId,
          kind: input.kind,
          date: sch.date,
          time: sch.startTime,
          status: 'booked',
          attempt,
        };
        patch((s) => ({
          ...s,
          exams: [booking, ...s.exams],
          schedules: s.schedules.map((x) => (x.id === sch.id ? { ...x, booked: x.booked + 1 } : x)),
          applications: s.applications.map((a) =>
            a.id === input.applicationId
              ? { ...a, status: 'exam_pending', updatedAt: new Date().toISOString() }
              : a,
          ),
        }));
        notify({
          userId: input.applicantId,
          title: 'Exam booking confirmed',
          message: `${input.kind === 'computer' ? 'Computer' : 'Written'} test on ${sch.date} at ${sch.startTime}.`,
          kind: 'success',
          link: '/app/exam',
        });
        return { ok: true, booking };
      },
      cancelExam: (id) => {
        const rec = state.exams.find((m) => m.id === id);
        if (!rec) return;
        patch((s) => ({
          ...s,
          exams: s.exams.map((m) => (m.id === id ? { ...m, status: 'cancelled' as BookingStatus } : m)),
          schedules: s.schedules.map((x) =>
            x.id === rec.scheduleId ? { ...x, booked: Math.max(0, x.booked - 1) } : x,
          ),
        }));
      },
      rescheduleExam: (id, scheduleId) => {
        const rec = state.exams.find((m) => m.id === id);
        const sch = state.schedules.find((x) => x.id === scheduleId);
        if (!rec || !sch) return { ok: false, error: 'Booking or slot not found.' };
        if (sch.booked >= sch.capacity) return { ok: false, error: 'That slot is fully booked.' };
        patch((s) => ({
          ...s,
          exams: s.exams.map((m) =>
            m.id === id
              ? {
                  ...m,
                  scheduleId: sch.id,
                  locationId: sch.locationId,
                  date: sch.date,
                  time: sch.startTime,
                  kind: sch.examKind ?? m.kind,
                  status: 'booked',
                }
              : m,
          ),
          schedules: s.schedules.map((x) => {
            if (x.id === rec.scheduleId) return { ...x, booked: Math.max(0, x.booked - 1) };
            if (x.id === sch.id) return { ...x, booked: x.booked + 1 };
            return x;
          }),
        }));
        return { ok: true };
      },
      recordExam: (id, examinerId, result, score, remarks) => {
        const rec = state.exams.find((m) => m.id === id);
        if (!rec) return;
        patch((s) => ({
          ...s,
          exams: s.exams.map((m) =>
            m.id === id ? { ...m, status: 'completed', result, score, remarks, examinerId } : m,
          ),
          applications: s.applications.map((a) =>
            a.id === rec.applicationId
              ? {
                  ...a,
                  status: result === 'pass' ? 'exam_passed' : 'exam_failed',
                  updatedAt: new Date().toISOString(),
                }
              : a,
          ),
        }));
        notify({
          userId: rec.applicantId,
          title: result === 'pass' ? 'Exam passed' : 'Exam not passed',
          message:
            result === 'pass'
              ? 'You may now book the practical driving trial.'
              : `Score ${score ?? '—'}. You may book another attempt.`,
          kind: result === 'pass' ? 'success' : 'error',
          link: result === 'pass' ? '/app/trial' : '/app/exam',
        });
      },
      bookTrial: (input) => {
        const sch = state.schedules.find((x) => x.id === input.scheduleId);
        if (!sch) return { ok: false, error: 'Slot not found.' };
        if (sch.booked >= sch.capacity) return { ok: false, error: 'This slot is fully booked.' };
        const already = state.trials.find(
          (m) => m.applicationId === input.applicationId && m.status === 'booked',
        );
        if (already) return { ok: false, error: 'You already have a trial booking.' };
        const attempt =
          state.trials.filter((e) => e.applicationId === input.applicationId).length + 1;
        const booking: TrialBooking = {
          id: uid('tr'),
          applicationId: input.applicationId,
          applicantId: input.applicantId,
          scheduleId: sch.id,
          locationId: sch.locationId,
          date: sch.date,
          time: sch.startTime,
          trainerType: input.trainerType,
          trainerId: input.trainerId,
          status: 'booked',
          attempt,
        };
        patch((s) => ({
          ...s,
          trials: [booking, ...s.trials],
          schedules: s.schedules.map((x) => (x.id === sch.id ? { ...x, booked: x.booked + 1 } : x)),
          applications: s.applications.map((a) =>
            a.id === input.applicationId
              ? {
                  ...a,
                  status: 'trial_pending',
                  trainerType: input.trainerType,
                  trainerId: input.trainerId,
                  privateTrainerName: input.privateTrainerName,
                  updatedAt: new Date().toISOString(),
                }
              : a,
          ),
        }));
        notify({
          userId: input.applicantId,
          title: 'Trial booking confirmed',
          message: `Practical test on ${sch.date} at ${sch.startTime}.`,
          kind: 'success',
          link: '/app/trial',
        });
        return { ok: true, booking };
      },
      cancelTrial: (id) => {
        const rec = state.trials.find((m) => m.id === id);
        if (!rec) return;
        patch((s) => ({
          ...s,
          trials: s.trials.map((m) => (m.id === id ? { ...m, status: 'cancelled' as BookingStatus } : m)),
          schedules: s.schedules.map((x) =>
            x.id === rec.scheduleId ? { ...x, booked: Math.max(0, x.booked - 1) } : x,
          ),
        }));
      },
      rescheduleTrial: (id, scheduleId) => {
        const rec = state.trials.find((m) => m.id === id);
        const sch = state.schedules.find((x) => x.id === scheduleId);
        if (!rec || !sch) return { ok: false, error: 'Booking or slot not found.' };
        if (sch.booked >= sch.capacity) return { ok: false, error: 'That slot is fully booked.' };
        patch((s) => ({
          ...s,
          trials: s.trials.map((m) =>
            m.id === id
              ? { ...m, scheduleId: sch.id, locationId: sch.locationId, date: sch.date, time: sch.startTime, status: 'booked' }
              : m,
          ),
          schedules: s.schedules.map((x) => {
            if (x.id === rec.scheduleId) return { ...x, booked: Math.max(0, x.booked - 1) };
            if (x.id === sch.id) return { ...x, booked: x.booked + 1 };
            return x;
          }),
        }));
        return { ok: true };
      },
      recordTrial: (id, examinerId, result, remarks) => {
        const rec = state.trials.find((m) => m.id === id);
        if (!rec) return;
        patch((s) => ({
          ...s,
          trials: s.trials.map((m) =>
            m.id === id ? { ...m, status: 'completed', result, remarks, examinerId } : m,
          ),
          applications: s.applications.map((a) =>
            a.id === rec.applicationId
              ? {
                  ...a,
                  status: result === 'pass' ? 'trial_passed' : 'trial_failed',
                  updatedAt: new Date().toISOString(),
                }
              : a,
          ),
        }));
        notify({
          userId: rec.applicantId,
          title: result === 'pass' ? 'Trial passed' : 'Trial not passed',
          message:
            result === 'pass'
              ? 'Your file will now be reviewed for licence approval.'
              : remarks ?? 'You may book another trial attempt.',
          kind: result === 'pass' ? 'success' : 'error',
          link: '/app',
        });
      },
      pay: (input) => {
        const rec: Payment = {
          id: uid('pay'),
          userId: input.userId,
          applicationId: input.applicationId,
          type: input.type,
          amount: FEES[input.type],
          method: input.method,
          status: 'paid',
          reference: paymentRef(),
          cardLast4: input.cardLast4,
          createdAt: new Date().toISOString(),
        };
        patch((s) => ({ ...s, payments: [rec, ...s.payments] }));
        notify({
          userId: input.userId,
          title: 'Payment received',
          message: `${rec.reference} — LKR ${rec.amount.toLocaleString()} for ${input.type.replace('_', ' ')}.`,
          kind: 'success',
          link: '/app/payments',
        });
        return rec;
      },
      notify,
      markRead: (id) => {
        patch((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },
      markAllRead: (userId) => {
        patch((s) => ({
          ...s,
          notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
        }));
      },
      addComplaint: (c) => {
        const rec: Complaint = {
          ...c,
          id: uid('cmp'),
          createdAt: new Date().toISOString(),
          status: 'open',
        };
        patch((s) => ({ ...s, complaints: [rec, ...s.complaints] }));
        return rec;
      },
      respondComplaint: (id, response, status) => {
        patch((s) => ({
          ...s,
          complaints: s.complaints.map((c) => (c.id === id ? { ...c, response, status } : c)),
        }));
      },
      addTrainingNote: (n) => {
        patch((s) => ({
          ...s,
          trainingNotes: [
            { ...n, id: uid('tn'), createdAt: new Date().toISOString() },
            ...s.trainingNotes,
          ],
        }));
      },
      addTrainerSlot: (s) => {
        patch((st) => ({
          ...st,
          trainerSchedules: [...st.trainerSchedules, { ...s, id: uid('ts') }],
        }));
      },
      removeTrainerSlot: (id) => {
        patch((s) => ({ ...s, trainerSchedules: s.trainerSchedules.filter((x) => x.id !== id) }));
      },
      sendTraineeReminder: (trainerId, applicantId, message) => {
        const trainer = state.users.find((u) => u.id === trainerId);
        notify({
          userId: applicantId,
          title: `Reminder from ${trainer?.name ?? 'your trainer'}`,
          message,
          kind: 'warning',
        });
      },
      log,
    };
  }, [state, patch, notify, log]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function userById(users: User[], id?: string) {
  return users.find((u) => u.id === id);
}

export function locById(locations: Location[], id?: string) {
  return locations.find((l) => l.id === id);
}

export function appsFor(apps: Application[], userId: string) {
  return apps.filter((a) => a.applicantId === userId);
}

export const STAFF_ROLES: Role[] = [
  'officer',
  'coordinator',
  'examiner',
  'trainer',
  'medical',
  'admin',
];
