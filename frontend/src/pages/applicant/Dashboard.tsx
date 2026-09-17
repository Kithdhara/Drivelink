import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CreditCard,
  FilePlus2,
  Bell,
  Download,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { formatDate, formatMoney } from '../../lib/utils';
import { getApplicationsByApplicantAPI, type BackendApplication } from '../../lib/api';
import {
  Button,
  Card,
  Empty,
  PageHeader,
  StatCard,
} from '../../components/ui';

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const { state } = useStore();
  if (!user) return null;

  // Real applications from backend
  const [apps, setApps] = useState<BackendApplication[]>([]);
  useEffect(() => {
    getApplicationsByApplicantAPI(user.id)
      .then(setApps)
      .catch(() => {});
  }, [user.id]);

  const latest = apps[0];
  const upcoming = [
    ...state.medicals.filter((m) => m.applicantId === user.id && m.status === 'booked'),
    ...state.exams.filter((m) => m.applicantId === user.id && m.status === 'booked'),
    ...state.trials.filter((m) => m.applicantId === user.id && m.status === 'booked'),
  ].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const unread = state.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const paid = state.payments.filter((p) => p.userId === user.id && p.status === 'paid');
  const licences = state.licenses.filter((l) => l.applicantId === user.id);

  return (
    <div>
      <PageHeader
        kicker={`Good day, ${user.name.split(' ')[0]}`}
        title="Your licence workspace"
        subtitle="Track every stage from first submission to the printed card."
        actions={
          <>
            <Link to="/app/apply">
              <Button variant="gold">
                <FilePlus2 className="h-4 w-4" /> New application
              </Button>
            </Link>
            <Link to="/app/renew">
              <Button variant="secondary">Renew</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={apps.length} hint="All files under your NIC" tone="ink" icon={<FilePlus2 />} />
        <StatCard label="Upcoming bookings" value={upcoming.length} hint="Medical, exam or trial" tone="teal" icon={<CalendarDays />} />
        <StatCard label="Unread notices" value={unread} hint="Approvals and reminders" tone="gold" icon={<Bell />} />
        <StatCard
          label="Fees paid"
          value={formatMoney(paid.reduce((s, p) => s + p.amount, 0))}
          hint={`${paid.length} receipts`}
          tone="rose"
          icon={<CreditCard />}
        />
      </div>

      {latest ? (
        <Card className="mt-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#c6a15b] uppercase">Current file</p>
              <h2 className="font-display text-2xl">#{latest.id} · {latest.licenseClasses}</h2>
              <p className="text-sm text-[#0b1c33]/60">
                Submitted {formatDate(latest.submittedAt)} · updated {formatDate(latest.updatedAt)}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              latest.status === 'approved' ? 'bg-green-100 text-green-800' :
              latest.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>{latest.status}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/app/applications/${latest.id}`}>
              <Button>Open tracker</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="mt-6">
          <Empty
            title="No applications yet"
            hint="Start a new licence file or request a renewal if you already hold a class."
            action={
              <Link to="/app/apply">
                <Button>Begin application</Button>
              </Link>
            }
          />
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-xl">Upcoming appointments</h3>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-[#0b1c33]/55">Nothing booked. Slots open once your file reaches the relevant stage.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#0b1c33]/8">
              {upcoming.slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-semibold">{b.date} · {b.time}</span>
                  <span className="text-[#0b1c33]/55">{b.applicationId}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="font-display text-xl">Issued licences</h3>
          {licences.length === 0 ? (
            <p className="mt-3 text-sm text-[#0b1c33]/55">No active licence on file yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {licences.map((l) => (
                <li key={l.id} className="flex items-center justify-between rounded-xl bg-[#f6f1e7] px-3 py-3">
                  <div>
                    <p className="font-semibold">{l.licenseNumber}</p>
                    <p className="text-xs text-[#0b1c33]/55">
                      Class {l.category} · expires {formatDate(l.expiresAt)}
                    </p>
                  </div>
                  <Link to={`/app/applications/${l.applicationId}`}>
                    <Button size="sm" variant="secondary">
                      <Download className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="font-display text-xl">All applications</h3>
        {apps.length === 0 ? (
          <p className="mt-2 text-sm text-[#0b1c33]/55">No applications yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-[#0b1c33]/8">
            {apps.map((a) => (
              <Link key={a.id} to={`/app/applications/${a.id}`} className="flex items-center justify-between py-3 hover:bg-[#f6f1e7]/60">
                <div>
                  <p className="font-semibold">
                    #{a.id} · {a.licenseClasses}
                  </p>
                  <p className="text-xs text-[#0b1c33]/55">
                    Submitted {formatDate(a.submittedAt)}
                    {a.oneDayService ? ' · One-Day' : ''}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                  a.status === 'approved' ? 'bg-green-100 text-green-800' :
                  a.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>{a.status}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
