import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getApplicationByIdAPI,
  updateApplicationStatusAPI,
  getDocumentUrl,
  type BackendApplication,
} from '../../lib/api';
import { Alert, Button, Card, Field, PageHeader, Spinner, Textarea } from '../../components/ui';
import { useToast } from '../../components/Toast';

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

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;
  if (error || !app) return <Alert kind="error">{error || 'Application not found.'}</Alert>;

  const after12h = isAfter12Hours(app.submittedAt);
  const canAct = app.status === 'pending' || app.status === 'submitted'; // officer can only act on pending or submitted

  const statusColors: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
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
          <Alert kind="success" title="Approved">This application has been approved.</Alert>
        </div>
      )}
      {app.status === 'rejected' && app.rejectionReason && (
        <div className="mb-4">
          <Alert kind="error" title="Rejected">
            Reason given to applicant: <strong>{app.rejectionReason}</strong>
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
            <Card>
              <h3 className="font-display text-lg mb-2 text-green-700">Approve application</h3>
              <p className="text-xs text-[#0b1c33]/55 mb-3">
                This will mark the application as <strong>approved</strong> and notify the applicant.
                The applicant will not be able to apply for another licence.
              </p>
              <Button
                variant="gold"
                disabled={busy}
                onClick={() => doAction('approved')}
                className="w-full"
              >
                {busy ? <Spinner /> : null}
                ✅ Approve application
              </Button>
            </Card>
          )}

          {/* Reject */}
          {canAct && (
            <Card>
              <h3 className="font-display text-lg mb-2 text-red-700">Reject application</h3>
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
                  className="mt-3 w-full"
                >
                  ❌ Reject application
                </Button>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-red-700">
                    Confirm rejection? This will notify the applicant with the reason above.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="danger" disabled={busy} onClick={() => doAction('rejected')}>
                      {busy ? <Spinner /> : null} Confirm
                    </Button>
                    <Button variant="secondary" onClick={() => setConfirmReject(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {!canAct && app.status !== 'pending' && (
            <Card>
              <p className="text-sm text-[#0b1c33]/55">
                This application has already been <strong>{app.status}</strong>. No further action is required.
              </p>
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
