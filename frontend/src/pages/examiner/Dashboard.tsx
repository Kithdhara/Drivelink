import { Link } from 'react-router-dom';
import { ClipboardCheck, CalendarDays } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { locById, useStore } from '../../lib/store';
import { todayISO } from '../../lib/utils';
import { Badge, Button, Card, PageHeader, StatCard } from '../../components/ui';

export default function ExaminerDashboard() {
  const { user } = useAuth();
  const { state } = useStore();
  const today = todayISO();
  const exams = state.exams.filter((e) => e.date === today && e.status === 'booked');
  const trials = state.trials.filter((e) => e.date === today && e.status === 'booked');
  const marked = [...state.exams, ...state.trials].filter((e) => e.examinerId === user?.id && e.status === 'completed');

  return (
    <div>
      <PageHeader
        kicker="Field desk"
        title="Driving Examiner"
        subtitle="Record written, computer and practical results against the published roll."
        actions={
          <Link to="/examiner/schedule">
            <Button>Open today’s roll</Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Exams today" value={exams.length} tone="ink" icon={<ClipboardCheck />} />
        <StatCard label="Trials today" value={trials.length} tone="gold" icon={<CalendarDays />} />
        <StatCard label="Results you recorded" value={marked.length} tone="teal" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Exam sittings today</h2>
          {exams.map((e) => (
            <p key={e.id} className="mt-2 flex justify-between text-sm">
              <span>
                {e.time} · {locById(state.locations, e.locationId)?.name}
              </span>
              <Badge>{e.kind}</Badge>
            </p>
          ))}
          {exams.length === 0 && <p className="mt-2 text-sm text-[#0b1c33]/50">No theory sittings booked today.</p>}
        </Card>
        <Card>
          <h2 className="font-display text-xl">Trials today</h2>
          {trials.map((e) => (
            <p key={e.id} className="mt-2 text-sm">
              {e.time} · {locById(state.locations, e.locationId)?.name}
            </p>
          ))}
          {trials.length === 0 && <p className="mt-2 text-sm text-[#0b1c33]/50">No practicals booked today.</p>}
        </Card>
      </div>
    </div>
  );
}
