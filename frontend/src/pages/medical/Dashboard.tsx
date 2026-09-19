import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldAlert } from 'lucide-react';
import { getAllMedicalsAPI, type BackendMedicalAppointment } from '../../lib/api';
import { Button, Card, PageHeader, Spinner, StatCard } from '../../components/ui';

export default function MedicalDashboard() {
  const [all, setAll] = useState<BackendMedicalAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllMedicalsAPI()
      .then(setAll)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todays = all.filter((m) => m.date === today);
  const pending = all.filter((m) => m.status === 'BOOKED');
  const failed = all.filter((m) => m.result === 'FAIL').length;
  const passed = all.filter((m) => m.result === 'PASS').length;

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <PageHeader
        kicker="Occupational health"
        title="Medical Officer"
        subtitle="Record vision, hearing and fitness findings against the day's list."
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
        <h2 className="font-display text-xl">Today's appointments</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-[#0b1c33]/55">No outstanding medicals.</p>
        ) : (
          pending.map((m) => (
            <p key={m.id} className="mt-2 text-sm">
              {m.timeSlot} · {m.centreName} · Applicant: {m.applicantId}
            </p>
          ))
        )}
      </Card>
    </div>
  );
}
