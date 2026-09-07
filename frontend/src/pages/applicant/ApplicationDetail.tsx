import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import {
  getApplicationByIdAPI,
  editApplicationAPI,
  cancelApplicationAPI,
  deleteApplicationAPI,
  getDocumentUrl,
  type BackendApplication,
} from '../../lib/api';
import { formatMoney, validateNIC, validatePhone, validateEmail } from '../../lib/utils';
import { FEES } from '../../types';
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  NicInput,
  PhoneInput,
} from '../../components/ui';
import LicenceCard3D from '../../components/LicenceCard3D';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-LK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isWithin12Hours(submittedAt: string): boolean {
  const submitted = new Date(submittedAt);
  const cutoff = new Date(submitted.getTime() + 12 * 60 * 60 * 1000);
  return new Date() < cutoff;
}

function timeRemainingLabel(submittedAt: string): string {
  const cutoff = new Date(new Date(submittedAt).getTime() + 12 * 60 * 60 * 1000);
  const diff = cutoff.getTime() - Date.now();
  if (diff <= 0) return 'Locked';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m remaining`;
}

type DocType = 'nic' | 'photo' | 'medical';

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [app, setApp] = useState<BackendApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  // Edit form state mirrors personal details
  const [eFullName, setEFullName] = useState('');
  const [eNic, setENic] = useState('');
  const [eDob, setEDob] = useState('');
  const [eGender, setEGender] = useState('');
  const [eAddress, setEAddress] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [eBloodGroup, setEBloodGroup] = useState('');
  const [eEmergency, setEEmergency] = useState('');
  const editFileRefs = useRef<Record<string, File>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editFileNames, setEditFileNames] = useState<Record<string, string>>({});

  /* DOB constraints */
  const maxDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10); })();
  const minDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 100); return d.toISOString().slice(0, 10); })();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getApplicationByIdAPI(Number(id))
      .then((data) => {
        setApp(data);
        // Pre-fill edit form
        setEFullName(data.fullName);
        setENic(data.nic);
        setEDob(data.dateOfBirth);
        setEGender(data.gender);
        setEAddress(data.address);
        setEPhone(data.phone);
        setEEmail(data.email);
        setEBloodGroup(data.bloodGroup ?? '');
        setEEmergency(data.emergencyContact ?? '');
      })
      .catch(() => setError('Application not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function saveEdit() {
    if (!app) return;
    setEditErr('');

    // Validate edit form
    const errs: Record<string, string> = {};
    if (!eFullName.trim() || eFullName.trim().length < 3) errs.fullName = 'Full name is required (min 3 chars).';
    const nicErr = validateNIC(eNic);
    if (nicErr) errs.nic = nicErr;
    if (!eDob) {
      errs.dob = 'Date of birth is required.';
    } else {
      const age = (Date.now() - new Date(eDob).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 18) errs.dob = 'You must be at least 18 years old.';
      if (age > 100) errs.dob = 'Please enter a valid date of birth.';
    }
    if (!eGender) errs.gender = 'Gender is required.';
    if (!eAddress.trim()) errs.address = 'Address is required.';
    const phoneErr = validatePhone(ePhone);
    if (phoneErr) errs.phone = phoneErr;
    const emailErr = validateEmail(eEmail);
    if (emailErr) errs.email = emailErr;
    if (!eBloodGroup) errs.bloodGroup = 'Blood group is required.';
    if (eEmergency && !/^\d{10}$/.test(eEmergency.trim())) errs.emergencyContact = 'Emergency contact must be exactly 10 digits.';

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }
    setEditErrors({});
    setEditBusy(true);
    try {
      const updated = await editApplicationAPI(app.id, {
        fullName: eFullName,
        nic: eNic,
        dateOfBirth: eDob,
        gender: eGender,
        address: eAddress,
        phone: ePhone,
        email: eEmail,
        bloodGroup: eBloodGroup,
        emergencyContact: eEmergency,
        nicCopy: editFileRefs.current['nic'],
        passportPhoto: editFileRefs.current['photo'],
        medicalReport: editFileRefs.current['medical'],
      });
      setApp(updated);
      setEditing(false);
      setEditSuccess('Application updated successfully.');
    } catch (err: unknown) {
      setEditErr(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setEditBusy(false);
    }
  }

  async function handleCancel() {
    if (!app) return;
    setCancelBusy(true);
    try {
      await cancelApplicationAPI(app.id);
      toast.success('Application cancelled successfully.');
      setApp({ ...app, status: 'cancelled' });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Cancellation failed.');
    } finally {
      setCancelBusy(false);
      setConfirmCancel(false);
    }
  }

  async function handleDelete() {
    if (!app) return;
    try {
      await deleteApplicationAPI(app.id);
      toast.success('Application deleted permanently.');
      nav('/app');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Deletion failed.');
    } finally {
      setConfirmDelete(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;
  if (error || !app) return <Alert kind="error">{error || 'Application not found.'}</Alert>;
  if (user?.role === 'applicant' && app.applicantId !== user.id) {
    return <Alert kind="error">You do not have permission to view this application.</Alert>;
  }

  const canEdit = (app.status === 'pending' || app.status === 'submitted') && isWithin12Hours(app.submittedAt);
  const editTimeLabel = (app.status === 'pending' || app.status === 'submitted') ? timeRemainingLabel(app.submittedAt) : 'N/A';

  const statusColors: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const docs = [
    { label: 'NIC Copy', path: app.nicCopyPath, key: 'nic' as DocType },
    { label: 'Passport Photo', path: app.passportPhotoPath, key: 'photo' as DocType },
    ...(app.medicalReportPath
      ? [{ label: 'Medical Report', path: app.medicalReportPath, key: 'medical' as DocType }]
      : []),
  ].filter(d => Boolean(d.path));

  return (
    <div>
      <PageHeader
        kicker="Application file"
        title={`#${app.id} · ${app.licenseClasses}`}
        subtitle={`${app.fullName} · ${app.nic}`}
        actions={
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              statusColors[app.status] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {app.status}
          </span>
        }
      />

      {editSuccess && <Alert kind="success">{editSuccess}</Alert>}

      {/* Rejection reason & Reapply CTA */}
      {app.status === 'rejected' && (
        <div className="mb-4 space-y-3">
          <Alert kind="error" title="Application Rejected">
            {app.rejectionReason || 'Your application was rejected by the registration officer.'}
          </Alert>
          <div className="flex items-center justify-between rounded-xl bg-red-50 p-4 border border-red-200">
            <div>
              <p className="text-sm font-semibold text-red-900">Eligible to Reapply</p>
              <p className="text-xs text-red-700">You can submit a corrected application with updated documents and particulars.</p>
            </div>
            <Link to="/app/apply">
              <Button variant="danger">Reapply Now</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Cancelled status banner */}
      {app.status === 'cancelled' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-100 p-4 border border-stone-300">
          <div>
            <p className="text-sm font-bold text-stone-800">Application Cancelled</p>
            <p className="text-xs text-stone-600">This application was cancelled. You can permanently delete this record from the database or submit a new application.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/app/apply">
              <Button variant="gold">New Application</Button>
            </Link>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete Record
            </Button>
          </div>
        </div>
      )}

      {/* Next Step Banners for sequential flow */}
      {app.status === 'approved' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4 border border-emerald-200">
          <div>
            <p className="text-sm font-bold text-emerald-900">Application Approved by Registration Officer!</p>
            <p className="text-xs text-emerald-700">Step 3 completed. You are now eligible to book your Computerized Theory Examination.</p>
          </div>
          <Link to="/app/exam">
            <Button variant="primary">Book Theory Exam &rarr;</Button>
          </Link>
        </div>
      )}

      {app.status === 'exam_passed' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-teal-50 p-4 border border-teal-200">
          <div>
            <p className="text-sm font-bold text-teal-900">Theory Examination Passed!</p>
            <p className="text-xs text-teal-700">Step 4 completed. You are now eligible to schedule your Practical Driving Trial.</p>
          </div>
          <Link to="/app/trial">
            <Button variant="primary">Book Driving Trial &rarr;</Button>
          </Link>
        </div>
      )}

      {app.status === 'trial_passed' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 p-4 border border-blue-200">
          <div>
            <p className="text-sm font-bold text-blue-900">Practical Driving Trial Passed!</p>
            <p className="text-xs text-blue-700">Step 5 completed. You can arrange certified training sessions or await licence card issuance.</p>
          </div>
          <Link to="/app/trial">
            <Button variant="secondary">Manage Trainer Booking</Button>
          </Link>
        </div>
      )}

      {app.status === 'license_issued' && (
        <div className="mb-4 rounded-xl bg-gradient-to-r from-[#0b1c33] to-[#16304f] p-6 text-white border border-[#c6a15b]/30">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-3">
              <span className="bg-[#c6a15b] text-[#0b1c33] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Digital Licence Ready
              </span>
              <h3 className="font-display text-2xl font-bold">Congratulations, {app.fullName.split(' ')[0]}!</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Your official Sri Lankan Driving Licence has been issued and printed. 
                You can preview your digital card here. The physical card will be dispatched to your registered address via registered post.
              </p>
            </div>
            <div className="w-full md:w-auto flex justify-center items-center pointer-events-none scale-75 md:scale-90 origin-center md:origin-right">
               <LicenceCard3D 
                 fullName={app.fullName}
                 nic={app.nic}
                 dob={app.dateOfBirth}
                 address={app.address}
                 classes={app.licenseClasses}
                 issuedAt="N/A"
                 expiresAt="N/A"
                 photoUrl={app.passportPhotoPath ? getDocumentUrl(app.passportPhotoPath) : undefined}
               />
            </div>
          </div>
        </div>
      )}

      {/* 12-hour edit lock banner & Support Ticket CTA */}
      {(app.status === 'pending' || app.status === 'submitted') && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${canEdit ? 'bg-[#c6a15b]/15 text-[#0b1c33]' : 'bg-[#0b1c33]/8 text-[#0b1c33]'}`}>
          {canEdit ? (
            <>
              ✏️ <strong>Edit window open</strong> — {editTimeLabel}. You can edit personal details and replace documents.
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#0b1c33]">🔒 Self-service editing is locked (12-hour window expired)</p>
                <p className="text-xs text-[#0b1c33]/70">Profile particulars can now only be corrected by an Officer via a verified Support Ticket.</p>
              </div>
              <Link to={`/app/tickets/new?appId=${app.id}`}>
                <Button size="sm" variant="gold">
                  Raise Correction Support Ticket &rarr;
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Personal details ── */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Applicant particulars</h2>
            {canEdit && !editing && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Edit application
                </Button>
                <Button variant="danger" disabled={cancelBusy} onClick={() => setConfirmCancel(true)}>
                  Cancel Application
                </Button>
              </div>
            )}
            {app.status === 'cancelled' && (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete Record
              </Button>
            )}
          </div>

          {!editing ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ['Full name', app.fullName],
                ['NIC', app.nic],
                ['Date of birth', app.dateOfBirth],
                ['Gender', app.gender],
                ['Address', app.address],
                ['Phone', app.phone],
                ['Email', app.email],
                ['Blood group', app.bloodGroup || '—'],
                ['Emergency contact', app.emergencyContact || '—'],
                ['One-Day Service', app.oneDayService ? 'Yes' : 'No'],
                ['Submitted', formatDateTime(app.submittedAt)],
                ['Last updated', formatDateTime(app.updatedAt)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] tracking-wide text-[#0b1c33]/45 uppercase">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            /* ── Edit form ── */
            <div className="space-y-4">
              {editErr && <Alert kind="error">{editErr}</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required error={editErrors.fullName}>
                  <Input value={eFullName} onChange={(e) => setEFullName(e.target.value)} />
                </Field>
                <Field label="NIC" required error={editErrors.nic}>
                  <NicInput value={eNic} onChange={(v) => setENic(v)} />
                </Field>
                <Field label="Date of birth" required error={editErrors.dob}>
                  <Input type="date" value={eDob} max={maxDob} min={minDob} onChange={(e) => setEDob(e.target.value)} />
                </Field>
                <Field label="Gender" required error={editErrors.gender}>
                  <Select value={eGender} onChange={(e) => setEGender(e.target.value)}>
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field label="Address" required error={editErrors.address}>
                  <Input value={eAddress} onChange={(e) => setEAddress(e.target.value)} />
                </Field>
                <Field label="Phone" required error={editErrors.phone}>
                  <PhoneInput value={ePhone} onChange={(v) => setEPhone(v)} />
                </Field>
                <Field label="Email" required error={editErrors.email}>
                  <Input value={eEmail} onChange={(e) => setEEmail(e.target.value)} />
                </Field>
                <Field label="Blood group" required error={editErrors.bloodGroup}>
                  <Select value={eBloodGroup} onChange={(e) => setEBloodGroup(e.target.value)}>
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Emergency contact (10-digit)" error={editErrors.emergencyContact}>
                  <PhoneInput
                    value={eEmergency}
                    placeholder="0771234567"
                    onChange={(v) => setEEmergency(v)}
                  />
                </Field>
              </div>

              {/* Replace documents */}
              <h3 className="mt-2 font-semibold text-sm">Replace documents (upload only to replace existing)</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {([
                  ['nic', 'NIC copy'],
                  ['photo', 'Passport photo'],
                  ['medical', 'Medical report'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="cursor-pointer rounded-xl border border-dashed border-[#0b1c33]/20 bg-[#f6f1e7] p-3">
                    <p className="text-xs font-semibold uppercase">{label}</p>
                    {editFileNames[key] && (
                      <p className="mt-1 text-xs text-[#0e7c7b] truncate">{editFileNames[key]}</p>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="mt-2 block w-full text-xs"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          editFileRefs.current[key] = e.target.files[0];
                          setEditFileNames(prev => ({ ...prev, [key]: e.target.files![0].name }));
                        }
                      }}
                    />
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={saveEdit} disabled={editBusy} variant="gold">
                  {editBusy && <Spinner />} Save changes
                </Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Fee summary */}
          <Card>
            <p className="text-[11px] tracking-widest text-[#c6a15b] uppercase">Fees</p>
            <p className="mt-1 font-display text-xl">
              {formatMoney(
                (app.licenseClasses || '').split(',').filter(Boolean).length * FEES.application +
                  (app.oneDayService ? FEES.one_day : 0),
              )}
            </p>
            <p className="text-xs text-[#0b1c33]/55">
              {(app.licenseClasses || '').split(',').filter(Boolean).length} class(es)
              {app.oneDayService ? ' + one-day' : ''}
            </p>
          </Card>

          {/* Status card */}
          {app.officerNotes && (
            <Card>
              <p className="text-[11px] tracking-widest text-[#c6a15b] uppercase">Officer notes</p>
              <p className="mt-2 text-sm">{app.officerNotes}</p>
            </Card>
          )}

          {/* Uploaded documents */}
          <Card>
            <h3 className="font-display text-lg mb-3">Uploaded documents</h3>
            <div className="space-y-3">
              {docs.map(({ label, path, key }) => {
                const url = getDocumentUrl(path);
                const isImage = /\.(jpg|jpeg|png|webp)$/i.test(path);
                return (
                  <div key={key} className="rounded-xl border border-[#0b1c33]/10 p-3">
                    <p className="text-xs font-semibold uppercase text-[#0b1c33]/60">{label}</p>
                    {isImage ? (
                      <img
                        src={url}
                        alt={label}
                        className="mt-2 h-28 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <p className="mt-1 text-xs text-[#0b1c33]/50 truncate">{path.split('/').pop()}</p>
                    )}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-[#0e7c7b] underline"
                    >
                      View / Download ↗
                    </a>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel application?"
        message="This will cancel your application. You can re-apply if needed."
        confirmLabel="Yes, cancel it"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete application record?"
        message="This will permanently delete this cancelled application record from the system. This action cannot be undone."
        confirmLabel="Yes, delete it"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
