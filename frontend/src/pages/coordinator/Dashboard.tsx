import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { locById, useStore } from '../../lib/store';
import { todayISO } from '../../lib/utils';
import { Badge, Button, Card, PageHeader, StatCard, TableWrap, Td, Th } from '../../components/ui';

export default function CoordinatorDashboard() {
  const { state } = useStore();
  const today = todayISO();
  const todays = state.schedules.filter((s) => s.date === today);
  const bookingsToday =
    state.exams.filter((e) => e.date === today && e.status === 'booked').length +
    state.trials.filter((e) => e.date === today && e.status === 'booked').length +
    state.medicals.filter((e) => e.date === today && e.status === 'booked').length;
  const full = state.schedules.filter((s) => s.booked >= s.capacity && s.date >= today).length;

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
        <StatCard label="Sessions today" value={todays.length} tone="ink" icon={<CalendarDays />} />
        <StatCard label="Booked heads today" value={bookingsToday} tone="teal" icon={<Users />} />
        <StatCard label="Full upcoming slots" value={full} tone="gold" icon={<MapPin />} />
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
            {todays.map((s) => (
              <tr key={s.id}>
                <Td className="capitalize">{s.type}{s.examKind ? ` · ${s.examKind}` : ''}</Td>
                <Td>{locById(state.locations, s.locationId)?.name}</Td>
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
