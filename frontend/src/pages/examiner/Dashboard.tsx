import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, CalendarDays } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getAllExamsAPI, getAllTrialsAPI, type BackendExamBooking, type BackendTrialBooking } from '../../lib/api';
import { Button, Card, PageHeader, Spinner, StatCard } from '../../components/ui';

export default function ExaminerDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState<BackendExamBooking[]>([]);
  const [trials, setTrials] = useState<BackendTrialBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllExamsAPI().catch(() => []),
      getAllTrialsAPI().catch(() => []),
    ]).then(([e, t]) => {
      setExams(e);
      setTrials(t);
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayExams = exams.filter((e) => e.date === today && e.status === 'BOOKED');
  const todayTrials = trials.filter((t) => t.date === today && t.status === 'BOOKED');
  const marked = [...exams, ...trials].filter((e) => e.examinerId === user?.id && e.status === 'COMPLETED');

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <PageHeader
        kicker="Field desk"
        title="Driving Examiner"
        subtitle="Record written, computer and practical results against the published roll."
        actions={
          <Link to="/examiner/schedule">
            <Button>Open today's roll</Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Exams today" value={todayExams.length} tone="ink" icon={<ClipboardCheck />} />
        <StatCard label="Trials today" value={todayTrials.length} tone="gold" icon={<CalendarDays />} />
        <StatCard label="Results you recorded" value={marked.length} tone="teal" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Exam sittings today</h2>
          {todayExams.map((e) => (
            <p key={e.id} className="mt-2 text-sm">
              {e.timeSlot} · {e.centreName} · Applicant: {e.applicantId}
            </p>
          ))}
          {todayExams.length === 0 && <p className="mt-2 text-sm text-[#0b1c33]/50">No theory sittings booked today.</p>}
        </Card>
        <Card>
          <h2 className="font-display text-xl">Trials today</h2>
          {todayTrials.map((t) => (
            <p key={t.id} className="mt-2 text-sm">
              {t.timeSlot} · {t.centreName} · Applicant: {t.applicantId}
            </p>
          ))}
          {todayTrials.length === 0 && <p className="mt-2 text-sm text-[#0b1c33]/50">No practicals booked today.</p>}
        </Card>
      </div>
    </div>
  );
}
