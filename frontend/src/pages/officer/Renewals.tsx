import { useEffect, useMemo, useState } from 'react';
import {
  getAllRenewalsAPI,
  approveRenewalAPI,
  rejectRenewalAPI,
  getRenewalDocumentUrl,
  type BackendRenewal,
} from '../../lib/api';
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  TableWrap,
  Td,
  Th,
} from '../../components/ui';
import { useToast } from '../../components/Toast';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Image,
  RefreshCw,
  Search,
  Stethoscope,
  X,
  XCircle,
} from 'lucide-react';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function OfficerRenewals() {
  const toast = useToast();
  const [renewals, setRenewals] = useState<BackendRenewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [search, setSearch] = useState('');

  // Selected renewal for review modal
  const [selected, setSelected] = useState<BackendRenewal | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'approve' | 'reject'>('view');

  useEffect(() => {
    loadRenewals();
  }, []);

  async function loadRenewals() {
    setLoading(true);
    try {
      const data = await getAllRenewalsAPI();
      setRenewals(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      toast.error('Failed to load renewal requests.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return renewals.filter((r) => {
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.licenseNumber.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.nic.toLowerCase().includes(q) ||
        (r.phone && r.phone.toLowerCase().includes(q))
      );
    });
  }, [renewals, filterStatus, search]);

  const pendingCount = renewals.filter((r) => r.status === 'PENDING').length;
  const approvedCount = renewals.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = renewals.filter((r) => r.status === 'REJECTED').length;

  function openReview(r: BackendRenewal, mode: 'view' | 'approve' | 'reject' = 'view') {
    setSelected(r);
    setModalMode(mode);
    setNotes(r.officerNotes || '');
    setRejectReason(r.rejectionReason || '');
  }

  async function handleApprove() {
    if (!selected) return;
    setActionBusy(true);
    try {
      const updated = await approveRenewalAPI(selected.id, notes.trim() || 'Approved by Registration Officer. Driving licence renewed for 8 years.');
      setRenewals((prev) => prev.map((r) => (r.id === selected.id ? updated : r)));
      toast.success(`Renewal #${selected.id} approved successfully. Licence renewed.`);
      setSelected(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Approval failed.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReject() {
    if (!selected) return;
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    setActionBusy(true);
    try {
      const updated = await rejectRenewalAPI(selected.id, notes.trim(), rejectReason.trim());
      setRenewals((prev) => prev.map((r) => (r.id === selected.id ? updated : r)));
      toast.success(`Renewal #${selected.id} has been rejected.`);
      setSelected(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Rejection failed.');
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Casework desk"
        title="Driving licence renewals"
        subtitle="Review existing licence renewal applications, inspect identity and medical certificates, and decide approvals."
      />

      {/* ── Status Pills & Search ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('PENDING')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filterStatus === 'PENDING'
                ? 'bg-[#0b1c33] text-[#f6f1e7]'
                : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('APPROVED')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filterStatus === 'APPROVED'
                ? 'bg-green-700 text-white'
                : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('REJECTED')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filterStatus === 'REJECTED'
                ? 'bg-red-700 text-white'
                : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" /> Rejected ({rejectedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filterStatus === 'ALL'
                ? 'bg-[#0b1c33] text-[#f6f1e7]'
                : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
            }`}
          >
            All Requests ({renewals.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Licence, NIC, Name…"
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* ── Renewals Table ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <RefreshCw className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-3 text-base font-semibold text-[#0b1c33]">No renewal requests found</p>
            <p className="mt-1 text-xs text-[#0b1c33]/60">
              {filterStatus === 'PENDING'
                ? 'All pending licence renewals have been reviewed.'
                : 'No renewal records match your active search filters.'}
            </p>
          </div>
        </Card>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Licence No.</Th>
              <Th>Applicant Particulars</Th>
              <Th>Class</Th>
              <Th>Fast-Track</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
              <Th>Decide / Review</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const isPending = r.status === 'PENDING';
              return (
                <tr key={r.id} className={r.oneDayService ? 'bg-amber-50/40' : ''}>
                  <Td className="font-mono text-xs font-bold text-[#0e7c7b]">#{r.id}</Td>
                  <Td>
                    <span className="font-mono text-sm font-bold text-[#0b1c33]">{r.licenseNumber}</span>
                  </Td>
                  <Td>
                    <p className="font-semibold text-sm text-[#0b1c33]">{r.fullName}</p>
                    <p className="text-xs text-stone-500">NIC: {r.nic} · {r.phone || 'No phone'}</p>
                  </Td>
                  <Td>
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-800">
                      {r.category}
                    </span>
                  </Td>
                  <Td>
                    {r.oneDayService ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                        ⚡ One-Day
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">Regular</span>
                    )}
                  </Td>
                  <Td>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        r.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : r.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : r.status === 'CANCELLED'
                          ? 'bg-stone-100 text-stone-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </Td>
                  <Td className="text-xs text-stone-500">{formatDate(r.createdAt)}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      {isPending ? (
                        <>
                          <Button size="sm" variant="gold" onClick={() => openReview(r, 'approve')}>
                            Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => openReview(r, 'reject')}>
                            Reject
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openReview(r, 'view')}>
                            Inspect
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => openReview(r, 'view')}>
                          View Details
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}

      {/* ── Detailed Review & Approval Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-bold text-[#0b1c33]">
                    Licence Renewal #{selected.id}
                  </h3>
                  <span className="font-mono text-sm font-bold bg-[#c6a15b]/20 text-[#8c6b2d] px-2 py-0.5 rounded">
                    {selected.licenseNumber}
                  </span>
                  {selected.oneDayService && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                      ⚡ One-Day Fast Track
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">Submitted: {formatDate(selected.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Applicant Particulars */}
            <div className="mt-4 rounded-xl bg-stone-50 p-4 border border-stone-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Applicant Information
              </h4>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <p><span className="text-stone-500">Full Name:</span> <strong>{selected.fullName}</strong></p>
                <p><span className="text-stone-500">National ID (NIC):</span> <strong>{selected.nic}</strong></p>
                <p><span className="text-stone-500">Licence Class:</span> <strong>Class {selected.category}</strong></p>
                <p><span className="text-stone-500">Contact Phone:</span> <strong>{selected.phone || 'N/A'}</strong></p>
                <p><span className="text-stone-500">Email Address:</span> <strong>{selected.email || 'N/A'}</strong></p>
                <p className="sm:col-span-2"><span className="text-stone-500">Address:</span> <strong>{selected.address || 'N/A'}</strong></p>
              </div>
            </div>

            {/* Uploaded Documents Inspection */}
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Uploaded Verification Documents
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                {/* NIC Document */}
                <div className="rounded-xl border border-stone-200 bg-white p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                      <FileText className="h-4 w-4 text-[#0e7c7b]" /> NIC Copy
                    </div>
                    <p className="mt-1 text-[11px] text-stone-400">Identification Proof</p>
                  </div>
                  {selected.nicCopyPath ? (
                    <a
                      href={getRenewalDocumentUrl(selected.nicCopyPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg bg-[#0e7c7b]/10 px-3 py-1.5 text-xs font-semibold text-[#0e7c7b] hover:bg-[#0e7c7b]/20 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View NIC ↗
                    </a>
                  ) : (
                    <span className="mt-3 text-[11px] text-stone-400 italic">No document file</span>
                  )}
                </div>

                {/* Passport Photo */}
                <div className="rounded-xl border border-stone-200 bg-white p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                      <Image className="h-4 w-4 text-[#c6a15b]" /> Passport Photo
                    </div>
                    <p className="mt-1 text-[11px] text-stone-400">Card Photo Standard</p>
                  </div>
                  {selected.photoPath ? (
                    <a
                      href={getRenewalDocumentUrl(selected.photoPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg bg-[#c6a15b]/20 px-3 py-1.5 text-xs font-semibold text-[#8c6b2d] hover:bg-[#c6a15b]/30 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Photo ↗
                    </a>
                  ) : (
                    <span className="mt-3 text-[11px] text-stone-400 italic">No photo file</span>
                  )}
                </div>

                {/* Medical Fitness Report */}
                <div className="rounded-xl border border-stone-200 bg-white p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                      <Stethoscope className="h-4 w-4 text-emerald-600" /> Medical Fitness
                    </div>
                    <p className="mt-1 text-[11px] text-stone-400">NTMI Medical Certificate</p>
                  </div>
                  {selected.medicalReportPath ? (
                    <a
                      href={getRenewalDocumentUrl(selected.medicalReportPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Medical ↗
                    </a>
                  ) : (
                    <span className="mt-3 text-[11px] text-stone-400 italic">No medical file</span>
                  )}
                </div>
              </div>
            </div>

            {/* Decision Status if already decided */}
            {selected.status === 'APPROVED' && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3.5 text-xs text-green-900">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-700" /> Approved by Registration Officer
                </p>
                {selected.officerNotes && <p className="mt-1">Officer Notes: "{selected.officerNotes}"</p>}
                <p className="mt-2 text-green-800 text-[11px]">
                  ✓ Licence validity extended for 8 years in the National Driver Registry.
                </p>
              </div>
            )}

            {selected.status === 'REJECTED' && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900">
                <p className="font-bold flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-700" /> Renewal Application Rejected
                </p>
                <p className="mt-1 font-semibold">Reason: {selected.rejectionReason || 'Requirements not met'}</p>
                {selected.officerNotes && <p className="mt-1">Officer Notes: "{selected.officerNotes}"</p>}
              </div>
            )}

            {/* Decision Form for Pending renewals */}
            {selected.status === 'PENDING' && (
              <div className="mt-5 border-t border-stone-200 pt-4 space-y-3">
                {modalMode === 'reject' ? (
                  <>
                    <div className="rounded-xl border border-red-200 bg-red-50/70 p-3">
                      <p className="text-xs font-bold text-red-800">Rejecting Renewal Application</p>
                      <p className="text-[11px] text-red-700">Please provide a clear justification for why this renewal cannot be granted.</p>
                    </div>
                    <Field label="Rejection Reason (Required — shown to applicant)" required>
                      <Input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Incomplete medical certificate / Expired identification document"
                      />
                    </Field>
                    <Field label="Additional Officer Notes">
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Internal notes or specific instructions for reapplication"
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-green-200 bg-green-50/70 p-3">
                      <p className="text-xs font-bold text-green-800">Approve & Renew Driving Licence</p>
                      <p className="text-[11px] text-green-700">Approving this request will automatically extend the validity of licence {selected.licenseNumber} by 8 years.</p>
                    </div>
                    <Field label="Officer Notes / Remarks">
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Verified against NTMI database and Department records."
                      />
                    </Field>
                  </>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
                    Cancel
                  </Button>

                  {modalMode === 'reject' ? (
                    <>
                      <Button type="button" variant="secondary" onClick={() => setModalMode('approve')}>
                        Switch to Approve
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={actionBusy || !rejectReason.trim()}
                        onClick={handleReject}
                      >
                        {actionBusy ? <Spinner /> : 'Confirm Rejection'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="danger" onClick={() => setModalMode('reject')}>
                        Switch to Reject
                      </Button>
                      <Button
                        type="button"
                        variant="gold"
                        disabled={actionBusy}
                        onClick={handleApprove}
                      >
                        {actionBusy ? <Spinner /> : 'Approve & Renew Licence'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
