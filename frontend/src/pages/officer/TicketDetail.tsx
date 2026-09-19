import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, Textarea } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import {
  getApplicationByIdAPI,
  getTicketByIdAPI,
  getTicketDocumentUrl,
  overrideTicketAPI,
  rejectTicketAPI,
  type BackendApplication,
  type BackendTicket,
} from '../../lib/api';

function formatDateTime(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<BackendTicket | null>(null);
  const [app, setApp] = useState<BackendApplication | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [officerNotes, setOfficerNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    getTicketByIdAPI(Number(id))
      .then(async (t) => {
        setTicket(t);
        setOfficerNotes(t.officerNotes || '');
        if (t.applicationId) {
          try {
            const currentApp = await getApplicationByIdAPI(t.applicationId);
            setApp(currentApp);
          } catch {
            // Target application might already have been overridden or archived
          }
        }
      })
      .catch((e) => setError(e.message || 'Ticket not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;
  if (error || !ticket) {
    return (
      <div className="py-12">
        <Alert kind="error">{error || 'Ticket not found.'}</Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => nav('/officer/tickets')}>
            ← Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  const isPending = ticket.status === 'PENDING_REVIEW' || ticket.status === 'OPEN';
  const isResolved = ticket.status === 'RESOLVED';
  const isRejected = ticket.status === 'REJECTED';

  async function handleOverride() {
    if (!ticket || !user) return;
    setBusy(true);
    setError('');
    try {
      await overrideTicketAPI(ticket.id, {
        officerId: user.id,
        officerName: user.name || user.email || 'Registration Officer',
        officerNotes: officerNotes.trim() || 'Administrative profile override approved following physical/scanned identity verification.',
      });

      toast.success('Administrative override executed successfully!');
      // Reload ticket
      const updated = await getTicketByIdAPI(ticket.id);
      setTicket(updated);
      setConfirmOverride(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Administrative override failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!ticket || !user) return;
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejecting this correction ticket.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = await rejectTicketAPI(ticket.id, {
        officerId: user.id,
        officerName: user.name || user.email || 'Registration Officer',
        reason: rejectReason.trim(),
      });
      toast.success('Support ticket rejected.');
      setTicket(updated);
      setShowRejectModal(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Rejection failed');
    } finally {
      setBusy(false);
    }
  }

  // Helper comparison
  function renderFieldDiff(label: string, currentVal?: string | null, requestedVal?: string | null) {
    const isChanged = requestedVal && requestedVal.trim() !== (currentVal || '').trim();
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg border transition-colors ${
        isChanged ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-stone-100'
      }`}>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{label} (Current Locked)</span>
          <p className="mt-0.5 text-sm font-medium text-[#0b1c33]">{currentVal || '-'}</p>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{label} (Requested)</span>
            {isChanged && (
              <span className="rounded bg-amber-200 px-1.5 py-0.2 text-[10px] font-bold text-amber-900 uppercase">
                Modified
              </span>
            )}
          </div>
          <p className={`mt-0.5 text-sm font-semibold ${isChanged ? 'text-amber-900 font-bold' : 'text-stone-600'}`}>
            {requestedVal || <span className="italic text-stone-400">No change</span>}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => nav('/officer/tickets')}>
            ← Back to Tickets Queue
          </Button>
          <PageHeader
            kicker={`Ticket ${ticket.ticketNumber}`}
            title={`Profile Override Review · App #${ticket.applicationId}`}
            subtitle={`Citizen: ${ticket.applicantName} (${ticket.applicantEmail}) · Submitted: ${formatDateTime(ticket.createdAt)}`}
          />
        </div>

        <div>
          <Badge tone={isResolved ? 'success' : isRejected ? 'danger' : 'warn'}>
            {ticket.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {/* Overview Notice */}
      <div className="rounded-xl border border-[#0e7c7b]/30 bg-[#0e7c7b]/5 p-4 text-sm text-[#0b1c33]">
        <p className="font-semibold text-[#0e7c7b]">Post-12-Hour Administrative Profile Override Protocol</p>
        <p className="mt-1 text-xs text-[#0b1c33]/80">
          Citizen profile modifications past the 12-hour statutory window require Officer authorization.
          Approving this request triggers an <strong>atomic @Transactional workflow</strong>: the current locked application is archived into the historical compliance registry, a fresh verified application is generated with the corrected parameters, all connected examination/trial bookings and records are automatically relinked, and the old erroneous record is safely purged.
        </p>
      </div>

      {/* Citizen Justification */}
      <Card>
        <h3 className="font-display text-lg font-bold text-[#0b1c33]">Citizen's Stated Reason for Correction</h3>
        <p className="mt-2 rounded-lg bg-stone-50 p-4 text-sm italic text-stone-800 border border-stone-200/80">
          "{ticket.reason}"
        </p>
      </Card>

      {/* Side-by-side Field Comparison */}
      <Card>
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="font-display text-lg font-bold text-[#0b1c33]">Side-by-Side Profile Data Comparison</h3>
          <span className="text-xs text-stone-500">Highlighted rows indicate requested changes</span>
        </div>

        <div className="space-y-3">
          {renderFieldDiff('Full Legal Name', app?.fullName, ticket.requestedFullName)}
          {renderFieldDiff('NIC / Identification', app?.nic, ticket.requestedNic)}
          {renderFieldDiff('Date of Birth', app?.dateOfBirth ? app.dateOfBirth.slice(0, 10) : undefined, ticket.requestedDateOfBirth ? ticket.requestedDateOfBirth.slice(0, 10) : undefined)}
          {renderFieldDiff('Gender', app?.gender, ticket.requestedGender)}
          {renderFieldDiff('Contact Phone', app?.phone, ticket.requestedPhone)}
          {renderFieldDiff('Email Address', app?.email, ticket.requestedEmail)}
          {renderFieldDiff('Blood Group', app?.bloodGroup, ticket.requestedBloodGroup)}
          {renderFieldDiff('Emergency Contact', app?.emergencyContact, ticket.requestedEmergencyContact)}
          {renderFieldDiff('Residential Address', app?.address, ticket.requestedAddress)}
        </div>
      </Card>

      {/* Attached Evidence Documents */}
      <Card>
        <h3 className="font-display text-lg font-bold text-[#0b1c33] mb-3">Submitted Supporting Proof Documents</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* NIC Copy */}
          <div className="rounded-xl border border-stone-200 p-4 bg-stone-50">
            <p className="text-xs font-bold uppercase text-stone-600">National Identity Card Copy</p>
            {ticket.nicCopyPath ? (
              <div className="mt-2">
                <a
                  href={getTicketDocumentUrl(ticket.nicCopyPath)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0e7c7b] hover:underline"
                >
                  📄 View Scanned NIC Document ↗
                </a>
              </div>
            ) : (
              <p className="mt-2 text-xs text-stone-400 italic">No document attached</p>
            )}
          </div>

          {/* Birth Certificate */}
          <div className="rounded-xl border border-stone-200 p-4 bg-stone-50">
            <p className="text-xs font-bold uppercase text-stone-600">Birth Certificate Scan</p>
            {ticket.birthCertificatePath ? (
              <div className="mt-2">
                <a
                  href={getTicketDocumentUrl(ticket.birthCertificatePath)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0e7c7b] hover:underline"
                >
                  📄 View Birth Certificate ↗
                </a>
              </div>
            ) : (
              <p className="mt-2 text-xs text-stone-400 italic">No document attached</p>
            )}
          </div>

          {/* Additional Document */}
          <div className="rounded-xl border border-stone-200 p-4 bg-stone-50">
            <p className="text-xs font-bold uppercase text-stone-600">Additional Proof / Affidavit</p>
            {ticket.additionalDocPath ? (
              <div className="mt-2">
                <a
                  href={getTicketDocumentUrl(ticket.additionalDocPath)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0e7c7b] hover:underline"
                >
                  📄 View Supporting Document ↗
                </a>
              </div>
            ) : (
              <p className="mt-2 text-xs text-stone-400 italic">No document attached</p>
            )}
          </div>
        </div>
      </Card>

      {/* Resolution or Action Section */}
      {isResolved ? (
        <Card className="border-green-600/30 bg-green-50/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-lg font-bold text-green-950">✓ Ticket Successfully Resolved</p>
              <p className="mt-1 text-sm text-green-900">
                Executed by Officer: <strong>{ticket.officerName || ticket.officerId}</strong> on {formatDateTime(ticket.resolvedAt || ticket.updatedAt)}
              </p>
              {ticket.officerNotes && (
                <p className="mt-2 text-xs text-green-900/80 bg-white/80 p-3 rounded-lg border border-green-200">
                  Officer Notes: "{ticket.officerNotes}"
                </p>
              )}
            </div>

            {ticket.newApplicationId && (
              <Button
                variant="gold"
                size="sm"
                onClick={() => nav(`/officer/review/${ticket.newApplicationId}`)}
              >
                Inspect New Application #{ticket.newApplicationId} →
              </Button>
            )}
          </div>
        </Card>
      ) : isRejected ? (
        <Card className="border-red-600/30 bg-red-50/50">
          <p className="font-display text-lg font-bold text-red-950">✗ Ticket Rejected</p>
          <p className="mt-1 text-sm text-red-900">
            Rejected by Officer: <strong>{ticket.officerName || ticket.officerId}</strong> on {formatDateTime(ticket.updatedAt)}
          </p>
          <p className="mt-2 text-xs text-red-900/80 bg-white/80 p-3 rounded-lg border border-red-200">
            Rejection Reason: "{ticket.officerNotes || 'Insufficient documentation provided'}"
          </p>
        </Card>
      ) : (
        <Card>
          <h3 className="font-display text-lg font-bold text-[#0b1c33]">Officer Determination & Execution</h3>
          <p className="text-xs text-[#0b1c33]/60 mb-3">
            Add any audit remarks regarding physical identity verification or DMT compliance notes.
          </p>

          <Field label="Officer Administrative Notes">
            <Textarea
              rows={3}
              placeholder="e.g., Verified citizen original NIC copy and confirmed spelling alteration. Approved for atomic recreation."
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
            />
          </Field>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-3 border-t">
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => setShowRejectModal(true)}
            >
              Reject Correction Ticket
            </Button>
            <Button
              variant="gold"
              disabled={busy}
              onClick={() => setConfirmOverride(true)}
            >
              {busy ? <Spinner /> : 'Approve & Execute Administrative Override →'}
            </Button>
          </div>
        </Card>
      )}

      {/* Confirm Override Dialog */}
      <ConfirmDialog
        open={confirmOverride}
        title="Execute Atomic Administrative Override?"
        message={`This action will archive Application #${ticket.applicationId}, create a new verified application with the requested profile corrections, relink all exam and trial bookings, safely delete the old record, and generate an immutable audit log. Are you sure?`}
        confirmLabel="Yes, Execute Override"
        variant="primary"
        onConfirm={handleOverride}
        onCancel={() => setConfirmOverride(false)}
      />

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-[#0b1c33]">Reject Correction Ticket</h3>
            <p className="mt-1 text-xs text-[#0b1c33]/60">
              Provide a clear reason explaining why the requested correction cannot be processed.
            </p>

            <div className="mt-4">
              <Field label="Rejection Reason" required>
                <Textarea
                  rows={3}
                  placeholder="e.g., Attached NIC scan is illegible or name does not match supporting documents."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={busy} onClick={handleReject}>
                {busy ? <Spinner /> : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
