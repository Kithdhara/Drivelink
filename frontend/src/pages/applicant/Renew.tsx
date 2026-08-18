import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { FEES, LICENSE_CATEGORIES } from '../../types';
import type { DocumentFile, LicenseCategory, PersonalDetails } from '../../types';
import { fileToDataUrl, formatMoney, validateUpload } from '../../lib/utils';
import { Alert, Button, Card, Field, Input, PageHeader, Select, Spinner, scrollToFirstError } from '../../components/ui';

export default function Renew() {
  const { user } = useAuth();
  const { state, createApplication, pay, notify } = useStore();
  const nav = useNavigate();
  const existing = state.licenses.find((l) => l.applicantId === user?.id && l.status === 'active');
  const [category, setCategory] = useState<LicenseCategory>(existing?.category ?? 'B');
  const [licenseNo, setLicenseNo] = useState(existing?.licenseNumber ?? '');
  const [oneDay, setOneDay] = useState(false);
  const [docs, setDocs] = useState<Omit<DocumentFile, 'id' | 'applicationId' | 'uploadedAt'>[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onFile(type: DocumentFile['type'], file?: File) {
    if (!file) return;
    const v = validateUpload(file);
    if (v) return setErr(v);
    const dataUrl = await fileToDataUrl(file);
    setDocs((d) => [...d.filter((x) => x.type !== type), { type, name: file.name, dataUrl, mimeType: file.type, size: file.size }]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!licenseNo.trim()) {
      setErr('Enter your existing licence number.');
      scrollToFirstError();
      return;
    }
    if (!docs.some((d) => d.type === 'nic') || !docs.some((d) => d.type === 'existing_license')) {
      setErr('Upload your NIC and the existing licence (or a police extract).');
      scrollToFirstError();
      return;
    }
    setBusy(true);
    const personal: PersonalDetails = {
      fullName: user.name,
      nic: user.nic,
      dob: user.dob ?? '',
      gender: user.gender ?? '',
      address: user.address ?? '',
      phone: user.phone,
      email: user.email,
    };
    const app = createApplication({
      applicantId: user.id,
      type: 'renewal',
      category,
      oneDayService: oneDay,
      personal,
      documents: docs.map((d, i) => ({ ...d, id: `r-${i}`, applicationId: 'pending', uploadedAt: new Date().toISOString() })),
      privateTrainerName: licenseNo,
    });
    pay({ userId: user.id, applicationId: app.id, type: 'renewal', method: 'card', cardLast4: '4242' });
    if (oneDay) pay({ userId: user.id, applicationId: app.id, type: 'one_day', method: 'card', cardLast4: '4242' });
    notify({
      userId: user.id,
      title: 'Renewal submitted',
      message: `${app.id} will be reviewed against licence ${licenseNo}.`,
      kind: 'success',
      link: `/app/applications/${app.id}`,
    });
    nav(`/app/applications/${app.id}`);
  }

  return (
    <div>
      <PageHeader
        kicker="Existing holders"
        title="Renew a driving licence"
        subtitle="Upload an updated photograph, NIC and the current card. Medicals may be required if your last fitness report is older than two years."
      />
      <form onSubmit={submit} className="space-y-4">
        {err && <Alert kind="error">{err}</Alert>}
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Existing licence number" required>
              <Input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} placeholder="B23-441902" />
            </Field>
            <Field label="Class to renew" required>
              <Select value={category} onChange={(e) => setCategory(e.target.value as LicenseCategory)}>
                {LICENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {existing && (
            <p className="mt-3 text-sm text-[#0e7c7b]">
              We found active licence {existing.licenseNumber} (class {existing.category}) on your file.
            </p>
          )}
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={oneDay} onChange={(e) => setOneDay(e.target.checked)} />
            One-Day Service ({formatMoney(FEES.one_day)})
          </label>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Updated documents</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {([
              ['nic', 'NIC copy'],
              ['photo', 'New photograph'],
              ['existing_license', 'Existing licence'],
            ] as const).map(([type, label]) => {
              const f = docs.find((d) => d.type === type);
              return (
                <label key={type} className="rounded-2xl border border-dashed border-[#0b1c33]/20 bg-[#f6f1e7] p-4">
                  <p className="text-xs font-semibold uppercase">{label}</p>
                  <input type="file" accept="image/*,application/pdf" className="mt-2 text-xs" onChange={(e) => onFile(type, e.target.files?.[0])} />
                  {f?.mimeType.startsWith('image/') && <img src={f.dataUrl} alt="" className="mt-2 h-24 w-full rounded object-cover" />}
                </label>
              );
            })}
          </div>
        </Card>
        <Card>
          <p className="text-sm">
            Renewal fee due: <strong>{formatMoney(FEES.renewal + (oneDay ? FEES.one_day : 0))}</strong>
          </p>
          <Button type="submit" disabled={busy} className="mt-4" variant="gold">
            {busy && <Spinner />}
            Submit renewal & pay
          </Button>
        </Card>
      </form>
    </div>
  );
}
