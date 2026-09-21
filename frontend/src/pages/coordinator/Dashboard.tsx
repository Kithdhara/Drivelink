import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { todayISO } from '../../lib/utils';
import { Badge, Button, Card, PageHeader, StatCard, TableWrap, Td, Th } from '../../components/ui';
import { 
  getAllSlotsAPI, getAllExamsAPI, getAllTrialsAPI, getAllMedicalsAPI,
  type BackendTimeSlot, type BackendExamBooking, type BackendTrialBooking, type BackendMedicalAppointment 
} from '../../lib/api';

export default function CoordinatorDashboard() {
  const [slots, setSlots] = useState<BackendTimeSlot[]>([]);
  const [exams, setExams] = useState<BackendExamBooking[]>([]);
  const [trials, setTrials] = useState<BackendTrialBooking[]>([]);
  const [medicals, setMedicals] = useState<BackendMedicalAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const today = todayISO();

  useEffect(() => {
    Promise.all([
      getAllSlotsAPI(),
      getAllExamsAPI(),
      getAllTrialsAPI(),
      getAllMedicalsAPI(),
    ]).then(([s, e, t, m]) => {
      setSlots(s);
      setExams(e);
      setTrials(t);
      setMedicals(m);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const todays = slots.filter((s) => s.date === today);
  const bookingsToday =
    exams.filter((e) => e.date === today && e.status !== 'CANCELLED').length +
    trials.filter((e) => e.date === today && e.status !== 'CANCELLED').length +
    medicals.filter((e) => e.date === today && e.status !== 'CANCELLED').length;
  const full = slots.filter((s) => s.booked >= s.capacity && s.date >= today).length;

  return (
    <div>
      <PageHeader
        kicker="Test operations"
        title="Driving Test Coordinator"
        subtitle="Publish sittings, watch live capacity and handle reschedules."
        actions={
          <Link to="/coordinator/schedules">
            <Button variant="gold">Manage schedules</Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sessions today" value={loading ? '...' : todays.length} tone="ink" icon={<CalendarDays />} />
        <StatCard label="Booked heads today" value={loading ? '...' : bookingsToday} tone="teal" icon={<Users />} />
        <StatCard label="Full upcoming slots" value={loading ? '...' : full} tone="gold" icon={<MapPin />} />
      </div>
      <Card className="mt-6" pad={false}>
        <div className="px-5 py-4">
          <h2 className="font-display text-xl">Today’s timetable</h2>
        </div>
        <TableWrap>
          <thead>
            <tr>
              <Th>Type</Th>
              <Th>Location</Th>
              <Th>Time</Th>
              <Th>Load</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><Td colSpan={4} className="text-center text-sm py-4">Loading data...</Td></tr>
            ) : todays.length === 0 ? (
              <tr><Td colSpan={4} className="text-center text-sm py-4">No sessions scheduled for today.</Td></tr>
            ) : todays.map((s) => (
              <tr key={s.id}>
                <Td className="capitalize font-semibold text-[#0b1c33]">{s.type}</Td>
                <Td>{s.centreName}</Td>
                <Td>
                  {s.startTime}–{s.endTime}
                </Td>
                <Td>
                  <Badge tone={s.booked >= s.capacity ? 'danger' : 'success'}>
                    {s.booked}/{s.capacity}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
