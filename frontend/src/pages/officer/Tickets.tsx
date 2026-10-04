import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, PageHeader, Select, Spinner } from '../../components/ui';
import { getAllTicketsAPI, type BackendTicket } from '../../lib/api';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OfficerTickets() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<BackendTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');

  useEffect(() => {
    getAllTicketsAPI()
      .then((data) => setTickets(data))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  const filtered = tickets.filter((t) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'PENDING_REVIEW') return t.status === 'PENDING_REVIEW' || t.status === 'OPEN';
    return t.status === statusFilter;
  });

  const pendingCount = tickets.filter((t) => t.status === 'PENDING_REVIEW' || t.status === 'OPEN').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;
  const rejectedCount = tickets.filter((t) => t.status === 'REJECTED').length;

  return (
    <div>
      <PageHeader
        kicker="Administrative Queue"
        title="Profile Data Override Tickets"
        subtitle="Review post-12-hour profile correction requests, verify citizen evidence, and execute atomic overrides."
      />

      {/* Filter Tabs */}
      <div className="mt-4 mb-6 flex border-b border-[#0b1c33]/15">
        <button
          type="button"
          onClick={() => setStatusFilter('PENDING_REVIEW')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-semibold text-sm transition-colors ${
            statusFilter === 'PENDING_REVIEW'
              ? 'border-[#0e7c7b] text-[#0e7c7b]'
              : 'border-transparent text-[#0b1c33]/60 hover:text-[#0b1c33]'
          }`}
        >
          <span>Pending Review</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusFilter === 'PENDING_REVIEW' ? 'bg-[#0e7c7b]/15 text-[#0e7c7b]' : 'bg-stone-200 text-stone-700'}`}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('RESOLVED')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-semibold text-sm transition-colors ${
            statusFilter === 'RESOLVED'
              ? 'border-[#0e7c7b] text-[#0e7c7b]'
              : 'border-transparent text-[#0b1c33]/60 hover:text-[#0b1c33]'
          }`}
        >
          <span>Resolved / Overridden</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusFilter === 'RESOLVED' ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-700'}`}>
            {resolvedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('REJECTED')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-semibold text-sm transition-colors ${
            statusFilter === 'REJECTED'
              ? 'border-[#0e7c7b] text-[#0e7c7b]'
              : 'border-transparent text-[#0b1c33]/60 hover:text-[#0b1c33]'
          }`}
        >
          <span>Rejected</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusFilter === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-stone-200 text-stone-700'}`}>
            {rejectedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`border-b-2 px-6 py-3 font-semibold text-sm transition-colors ${
            statusFilter === 'all'
              ? 'border-[#0e7c7b] text-[#0e7c7b]'
              : 'border-transparent text-[#0b1c33]/60 hover:text-[#0b1c33]'
          }`}
        >
          All ({tickets.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-sm text-[#0b1c33]/60">
            No support tickets found in this category.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((t) => {
            const hasDocs = !!(t.nicCopyPath || t.birthCertificatePath || t.additionalDocPath);
            const isPending = t.status === 'PENDING_REVIEW' || t.status === 'OPEN';

            return (
              <Card key={t.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#0e7c7b]">{t.ticketNumber}</span>
                      <span className="text-xs text-[#0b1c33]/60">· Target App #{t.applicationId}</span>
                      {hasDocs && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                          📎 Evidence Attached
                        </span>
                      )}
                    </div>

                    <p className="mt-1 font-semibold text-base text-[#0b1c33]">
                      Applicant: {t.applicantName} <span className="font-normal text-xs text-stone-500">({t.applicantId})</span>
                    </p>
                    <p className="mt-1 text-sm text-[#0b1c33]/80">
                      Reason: <span className="italic">"{t.reason}"</span>
                    </p>
                    <p className="mt-1 text-xs text-[#0b1c33]/50">
                      Submitted on {formatDate(t.createdAt)} · Contact: {t.applicantEmail}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={t.status === 'RESOLVED' ? 'success' : t.status === 'REJECTED' ? 'danger' : 'warn'}>
                      {t.status.replace('_', ' ')}
                    </Badge>

                    <Button
                      size="sm"
                      variant={isPending ? 'gold' : 'secondary'}
                      onClick={() => nav(`/officer/tickets/${t.id}`)}
                    >
                      {isPending ? 'Review & Override →' : 'View Audit Details →'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
