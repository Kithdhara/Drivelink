import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { Alert, Button, Card, Field, PageHeader, StatusBadge, Textarea, Timeline } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export default function OfficerReview() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const { state, verifyDocuments, decideApplication, issueLicense, log } = useStore();
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmReject, setConfirmReject] = useState(false);
  const found = state.applications.find((a) => a.id === id);

  if (!found || !user) return <Alert kind="error">File not found.</Alert>;
  const app = found;
  const me = user;

  function verify() {
    verifyDocuments(app.id, me.id, notes);
    log({
      userId: me.id,
      userName: me.name,
      action: 'VERIFY_DOCUMENTS',
      entity: 'Application',
      entityId: app.id,
      details: notes || 'Documents verified',
    });
    toast.success('Documents verified successfully.');
    setMsg('Documents marked as verified.');
  }

  function decide(d: 'approve' | 'reject') {
    if (d === 'reject' && reason.trim().length < 8) {
      toast.error('A clear reason is required for rejection.');
      setMsg('');
      return;
    }
    decideApplication(app.id, me.id, d, d === 'reject' ? reason : notes);
    log({
      userId: me.id,
      userName: me.name,
      action: d === 'approve' ? 'APPROVE_APPLICATION' : 'REJECT_APPLICATION',
      entity: 'Application',
      entityId: app.id,
      details: reason || notes || d,
    });
    toast.success(d === 'approve' ? 'Application approved.' : 'Application rejected.');
    setMsg(d === 'approve' ? 'Application approved.' : 'Application rejected.');
  }

  function issue() {
    const rec = issueLicense(app.id, me.id);
    if (rec) {
      log({
        userId: me.id,
        userName: me.name,
        action: 'ISSUE_LICENSE',
        entity: 'License',
        entityId: rec.id,
        details: rec.licenseNumber,
      });
      toast.success(`Licence ${rec.licenseNumber} issued.`);
      setMsg(`Licence ${rec.licenseNumber} issued.`);
    }
  }

  const canApprove = app.status === 'trial_passed' || (app.type === 'renewal' && app.status === 'documents_verified');

  return (
    <div>
      <PageHeader
        kicker="Review"
        title={app.id}
        subtitle={`${app.personal.fullName} · ${app.personal.nic} · class ${app.category}`}
        actions={<StatusBadge status={app.status} />}
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      <Card className="mb-5">
        <Timeline status={app.status} />
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl">Uploaded documents</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {app.documents.map((d) => (
              <div key={d.id} className="rounded-xl border border-[#0b1c33]/10 p-3">
                <p className="text-xs font-semibold uppercase">
                  {d.type} {d.verified ? '· verified' : ''}
                </p>
                <p className="truncate text-xs">{d.name}</p>
                {d.mimeType.startsWith('image/') && <img src={d.dataUrl} alt="" className="mt-2 h-40 w-full rounded object-cover" />}
              </div>
            ))}
          </div>
          <Field label="Officer notes" >
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-4" />
          </Field>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={verify} disabled={app.status !== 'submitted' && app.status !== 'documents_verified'}>
              Verify documents
            </Button>
            <Button variant="gold" disabled={!canApprove} onClick={() => decide('approve')}>
              Approve
            </Button>
            <Button variant="gold" disabled={app.status !== 'approved'} onClick={issue}>
              Issue licence
            </Button>
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Reject with reason</h2>
          <Field label="Reason (required)">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Button className="mt-3" variant="danger" onClick={() => setConfirmReject(true)}>
            Reject application
          </Button>
          <p className="mt-4 text-xs text-[#0b1c33]/50">
            Approval is enabled after a passed trial (new issues) or after document verification (straightforward
            renewals).
          </p>
          <Button className="mt-4" variant="ghost" onClick={() => nav('/officer/applications')}>
            Back to register
          </Button>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReject}
        title="Reject application?"
        message="This will permanently reject the application. The citizen will be notified with your provided reason."
        confirmLabel="Yes, reject"
        variant="danger"
        onConfirm={() => {
          decide('reject');
          setConfirmReject(false);
        }}
        onCancel={() => setConfirmReject(false)}
      />
    </div>
  );
}
