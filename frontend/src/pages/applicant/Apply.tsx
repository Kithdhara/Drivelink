import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { FEES, LICENSE_CATEGORIES } from '../../types';
import type { DocumentFile, LicenseCategory, PersonalDetails } from '../../types';
import {
  fileToDataUrl,
  formatMoney,
  validateEmail,
  validateNIC,
  validatePhone,
  validateUpload,
} from '../../lib/utils';
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  scrollToFirstError,
} from '../../components/ui';
import {
  createApplicationAPI,
  getApplicationsByApplicantAPI,
  getMedicalsByApplicantAPI,
  type BackendApplication,
} from '../../lib/api';

const STEPS = ['Category', 'Personal', 'Documents', 'Review'];
const MAX_CATEGORIES = 3;

function validatePhone10(v: string) {
  if (!v) return 'Required';
  if (!/^\d{10}$/.test(v.trim())) return 'Must be exactly 10 digits';
  return '';
}

export default function Apply() {
  const { user } = useAuth();
  const { pay, notify } = useStore();
  const nav = useNavigate();

  /* ── Prerequisites Check: Medical & Active Application ── */
  const [checking, setChecking] = useState(true);
  const [hasMedicalBooking, setHasMedicalBooking] = useState(true);
  const [medicalFailed, setMedicalFailed] = useState(false);
  const [activeApp, setActiveApp] = useState<BackendApplication | null>(null);
  const [rejectedApp, setRejectedApp] = useState<BackendApplication | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMedicalsByApplicantAPI(user.id).catch(() => []),
      getApplicationsByApplicantAPI(user.id).catch(() => []),
    ])
      .then(([medicals, apps]) => {
        // Step 1 check: Must have booked medical
        const hasBooking = medicals.length > 0;
        const failed = medicals.some((m) => m.result === 'FAIL');
        setHasMedicalBooking(hasBooking);
        setMedicalFailed(failed);

        // Application checks
        const active = apps.find((a) => a.status !== 'rejected' && a.status !== 'license_issued');
        const rejected = apps.find((a) => a.status === 'rejected');
        setActiveApp(active ?? null);
        setRejectedApp(!active && rejected ? rejected : null);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [user]);

  /* ── form state ── */
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<LicenseCategory[]>(['B']);
  const [oneDay, setOneDay] = useState(false);
  const [personal, setPersonal] = useState<PersonalDetails>({
    fullName: user?.name ?? '',
    nic: user?.nic ?? '',
    dob: user?.dob ?? '',
    gender: user?.gender ?? '',
    address: user?.address ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    bloodGroup: '',
    emergencyContact: '',
  });
  const [docs, setDocs] = useState<Omit<DocumentFile, 'id' | 'applicationId' | 'uploadedAt'>[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [submitErr, setSubmitErr] = useState('');
  // Preserve actual File objects for upload
  const fileRefs = useRef<Record<string, File>>({});

  /* ── Category helpers ── */
  const eligibleOneDay = useMemo(
    () => categories.some((c) => ['A', 'A1', 'B', 'B1'].includes(c)),
    [categories],
  );

  function toggleCategory(id: LicenseCategory) {
    setCategories((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= MAX_CATEGORIES) return prev; // max 3
      return [...prev, id];
    });
  }

  /* ── Fee calculation ── */
  const appFee = FEES.application * categories.length;
  const oneDayFee = eligibleOneDay && oneDay ? FEES.one_day : 0;
  const totalFee = appFee + oneDayFee;

  /* ── File handler ── */
  async function onFile(type: DocumentFile['type'], file?: File) {
    setUploadErr('');
    if (!file) return;
    const v = validateUpload(file);
    if (v) { setUploadErr(v); return; }
    const dataUrl = await fileToDataUrl(file);
    fileRefs.current[type] = file;
    setDocs((d) => [
      ...d.filter((x) => x.type !== type),
      { type, name: file.name, dataUrl, mimeType: file.type, size: file.size },
    ]);
  }

  function removeFile(type: DocumentFile['type']) {
    setDocs((d) => d.filter((x) => x.type !== type));
    delete fileRefs.current[type];
  }

  /* ── Step validation ── */
  function next() {
    const e: Record<string, string> = {};

    if (step === 0) {
      if (categories.length === 0) e.category = 'Select at least one licence class.';
    }

    if (step === 1) {
      if (personal.fullName.trim().length < 3) e.fullName = 'Required';
      const n = validateNIC(personal.nic);
      if (n) e.nic = n;
      if (!personal.dob) e.dob = 'Required';
      if (!personal.gender) e.gender = 'Required';
      if (!personal.address) e.address = 'Required';
      const ph = validatePhone(personal.phone);
      if (ph) e.phone = ph;
      const em = validateEmail(personal.email);
      if (em) e.email = em;
      if (!personal.bloodGroup) e.bloodGroup = 'Blood group is required';
      if (personal.emergencyContact) {
        const ecErr = validatePhone10(personal.emergencyContact);
        if (ecErr && ecErr !== 'Required') e.emergencyContact = ecErr;
      }
    }

    if (step === 2) {
      if (!docs.some((d) => d.type === 'nic')) e.docs = 'Upload a NIC copy.';
      if (!docs.some((d) => d.type === 'photo')) e.docs = 'Upload a passport photograph.';
    }

    setErrors(e);
    if (Object.keys(e).length) { scrollToFirstError(); return; }
    setStep((s) => Math.min(3, s + 1));
  }

  /* ── Submit ── */
  async function submit() {
    if (!user) return;
    setSubmitErr('');

    const nicFile = fileRefs.current['nic'];
    const photoFile = fileRefs.current['photo'];
    const medicalFile = fileRefs.current['medical'];

    if (!nicFile || !photoFile) {
      setSubmitErr('NIC copy and passport photograph are required.');
      return;
    }

    setBusy(true);
    try {
      const saved = await createApplicationAPI({
        licenseClasses: categories.join(','),
        oneDayService: eligibleOneDay && oneDay,
        fullName: personal.fullName,
        nic: personal.nic,
        dateOfBirth: personal.dob,
        gender: personal.gender,
        address: personal.address,
        phone: personal.phone,
        email: personal.email,
        bloodGroup: personal.bloodGroup ?? '',
        emergencyContact: personal.emergencyContact,
        applicantId: user.id,
        applicantName: user.name,
        nicCopy: nicFile,
        passportPhoto: photoFile,
        medicalReport: medicalFile,
      });

      notify({
        userId: user.id,
        title: 'Application submitted',
        message: `Application #${saved.id} is with the Registration Officer for document review.`,
        kind: 'success',
        link: `/app/applications/${saved.id}`,
      });
      nav(`/app/applications/${saved.id}`);
    } catch (err: unknown) {
      setSubmitErr(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      setBusy(false);
    }
  }

  /* ── Guard: loading or blocked ── */
  if (checking) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  // 1. Step 1 Enforce: Must have booked medical
  if (!hasMedicalBooking) {
    return (
      <div>
        <PageHeader kicker="Step 1 Required" title="Medical examination required" subtitle="" />
        <Card>
          <Alert kind="warning" title="Step 1: Book Your Medical Examination First">
            Under Department regulations, you cannot access or submit a driving licence application without first booking a medical examination appointment.
            <div className="mt-4 flex gap-3">
              <Button variant="gold" onClick={() => nav('/app/medical')}>
                Book Medical Examination →
              </Button>
              <Button variant="ghost" onClick={() => nav('/app')}>
                Return to Dashboard
              </Button>
            </div>
          </Alert>
        </Card>
      </div>
    );
  }

  // 2. Medical failed check
  if (medicalFailed) {
    return (
      <div>
        <PageHeader kicker="Medical requirement" title="Medical examination failed" subtitle="" />
        <Card>
          <Alert kind="error" title="Medical Fitness Test Failed">
            Your medical examination recorded a FAIL result. You cannot submit an application for a driving licence until you have passed the medical examination.
            <div className="mt-4">
              <Button variant="secondary" onClick={() => nav('/app/medical')}>
                View Medical Records →
              </Button>
            </div>
          </Alert>
        </Card>
      </div>
    );
  }

  // 3. Active application on file check
  if (activeApp) {
    const isApprovedOrFurther = ['approved', 'exam_booked', 'exam_passed', 'trial_booked', 'trial_passed'].includes(activeApp.status);
    return (
      <div>
        <PageHeader kicker="Application Status" title="Licence application locked" subtitle="" />
        <Card>
          {isApprovedOrFurther ? (
            <Alert kind="success" title={`Application #${activeApp.id} Approved & Locked`}>
              Your driving licence application has been approved by the Registration Officer.
              Approved applications are locked and cannot be edited or duplicated. You can now proceed to book your computerized theory examination.
              <div className="mt-4 flex gap-3">
                <Button variant="gold" onClick={() => nav('/app/exam')}>
                  Book Theory Exam →
                </Button>
                <Button variant="secondary" onClick={() => nav(`/app/applications/${activeApp.id}`)}>
                  View Application Details
                </Button>
              </div>
            </Alert>
          ) : (
            <Alert kind="warning" title={`Application #${activeApp.id} Under Review`}>
              You have an active licence application currently being processed by the Registration Officer (Status: <strong>{activeApp.status}</strong>).
              Duplicate applications are not permitted while your file is under review.
              <div className="mt-4 flex gap-3">
                <Button variant="secondary" onClick={() => nav(`/app/applications/${activeApp.id}`)}>
                  Track Application →
                </Button>
                <Button variant="ghost" onClick={() => nav('/app')}>
                  Return to Dashboard
                </Button>
              </div>
            </Alert>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Licence application"
        title="Apply for a driving licence"
        subtitle="Complete all four steps. Application fee is collected after officer approval."
      />

      {/* Reapplication alert banner if previous application was rejected */}
      {rejectedApp && (
        <div className="mb-6">
          <Alert kind="info" title={`Reapplication Notice (Previous Application #${rejectedApp.id} Rejected)`}>
            Your earlier application was rejected with the note: <strong>"{rejectedApp.rejectionReason || 'Requirements not met'}"</strong>.
            You are permitted to reapply. Please complete the form below with your updated and verified particulars.
          </Alert>
        </div>
      )}

      {/* Step indicators */}
      <div className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${
              i === step
                ? 'bg-[#0b1c33] text-[#f6f1e7]'
                : i < step
                ? 'bg-[#c6a15b] text-[#0b1c33]'
                : 'bg-white text-[#0b1c33]/50'
            }`}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {/* ── Step 0: Category ── */}
      {step === 0 && (
        <Card>
          <h2 className="font-display text-2xl">Select licence class(es)</h2>
          <p className="mt-1 text-sm text-[#0b1c33]/60">
            Choose up to <strong>3</strong> classes. Fee: LKR 2,500 per class.
            Currently selected: <strong>{categories.join(', ') || 'none'}</strong>.
          </p>
          {errors.category && (
            <div className="mt-3">
              <Alert kind="error">{errors.category}</Alert>
            </div>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LICENSE_CATEGORIES.map((c) => {
              const selected = categories.includes(c.id);
              const maxed = categories.length >= MAX_CATEGORIES && !selected;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={maxed}
                  onClick={() => toggleCategory(c.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? 'border-[#c6a15b] bg-[#c6a15b]/12 ring-2 ring-[#c6a15b]'
                      : maxed
                      ? 'cursor-not-allowed border-[#0b1c33]/10 bg-white opacity-40'
                      : 'border-[#0b1c33]/10 bg-white hover:border-[#c6a15b]/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-display text-3xl text-[#c6a15b]">{c.id}</p>
                    {selected && (
                      <span className="mt-1 rounded-full bg-[#c6a15b] px-2 py-0.5 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold">{c.name}</p>
                  <p className="text-xs text-[#0b1c33]/55">{c.desc}</p>
                </button>
              );
            })}
          </div>

          {/* One-Day service */}
          <label className="mt-6 flex items-start gap-3 rounded-xl bg-[#f6f1e7] p-4 text-sm">
            <input
              type="checkbox"
              checked={oneDay && eligibleOneDay}
              disabled={!eligibleOneDay}
              onChange={(e) => setOneDay(e.target.checked)}
              className="mt-1"
            />
            <span>
              <strong>Request One-Day Service</strong> — priority processing for{' '}
              {formatMoney(FEES.one_day)}. Available for classes A, A1, B and B1.
              {!eligibleOneDay && (
                <span className="block text-[#9f1239]">Not eligible for your selected class(es).</span>
              )}
            </span>
          </label>

          {/* Fee summary */}
          <div className="mt-4 rounded-xl bg-[#0b1c33] p-4 text-[#f6f1e7]">
            <p className="text-xs tracking-widest text-[#c6a15b] uppercase">Estimated fee</p>
            <p className="font-display text-2xl">{formatMoney(appFee + oneDayFee)}</p>
            <p className="text-xs text-white/60">
              {categories.length} × {formatMoney(FEES.application)} application
              {eligibleOneDay && oneDay ? ` + ${formatMoney(FEES.one_day)} one-day` : ''}
            </p>
          </div>
        </Card>
      )}

      {/* ── Step 1: Personal ── */}
      {step === 1 && (
        <Card>
          <h2 className="font-display text-2xl">Personal particulars</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={errors.fullName}>
              <Input value={personal.fullName} onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })} />
            </Field>
            <Field label="NIC" required error={errors.nic}>
              <Input value={personal.nic} onChange={(e) => setPersonal({ ...personal, nic: e.target.value })} />
            </Field>
            <Field label="Date of birth" required error={errors.dob}>
              <Input type="date" value={personal.dob} onChange={(e) => setPersonal({ ...personal, dob: e.target.value })} />
            </Field>
            <Field label="Gender" required error={errors.gender}>
              <Select value={personal.gender} onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Address" required error={errors.address}>
              <Input value={personal.address} onChange={(e) => setPersonal({ ...personal, address: e.target.value })} />
            </Field>
            <Field label="Phone" required error={errors.phone}>
              <Input value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} />
            </Field>
            <Field label="Email" required error={errors.email}>
              <Input value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} />
            </Field>
            <Field label="Blood group" required error={errors.bloodGroup}>
              <Select value={personal.bloodGroup} onChange={(e) => setPersonal({ ...personal, bloodGroup: e.target.value })}>
                <option value="">Select blood group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </Field>
            <Field label="Emergency contact (10-digit number)" error={errors.emergencyContact}>
              <Input
                value={personal.emergencyContact}
                maxLength={10}
                placeholder="0771234567"
                onChange={(e) => setPersonal({ ...personal, emergencyContact: e.target.value.replace(/\D/g, '') })}
              />
            </Field>
          </div>
        </Card>
      )}

      {/* ── Step 2: Documents ── */}
      {step === 2 && (
        <Card>
          <h2 className="font-display text-2xl">Supporting documents</h2>
          <p className="mt-1 text-sm text-[#0b1c33]/60">JPG, PNG, WEBP or PDF · max 20 MB each.</p>
          {uploadErr && <div className="mt-3"><Alert kind="error">{uploadErr}</Alert></div>}
          {errors.docs && <div className="mt-3"><Alert kind="error">{errors.docs}</Alert></div>}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(
              [
                ['nic', 'NIC copy', true],
                ['photo', 'Passport photograph', true],
                ['medical', 'Existing medical report (optional)', false],
              ] as const
            ).map(([type, label, required]) => {
              const f = docs.find((d) => d.type === type);
              return (
                <div key={type} className="rounded-2xl border border-dashed border-[#0b1c33]/20 bg-[#f6f1e7] p-4">
                  <p className="text-xs font-semibold tracking-wide uppercase mb-2">
                    {label}
                    {required && <span className="ml-1 text-[#9f1239]">*</span>}
                  </p>
                  
                  {f ? (
                    <div className="mt-2">
                      {f.mimeType.startsWith('image/') && (
                        <img src={f.dataUrl} alt={label} className="mb-2 h-28 w-full rounded-lg object-cover border border-[#0b1c33]/10" />
                      )}
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs text-[#0b1c33]/70" title={f.name}>{f.name}</p>
                        <button
                          type="button"
                          onClick={() => removeFile(type)}
                          className="ml-2 text-xs font-semibold text-[#9f1239] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block mt-2">
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#0b1c33]/20 bg-white py-6 px-4 hover:bg-[#0b1c33]/5 transition">
                        <span className="text-xs font-medium text-[#0b1c33]/60 text-center">Click to choose a file</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            onFile(type, e.target.files?.[0]);
                            e.target.value = ''; // Reset input to allow re-uploading the same file
                          }}
                        />
                      </div>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Step 3: Review ── */}
      {step === 3 && (
        <Card>
          <h2 className="font-display text-2xl">Review application</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[#0b1c33]/50">Class(es)</dt>
              <dd className="font-semibold">{categories.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-[#0b1c33]/50">Applicant</dt>
              <dd className="font-semibold">{personal.fullName}</dd>
            </div>
            <div>
              <dt className="text-[#0b1c33]/50">NIC</dt>
              <dd className="font-semibold">{personal.nic}</dd>
            </div>
            <div>
              <dt className="text-[#0b1c33]/50">Blood group</dt>
              <dd className="font-semibold">{personal.bloodGroup}</dd>
            </div>
            <div>
              <dt className="text-[#0b1c33]/50">One-Day Service</dt>
              <dd className="font-semibold">{oneDay && eligibleOneDay ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-[#0b1c33]/50">Documents</dt>
              <dd className="font-semibold">
                {docs.map((d) => d.type).join(', ')}
              </dd>
            </div>
          </dl>
          <div className="mt-5 rounded-xl bg-[#0b1c33] p-4 text-[#f6f1e7]">
            <p className="text-xs tracking-widest text-[#c6a15b] uppercase">Estimated fee</p>
            <p className="font-display text-3xl">{formatMoney(totalFee)}</p>
            <p className="text-xs text-white/60">
              {categories.length} × {formatMoney(FEES.application)} application
              {eligibleOneDay && oneDay ? ` + One-Day ${formatMoney(FEES.one_day)}` : ''}
            </p>
          </div>
          <p className="mt-3 text-xs text-[#0b1c33]/55">
            Payment will be requested only after the application is approved. You can edit this application within 12 hours of submission.
          </p>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="mt-5 flex flex-col gap-3">
        {submitErr && <Alert kind="error">{submitErr}</Alert>}
        <div className="flex justify-between">
          <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={submit} disabled={busy} variant="gold">
              {busy && <Spinner />}
              Submit application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
