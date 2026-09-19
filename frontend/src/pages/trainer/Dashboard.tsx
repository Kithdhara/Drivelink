import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, CalendarDays } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getTraineesByTrainerAPI, type TraineeRecordDTO } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button, Card, PageHeader, StatCard } from '../../components/ui';

export default function TrainerDashboard() {
  const { user } = useAuth();
  const [assigned, setAssigned] = useState<TraineeRecordDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTraineesByTrainerAPI(user.id)
      .then(setAssigned)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

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
        <StatCard label="Progress notes" value={assigned.reduce((acc, a) => acc + (a.notes ? 1 : 0), 0)} tone="ink" />
        <StatCard label="Diary slots" value={0} tone="gold" icon={<CalendarDays />} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl mb-3">Assigned applicants</h2>
          {loading ? (
            <div className="animate-pulse flex flex-col gap-2">
              <div className="h-4 bg-stone-100 rounded w-full"></div>
              <div className="h-4 bg-stone-100 rounded w-2/3"></div>
            </div>
          ) : assigned.length > 0 ? (
            assigned.slice(0, 6).map((a) => (
              <p key={a.trainerBookingId} className="mt-2 flex justify-between text-sm">
                <span className="font-semibold text-[#0b1c33]">
                  {a.applicantName} <span className="font-normal text-[#0b1c33]/50 ml-2">{a.applicantId}</span>
                </span>
                <span className="text-[#0b1c33]/60 text-xs uppercase tracking-wider font-bold">
                  {a.status}
                </span>
              </p>
            ))
          ) : (
            <p className="mt-2 text-sm text-[#0b1c33]/50">No department assignments yet.</p>
          )}
        </Card>
        <Card>
          <h2 className="font-display text-xl mb-3">Upcoming diary</h2>
          <p className="mt-2 text-sm text-[#0b1c33]/50">Trainer diary schedules integration coming soon.</p>
        </Card>
      </div>
    </div>
  );
}
