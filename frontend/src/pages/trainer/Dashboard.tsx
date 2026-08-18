import { Link } from 'react-router-dom';
import { GraduationCap, CalendarDays } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import { Button, Card, PageHeader, StatCard } from '../../components/ui';

export default function TrainerDashboard() {
  const { user } = useAuth();
  const { state } = useStore();
  if (!user) return null;
  const assigned = state.applications.filter((a) => a.trainerId === user.id);
  const notes = state.trainingNotes.filter((n) => n.trainerId === user.id);
  const slots = state.trainerSchedules.filter((s) => s.trainerId === user.id);

  return (
    <div>
      <PageHeader
        kicker="Instruction"
        title="Driving Trainer"
        subtitle="Follow assigned applicants, log progress and keep your own diary."
        actions={
          <Link to="/trainer/trainees">
            <Button>Open trainee list</Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Assigned trainees" value={assigned.length} tone="teal" icon={<GraduationCap />} />
        <StatCard label="Progress notes" value={notes.length} tone="ink" />
        <StatCard label="Diary slots" value={slots.length} tone="gold" icon={<CalendarDays />} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Assigned applicants</h2>
          {assigned.map((a) => (
            <p key={a.id} className="mt-2 flex justify-between text-sm">
              <span>
                {a.personal.fullName} · {a.id}
              </span>
              <span className="text-[#0b1c33]/50">{a.status.replace(/_/g, ' ')}</span>
            </p>
          ))}
          {assigned.length === 0 && <p className="mt-2 text-sm text-[#0b1c33]/50">No department assignments yet.</p>}
        </Card>
        <Card>
          <h2 className="font-display text-xl">Upcoming diary</h2>
          {slots
            .slice()
            .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
            .slice(0, 6)
            .map((s) => (
              <p key={s.id} className="mt-2 text-sm">
                {formatDate(s.date)} {s.startTime}–{s.endTime} {s.notes ? `· ${s.notes}` : ''}
              </p>
            ))}
        </Card>
      </div>
    </div>
  );
}
