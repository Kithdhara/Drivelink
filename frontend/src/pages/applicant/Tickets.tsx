import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Badge, Button, Card, PageHeader, Spinner } from '../../components/ui';
import {
  getTicketsByApplicantAPI,
  type BackendTicket,
} from '../../lib/api';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ApplicantTickets() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<BackendTicket[]>([]);

  useEffect(() => {
    if (!user) return;
    getTicketsByApplicantAPI(user.id)
      .then((data) => setTickets(data))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          kicker="Administrative Support"
          title="Profile Correction Tickets"
          subtitle="Track requests for post-12-hour profile corrections and administrative overrides."
        />
        <Button variant="gold" onClick={() => nav('/app/tickets/new')}>
          + Raise New Ticket
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <p className="text-base font-semibold text-[#0b1c33]">No Support Tickets Raised</p>
              <p className="mt-1 text-xs text-[#0b1c33]/60">
                If your application details are locked after 12 hours and require official corrections, you can submit a support ticket with supporting evidence.
              </p>
              <div className="mt-4">
                <Button variant="gold" size="sm" onClick={() => nav('/app/tickets/new')}>
                  Raise Correction Ticket
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          tickets.map((t) => {
            const isResolved = t.status === 'RESOLVED';
            const isRejected = t.status === 'REJECTED';
            const isPending = t.status === 'PENDING_REVIEW' || t.status === 'OPEN';

            return (
              <Card key={t.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#0e7c7b]">{t.ticketNumber}</span>
                      <span className="text-xs text-[#0b1c33]/50">· Application #{t.applicationId}</span>
                    </div>
                    <p className="mt-1 font-semibold text-base text-[#0b1c33]">{t.reason}</p>
                    <p className="mt-1 text-xs text-[#0b1c33]/60">
                      Submitted: {formatDate(t.createdAt)}
                    </p>
                  </div>

                  <div>
                    <Badge tone={isResolved ? 'success' : isRejected ? 'danger' : 'warn'}>
                      {t.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Requested changes summary */}
                <div className="mt-3 rounded-lg bg-stone-50 p-3 text-xs text-[#0b1c33]">
                  <p className="font-semibold text-stone-700">Requested Corrections:</p>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    {t.requestedFullName && (
                      <p>
                        <span className="text-stone-500">Name:</span> <strong>{t.requestedFullName}</strong>
                      </p>
                    )}
                    {t.requestedNic && (
                      <p>
                        <span className="text-stone-500">NIC:</span> <strong>{t.requestedNic}</strong>
                      </p>
                    )}
                    {t.requestedDateOfBirth && (
                      <p>
                        <span className="text-stone-500">DOB:</span> <strong>{t.requestedDateOfBirth.slice(0, 10)}</strong>
                      </p>
                    )}
                    {t.requestedGender && (
                      <p>
                        <span className="text-stone-500">Gender:</span> <strong>{t.requestedGender}</strong>
                      </p>
                    )}
                    {t.requestedPhone && (
                      <p>
                        <span className="text-stone-500">Phone:</span> <strong>{t.requestedPhone}</strong>
                      </p>
                    )}
                    {t.requestedEmail && (
                      <p>
                        <span className="text-stone-500">Email:</span> <strong>{t.requestedEmail}</strong>
                      </p>
                    )}
                    {t.requestedBloodGroup && (
                      <p>
                        <span className="text-stone-500">Blood Group:</span> <strong>{t.requestedBloodGroup}</strong>
                      </p>
                    )}
                    {t.requestedAddress && (
                      <p className="sm:col-span-2">
                        <span className="text-stone-500">Address:</span> <strong>{t.requestedAddress}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Resolution or Rejection note */}
                {isResolved && (
                  <div className="mt-3 rounded-lg border border-green-600/20 bg-green-50/70 p-3 text-xs text-green-900">
                    <p className="font-semibold text-green-800">
                      ✓ Resolved by Registration Officer: {t.officerName || t.officerId || 'Authorized Officer'}
                    </p>
                    {t.officerNotes && <p className="mt-1">"{t.officerNotes}"</p>}
                    {t.newApplicationId && (
                      <div className="mt-2 flex items-center gap-2">
                        <span>New Verified Application ID:</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => nav(`/app/applications/${t.newApplicationId}`)}
                        >
                          View Application #{t.newApplicationId} →
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isRejected && (
                  <div className="mt-3 rounded-lg border border-red-600/20 bg-red-50/70 p-3 text-xs text-red-900">
                    <p className="font-semibold text-red-800">
                      ✗ Rejected by Officer: {t.officerName || t.officerId || 'Authorized Officer'}
                    </p>
                    <p className="mt-1">Reason: {t.officerNotes || 'Insufficient supporting documentation or invalid request.'}</p>
                  </div>
                )}

                {isPending && (
                  <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg">
                    ⏳ Under review by Registration Officers. You will be notified once evidence is verified.
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
