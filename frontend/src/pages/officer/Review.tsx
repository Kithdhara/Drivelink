import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getApplicationByIdAPI,
  updateApplicationStatusAPI,
  verifyDocumentsAPI,
  issueLicenseAPI,
  getDocumentUrl,
  type BackendApplication,
} from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Alert, Button, Card, Field, PageHeader, Spinner, Textarea } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { CheckCircle2, XCircle, IdCard } from 'lucide-react';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-LK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isAfter12Hours(submittedAt: string): boolean {
  const cutoff = new Date(new Date(submittedAt).getTime() + 12 * 60 * 60 * 1000);
  return new Date() >= cutoff;
}

function timeUntilLock(submittedAt: string): string {
  const cutoff = new Date(new Date(submittedAt).getTime() + 12 * 60 * 60 * 1000);
  const diff = cutoff.getTime() - Date.now();
  if (diff <= 0) return 'locked';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `in ${h}h ${m}m`;
}

export default function OfficerReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [app, setApp] = useState<BackendApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [officerNotes, setOfficerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmReject, setConfirmReject] = useState(false);

  useEffect(() => {
    if (!id) return;
    getApplicationByIdAPI(Number(id))
      .then((data) => {
        setApp(data);
        setOfficerNotes(data.officerNotes ?? '');
        setRejectionReason(data.rejectionReason ?? '');
      })
      .catch(() => setError('Application not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function doAction(status: 'approved' | 'rejected') {
    if (!app) return;
    if (status === 'rejected' && rejectionReason.trim().length < 8) {
      toast.error('Please provide a clear rejection reason (at least 8 characters).');
      return;
    }
    setBusy(true);
    try {
      const updated = await updateApplicationStatusAPI(
        app.id,
        status,
        officerNotes,
        status === 'rejected' ? rejectionReason : undefined,
      );
      setApp(updated);
      toast.success(status === 'approved' ? 'Application approved.' : 'Application rejected — applicant will be notified.');
      setConfirmReject(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyDocs() {
    if (!app || !user) return;
    setBusy(true);
    try {
      const updated = await verifyDocumentsAPI(app.id, user.id, officerNotes);
      setApp(updated);
      toast.success('Documents verified successfully.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleIssueLicense() {
    if (!app || !user) return;
    setBusy(true);
    try {
      await issueLicenseAPI(app.id, user.id);
      // Refresh app to get updated status
      const updated = await getApplicationByIdAPI(app.id);
      setApp(updated);
      toast.success('License issued successfully!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'License issuance failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;
  if (error || !app) return <Alert kind="error">{error || 'Application not found.'}</Alert>;

  const after12h = isAfter12Hours(app.submittedAt);
  const canAct = ['pending', 'submitted', 'documents_verified'].includes(app.status);
  const canVerifyDocs = ['pending', 'submitted'].includes(app.status);
  const canIssueLicense = app.status === 'trial_passed';

  const statusColors: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
    documents_verified: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    exam_booked: 'bg-purple-100 text-purple-800',
    exam_passed: 'bg-teal-100 text-teal-800',
    exam_failed: 'bg-orange-100 text-orange-800',
    trial_booked: 'bg-indigo-100 text-indigo-800',
    trial_passed: 'bg-emerald-100 text-emerald-800',
    trial_failed: 'bg-rose-100 text-rose-800',
    license_issued: 'bg-sky-100 text-sky-800',
  };

  const docs = [
    { label: 'NIC Copy', path: app.nicCopyPath },
    { label: 'Passport Photo', path: app.passportPhotoPath },
    ...(app.medicalReportPath ? [{ label: 'Medical Report', path: app.medicalReportPath }] : []),
  ].filter(d => Boolean(d.path));

  return (
    <div>
      <PageHeader
        kicker="Review"
        title={`Application #${app.id}`}
        subtitle={`${app.fullName} · ${app.nic} · ${app.licenseClasses}`}
        actions={
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColors[app.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {app.status}
          </span>
        }
      />

      {/* 12-hour edit window warning */}
      {!after12h && (
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          ⏳ <strong>Applicant edit window closes {timeUntilLock(app.submittedAt)}</strong> — the applicant can still modify this application. Review actions are available now but the application may change.
        </div>
      )}

      {/* Approved/Rejected outcome */}
      {app.status === 'approved' && (
        <div className="mb-4">
          <Alert kind="success" title="Stage 1 Approved — Ready for Theory Examination">
            This application and its documents have been approved by the Registration Officer. The applicant is now eligible to book their computerized theory exam. Licences cannot be issued at this first stage; issuance unlocks once the applicant passes the practical driving trial.
          </Alert>
        </div>
      )}
      {app.status === 'exam_booked' && (
        <div className="mb-4">
          <Alert kind="info" title="Stage 2: Theory Exam Booked">
            The applicant has booked a computerized theory examination slot and is awaiting their test sitting.
          </Alert>
        </div>
      )}
      {app.status === 'exam_passed' && (
        <div className="mb-4">
          <Alert kind="success" title="Stage 2: Theory Exam Passed">
            The applicant passed the computerized theory examination. They can now book a practical driving trial.
          </Alert>
        </div>
      )}
      {app.status === 'trial_booked' && (
        <div className="mb-4">
          <Alert kind="info" title="Stage 3: Practical Trial Booked">
            The applicant has booked a driving trial slot and is preparing for their practical test.
          </Alert>
        </div>
      )}
      {app.status === 'trial_passed' && (
        <div className="mb-4">
          <Alert kind="success" title="Final Stage: Practical Trial Passed — Ready for Licence Issuance!">
            The applicant has passed the practical driving trial! You can now generate and issue their official driving licence below.
          </Alert>
        </div>
      )}
      {app.status === 'rejected' && app.rejectionReason && (
        <div className="mb-4">
          <Alert kind="error" title="Application Rejected">
            Reason given to applicant: <strong>{app.rejectionReason}</strong>. The applicant is permitted to reapply with corrected particulars.
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal details */}
          <Card>
            <h2 className="font-display text-xl mb-4">Applicant particulars</h2>
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
                ['One-Day Service', app.oneDayService ? '✅ Yes' : 'No'],
                ['Submitted', formatDateTime(app.submittedAt)],
                ['Last updated', formatDateTime(app.updatedAt)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] tracking-wide text-[#0b1c33]/45 uppercase">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Uploaded documents */}
          <Card>
            <h2 className="font-display text-xl mb-4">Uploaded documents</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {docs.map(({ label, path }) => {
                const url = getDocumentUrl(path);
                const isImage = /\.(jpg|jpeg|png|webp)$/i.test(path);
                return (
                  <div key={path} className="rounded-xl border border-[#0b1c33]/10 p-3">
                    <p className="text-xs font-semibold uppercase text-[#0b1c33]/60">{label}</p>
                    {isImage ? (
                      <img src={url} alt={label} className="mt-2 h-36 w-full rounded-lg object-cover" />
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

        {/* ── Sidebar actions ── */}
        <div className="space-y-4">
          {/* Officer notes */}
          <Card>
            <h3 className="font-display text-lg mb-3">Officer notes</h3>
            <Field label="Notes (visible to applicant on approval)">
              <Textarea
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                disabled={!canAct}
                placeholder="Add internal notes or feedback…"
              />
            </Field>
          </Card>

          {/* Approve */}
          {canAct && (
            <Card className="border-l-4 border-l-emerald-500">
              <h3 className="font-display text-lg mb-2 text-[#0b1c33] flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Approve application
              </h3>
              <p className="text-xs text-[#0b1c33]/55 mb-4">
                This will mark the application as <strong>approved</strong> and notify the applicant.
                The applicant will not be able to apply for another licence.
              </p>
              <Button
                variant="gold"
                disabled={busy}
                onClick={() => doAction('approved')}
                className="w-full flex items-center justify-center gap-2"
              >
                {busy ? <Spinner /> : null}
                Approve application
              </Button>
            </Card>
          )}

          {/* Reject */}
          {canAct && (
            <Card className="border-l-4 border-l-red-500">
              <h3 className="font-display text-lg mb-2 text-[#0b1c33] flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" /> Reject application
              </h3>
              <Field label="Rejection reason (required — shown to applicant)">
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State clearly why the application is being rejected…"
                />
              </Field>
              {!confirmReject ? (
                <Button
                  variant="danger"
                  disabled={busy || rejectionReason.trim().length < 8}
                  onClick={() => setConfirmReject(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2"
                >
                  Reject application
                </Button>
              ) : (
                <div className="mt-4 rounded-lg bg-red-50 p-3 border border-red-100">
                  <p className="text-sm font-semibold text-red-800 mb-3">
                    Confirm rejection? This will immediately notify the applicant with the reason above.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="danger" disabled={busy} onClick={() => doAction('rejected')} className="flex-1">
                      {busy ? <Spinner /> : null} Confirm Rejection
                    </Button>
                    <Button variant="secondary" onClick={() => setConfirmReject(false)} className="flex-1">Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {!canAct && app.status !== 'pending' && app.status !== 'license_issued' && (
            <Card>
              <p className="text-sm text-[#0b1c33]/55">
                This application has already been <strong>{app.status}</strong>. No further action is required.
              </p>
            </Card>
          )}



          {/* Issue License — only when trial passed */}
          {canIssueLicense && (
            <Card className="border-l-4 border-l-sky-500">
              <h3 className="font-display text-lg mb-2 text-[#0b1c33] flex items-center gap-2">
                <IdCard className="h-5 w-5 text-sky-600" /> Issue driving licence
              </h3>
              <p className="text-xs text-[#0b1c33]/65 mb-4">
                All stages complete: Documents verified & approved, theory exam passed, and practical driving trial passed. Generate and issue the official licence card.
              </p>
              <Button
                variant="gold"
                disabled={busy}
                onClick={handleIssueLicense}
                className="w-full flex items-center justify-center gap-2"
              >
                {busy ? <Spinner /> : null}
                Issue driving licence
              </Button>
            </Card>
          )}

          {!canIssueLicense && ['approved', 'exam_booked', 'exam_passed', 'trial_booked'].includes(app.status) && (
            <Card>
              <h3 className="font-display text-base font-semibold text-[#0b1c33] mb-1">Licence Issuance Locked</h3>
              <p className="text-xs text-[#0b1c33]/60 leading-relaxed">
                Licences cannot be issued at the initial application stage. The applicant must complete their computerized theory exam and pass the practical driving trial before a licence can be issued.
              </p>
              <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
                Current stage: <strong>{app.status}</strong>
              </div>
            </Card>
          )}

          {app.status === 'license_issued' && (
            <Card>
              <Alert kind="success" title="Licence issued">
                A driving licence has been issued for this application. The applicant can now collect their licence.
              </Alert>
            </Card>
          )}

          <Button variant="ghost" className="w-full" onClick={() => nav('/officer/applications')}>
            ← Back to register
          </Button>
        </div>
      </div>
    </div>
  );
}
