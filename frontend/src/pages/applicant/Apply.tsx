import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { FEES, LICENSE_CATEGORIES } from '../../types';
import type { DocumentFile, LicenseCategory, PersonalDetails } from '../../types';
import { fileToDataUrl, formatMoney, validateEmail, validateNIC, validatePhone, validateUpload } from '../../lib/utils';
import { Alert, Button, Card, Field, Input, PageHeader, Select, Spinner, scrollToFirstError } from '../../components/ui';

const STEPS = ['Category', 'Personal', 'Documents', 'Review'];

export default function Apply() {
  const { user } = useAuth();
  const { createApplication, pay, notify } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<LicenseCategory>('B');
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

  const eligibleOneDay = useMemo(() => ['A', 'A1', 'B', 'B1'].includes(category), [category]);

  async function onFile(type: DocumentFile['type'], file?: File) {
    setUploadErr('');
    if (!file) return;
    const v = validateUpload(file);
    if (v) {
      setUploadErr(v);
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setDocs((d) => [
      ...d.filter((x) => x.type !== type),
      { type, name: file.name, dataUrl, mimeType: file.type, size: file.size },
    ]);
  }

  function next() {
    const e: Record<string, string> = {};
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
    }
    if (step === 2) {
      if (!docs.some((d) => d.type === 'nic')) e.docs = 'Upload a NIC copy.';
      if (!docs.some((d) => d.type === 'photo')) e.docs = 'Upload a passport photograph.';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      scrollToFirstError();
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  function submit() {
    if (!user) return;
    setBusy(true);
    const app = createApplication({
      applicantId: user.id,
      type: 'new',
      category,
      oneDayService: eligibleOneDay && oneDay,
      personal,
      documents: docs.map((d, i) => ({
        ...d,
        id: `tmp-${i}`,
        applicationId: 'pending',
        uploadedAt: new Date().toISOString(),
      })),
    });
    pay({ userId: user.id, applicationId: app.id, type: 'application', method: 'card', cardLast4: '4242' });
    if (eligibleOneDay && oneDay) {
      pay({ userId: user.id, applicationId: app.id, type: 'one_day', method: 'card', cardLast4: '4242' });
    }
    notify({
      userId: user.id,
      title: 'Application submitted',
      message: `${app.id} is with the Registration Officer for document review.`,
      kind: 'success',
      link: `/app/applications/${app.id}`,
    });
    nav(`/app/applications/${app.id}`);
  }

  return (
    <div>
      <PageHeader kicker="New issue" title="Licence application" subtitle="Complete all four steps. Application fee is collected on submit." />
      <div className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${
              i === step ? 'bg-[#0b1c33] text-[#f6f1e7]' : i < step ? 'bg-[#c6a15b] text-[#0b1c33]' : 'bg-white text-[#0b1c33]/50'
            }`}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <h2 className="font-display text-2xl">Select a licence class</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LICENSE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-2xl border p-4 text-left ${
                  category === c.id ? 'border-[#c6a15b] bg-[#c6a15b]/12 ring-2 ring-[#c6a15b]' : 'border-[#0b1c33]/10 bg-white'
                }`}
              >
                <p className="font-display text-3xl text-[#c6a15b]">{c.id}</p>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-[#0b1c33]/55">{c.desc}</p>
              </button>
            ))}
          </div>
          <label className="mt-6 flex items-start gap-3 rounded-xl bg-[#f6f1e7] p-4 text-sm">
            <input
              type="checkbox"
              checked={oneDay && eligibleOneDay}
              disabled={!eligibleOneDay}
              onChange={(e) => setOneDay(e.target.checked)}
              className="mt-1"
            />
            <span>
              <strong>Request One-Day Service</strong> — priority processing for {formatMoney(FEES.one_day)}. Available
              for classes A, A1, B and B1 when slots exist.
              {!eligibleOneDay && <span className="block text-[#9f1239]">Not eligible for this class.</span>}
            </span>
          </label>
        </Card>
      )}

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
            <Field label="Blood group">
              <Select value={personal.bloodGroup} onChange={(e) => setPersonal({ ...personal, bloodGroup: e.target.value })}>
                <option value="">Unknown</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </Field>
            <Field label="Emergency contact">
              <Input
                value={personal.emergencyContact}
                onChange={(e) => setPersonal({ ...personal, emergencyContact: e.target.value })}
              />
            </Field>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="font-display text-2xl">Supporting documents</h2>
          <p className="mt-1 text-sm text-[#0b1c33]/60">JPG, PNG, WEBP or PDF · max 2 MB each.</p>
          {uploadErr && (
            <div className="mt-3">
              <Alert kind="error">{uploadErr}</Alert>
            </div>
          )}
          {errors.docs && (
            <div className="mt-3">
              <Alert kind="error">{errors.docs}</Alert>
            </div>
          )}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {([
              ['nic', 'NIC copy'],
              ['photo', 'Passport photograph'],
              ['medical', 'Existing medical report (optional)'],
            ] as const).map(([type, label]) => {
              const f = docs.find((d) => d.type === type);
              return (
                <label key={type} className="cursor-pointer rounded-2xl border border-dashed border-[#0b1c33]/20 bg-[#f6f1e7] p-4">
                  <p className="text-xs font-semibold tracking-wide uppercase">{label}</p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="mt-2 block w-full text-xs"
                    onChange={(e) => onFile(type, e.target.files?.[0])}
                  />
                  {f && (
                    <div className="mt-3">
                      <p className="truncate text-xs">{f.name}</p>
                      {f.mimeType.startsWith('image/') && (
                        <img src={f.dataUrl} alt="" className="mt-2 h-28 w-full rounded-lg object-cover" />
                      )}
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h2 className="font-display text-2xl">Review & pay</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[#0b1c33]/50">Class</dt>
              <dd className="font-semibold">
                {category} — {LICENSE_CATEGORIES.find((c) => c.id === category)?.name}
              </dd>
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
              <dt className="text-[#0b1c33]/50">One-Day Service</dt>
              <dd className="font-semibold">{oneDay && eligibleOneDay ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-xl bg-[#0b1c33] p-4 text-[#f6f1e7]">
            <p className="text-xs tracking-widest text-[#c6a15b] uppercase">Amount due now</p>
            <p className="font-display text-3xl">
              {formatMoney(FEES.application + (oneDay && eligibleOneDay ? FEES.one_day : 0))}
            </p>
            <p className="text-xs text-white/60">Application {formatMoney(FEES.application)}
              {oneDay && eligibleOneDay ? ` + One-Day ${formatMoney(FEES.one_day)}` : ''}
            </p>
          </div>
          <p className="mt-3 text-xs text-[#0b1c33]/55">
            Submitting charges the demo card ending 4242. You can download a receipt from Payments.
          </p>
        </Card>
      )}

      <div className="mt-5 flex justify-between">
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < 3 ? (
          <Button onClick={next}>Continue</Button>
        ) : (
          <Button onClick={submit} disabled={busy} variant="gold">
            {busy && <Spinner />}
            Submit & pay
          </Button>
        )}
      </div>
    </div>
  );
}
