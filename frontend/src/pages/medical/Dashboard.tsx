import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldAlert, Clock, MapPin, User, Activity, CheckCircle2 } from 'lucide-react';
import { getAllMedicalsAPI, type BackendMedicalAppointment } from '../../lib/api';
import { Button, Card, PageHeader, Spinner, StatCard, Badge } from '../../components/ui';
import { shortId } from '../../lib/utils';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

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
    <div className="space-y-6">
      <PageHeader
        kicker="Occupational health"
        title="Medical Officer Dashboard"
        subtitle="Overview of daily clinic activities, pending examinations, and health assessments."
        actions={
          <Link to="/medical/appointments">
            <Button variant="gold" className="shadow-lg hover:shadow-xl transition-all">
              <Activity className="h-4 w-4 mr-2" />
              Open Clinic List
            </Button>
          </Link>
        }
      />
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clinic today" value={todays.length} tone="ink" icon={<HeartPulse />} />
        <StatCard label="Awaiting result" value={pending.length} tone="gold" icon={<Clock />} />
        <StatCard label="Passed (all time)" value={passed} tone="teal" icon={<CheckCircle2 />} />
        <StatCard label="Flagged unfit" value={failed} tone="rose" icon={<ShieldAlert />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2 text-[#0b1c33]">
            <Clock className="h-5 w-5 text-[#c6a15b]" /> Pending Appointments
          </h2>
          {pending.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center opacity-80 border-dashed border-2 border-[#0b1c33]/10">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
              <p className="text-lg font-semibold text-[#0b1c33]">All caught up!</p>
              <p className="text-sm text-[#0b1c33]/60 mt-1">There are no outstanding medical examinations at the moment.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {pending.slice(0, 6).map((m) => (
                <Card key={m.id} className="hover:border-[#c6a15b]/50 transition-colors group cursor-default">
                  <div className="flex justify-between items-start mb-4">
                    <Badge tone="warn">Pending Exam</Badge>
                    <span className="text-xs font-mono text-[#0b1c33]/40 bg-[#0b1c33]/5 px-2 py-1 rounded">#{m.id}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-[#0b1c33]">
                      <User className="h-4 w-4 text-[#0e7c7b]" />
                      <span className="font-semibold">Applicant: {shortId(m.applicantId, 'APT')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#0b1c33]/70">
                      <Clock className="h-4 w-4 text-[#c6a15b]" />
                      <span>{formatDate(m.date)} at {m.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#0b1c33]/70">
                      <MapPin className="h-4 w-4 text-[#0b1c33]/40" />
                      <span>{m.centreName}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#0b1c33]/5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to="/medical/appointments" className="text-xs font-bold text-[#c6a15b] hover:underline flex items-center justify-end gap-1">
                      Proceed to Examination <Activity className="h-3 w-3" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {pending.length > 6 && (
            <div className="text-center pt-4">
              <Link to="/medical/appointments">
                <Button variant="ghost" size="sm">View all {pending.length} pending appointments →</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2 text-[#0b1c33] opacity-60">
            <HeartPulse className="h-5 w-5" /> Today's Clinic
          </h2>
          <Card className="bg-gradient-to-br from-[#0b1c33] to-[#1a2f4c] text-white">
            <div className="mb-6">
              <p className="text-white/60 text-sm mb-1 uppercase tracking-wider font-semibold">Scheduled for Today</p>
              <p className="text-4xl font-display text-[#c6a15b]">{todays.length}</p>
              <p className="text-sm text-white/80 mt-2">Total applicants booked for {formatDate(today)}</p>
            </div>
            <div className="space-y-3">
              <div className="bg-white/10 p-3 rounded-lg flex justify-between items-center">
                <span className="text-sm text-white/80">Completed Today</span>
                <span className="font-bold">{todays.filter(m => m.status === 'COMPLETED').length}</span>
              </div>
              <div className="bg-white/10 p-3 rounded-lg flex justify-between items-center">
                <span className="text-sm text-white/80">Remaining Today</span>
                <span className="font-bold text-[#c6a15b]">{todays.filter(m => m.status === 'BOOKED').length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
