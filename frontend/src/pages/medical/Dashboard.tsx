import { Link } from 'react-router-dom';
import { HeartPulse, ShieldAlert } from 'lucide-react';
import { useStore } from '../../lib/store';
import { todayISO } from '../../lib/utils';
import { Button, Card, PageHeader, StatCard } from '../../components/ui';

export default function MedicalDashboard() {
  const { state } = useStore();
  const today = todayISO();
  const todays = state.medicals.filter((m) => m.date === today);
  const pending = todays.filter((m) => m.status === 'booked');
  const failed = state.medicals.filter((m) => m.result === 'fail').length;
  const passed = state.medicals.filter((m) => m.result === 'pass').length;

  return (
    <div>
      <PageHeader
        kicker="Occupational health"
        title="Medical Officer"
        subtitle="Record vision, hearing and fitness findings against the day’s list."
        actions={
          <Link to="/medical/appointments">
            <Button>Open clinic list</Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clinic today" value={todays.length} tone="ink" icon={<HeartPulse />} />
        <StatCard label="Awaiting result" value={pending.length} tone="gold" />
        <StatCard label="Passed (all time)" value={passed} tone="teal" />
        <StatCard label="Flagged unfit" value={failed} tone="rose" icon={<ShieldAlert />} />
      </div>
      <Card className="mt-6">
        <h2 className="font-display text-xl">Today’s appointments</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-[#0b1c33]/55">No outstanding medicals for today.</p>
        ) : (
          pending.map((m) => {
            const u = state.users.find((x) => x.id === m.applicantId);
            return (
              <p key={m.id} className="mt-2 text-sm">
                {m.time} · {u?.name} · {m.applicationId}
              </p>
            );
          })
        )}
      </Card>
    </div>
  );
}
