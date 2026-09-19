import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Alert, Badge, Button, Card, PageHeader, Select, Spinner } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { isWithin12Hours, remainingEditHours } from '../../lib/utils';
import { Clock, History, LifeBuoy } from 'lucide-react';
import {
  bookMedicalAPI,
  cancelMedicalAPI,
  getAvailableSlotsAPI,
  getAllCentresAPI,
  getMedicalsByApplicantAPI,
  rescheduleMedicalAPI,
  type BackendMedicalAppointment,
  type BackendTimeSlot,
  type BackendCentre,
} from '../../lib/api';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BookMedical() {
  const { user } = useAuth();
  const toast = useToast();
  const [showCancelled, setShowCancelled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<BackendTimeSlot[]>([]);
  const [centres, setCentres] = useState<BackendCentre[]>([]);
  const [bookings, setBookings] = useState<BackendMedicalAppointment[]>([]);
  const [city, setCity] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (!user) return;
    Promise.all([
      getAvailableSlotsAPI('MEDICAL').catch(() => []),
      getAllCentresAPI().catch(() => []),
      getMedicalsByApplicantAPI(user.id).catch(() => []),
    ]).then(([s, c, b]) => {
      setSlots(s);
      setCentres(c);
      setBookings(b);
    }).finally(() => setLoading(false));
  }, [user]);

  const cities = useMemo(() => {
    const fromCentres = centres.map((c) => c.city).filter(Boolean);
    const fromSlots = slots.map((s) => s.city).filter(Boolean) as string[];
    const combined = [...new Set([...fromCentres, ...fromSlots, 'Colombo', 'Werahera', 'Nugegoda', 'Gampaha', 'Kandy', 'Kurunegala', 'Galle'])];
    return combined.sort();
  }, [centres, slots]);

  // Show filtered slots by city & date
  const allFilteredSlots = useMemo(() => {
    return slots
      .filter((s) => {
        if (city !== 'all') {
          const slotCity = s.city || centres.find((c) => c.id === s.centreId)?.city || '';
          const nameLower = (s.centreName || '').toLowerCase();
          const matches = slotCity.toLowerCase() === city.toLowerCase() || nameLower.includes(city.toLowerCase());
          if (!matches) return false;
        }
        if (dateFilter && s.date !== dateFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [slots, centres, city, dateFilter]);

  if (!user) return null;

  async function book(slotId: number) {
    if (!user) return;
    setBusy(true);
    setErr('');
    try {
      if (rescheduleId) {
        await rescheduleMedicalAPI(rescheduleId, slotId);
        toast.success('Appointment rescheduled successfully.');
        setMsg('Appointment moved to the new slot.');
      } else {
        await bookMedicalAPI({ applicantId: user.id, slotId });
        toast.success('Medical appointment booked successfully.');
        setMsg('Appointment booked. Please arrive 15 minutes before your time slot with your NIC.');
      }
      setRescheduleId(null);
      // Refresh data
      const [newSlots, newBookings] = await Promise.all([
        getAvailableSlotsAPI('MEDICAL').catch(() => []),
        getMedicalsByApplicantAPI(user.id).catch(() => []),
      ]);
      setSlots(newSlots);
      setBookings(newBookings);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(id: number) {
    if (!user) return;
    try {
      await cancelMedicalAPI(id);
      toast.success('Medical appointment cancelled successfully.');
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
      // Refresh slots
      const newSlots = await getAvailableSlotsAPI('MEDICAL').catch(() => []);
      setSlots(newSlots);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Cancellation failed');
    }
    setConfirmCancel(null);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <PageHeader
        kicker="Fitness to drive"
        title="Medical examination"
        subtitle="Book a medical test at an available centre. You must pass this before applying for a licence."
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <div className="mt-3"><Alert kind="error">{err}</Alert></div>}

      {/* Filter by City & Date */}
      <div className="mt-5">
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide uppercase text-[#0b1c33]/70">Centre City</p>
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="all">All cities</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide uppercase text-[#0b1c33]/70">Filter by Date</p>
                {dateFilter && (
                  <button
                    type="button"
                    onClick={() => setDateFilter('')}
                    className="text-xs font-medium text-[#0e7c7b] hover:underline"
                  >
                    Clear date
                  </button>
                )}
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-xl border border-[#0b1c33]/15 bg-white px-3 py-2 text-sm focus:border-[#0e7c7b] focus:outline-none"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Bookings Section with 12h Policy & History Toggle */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl">Your medical bookings</h2>
        {bookings.some((b) => b.status === 'CANCELLED') && (
          <button
            type="button"
            onClick={() => setShowCancelled(!showCancelled)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#0b1c33]/15 bg-white px-3 py-1 text-xs font-semibold text-[#0b1c33]/70 hover:bg-[#0b1c33]/5 transition"
          >
            <History className="h-3.5 w-3.5" />
            {showCancelled
              ? 'Hide cancelled history'
              : `Show cancelled history (${bookings.filter((b) => b.status === 'CANCELLED').length})`}
          </button>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {bookings.filter((b) => b.status !== 'CANCELLED').length === 0 && (
          <p className="text-sm text-[#0b1c33]/55">
            {bookings.some((b) => b.status === 'CANCELLED')
              ? 'No active bookings. (Cancelled appointments hidden in history above).'
              : 'None yet. Book a slot below.'}
          </p>
        )}

        {bookings
          .filter((b) => b.status !== 'CANCELLED')
          .map((b) => {
            const within12 = isWithin12Hours(b.createdAt);
            const hoursLeft = remainingEditHours(b.createdAt);

            return (
              <Card key={b.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {formatDate(b.date)} · {b.timeSlot} · {b.centreName}
                    </p>
                    <p className="text-sm text-[#0b1c33]/55">
                      Status: <span className="font-semibold">{b.status}</span>
                      {b.result ? ` · Result: ${b.result}` : ''}
                    </p>
                    {b.remarks && <p className="mt-1 text-sm">{b.remarks}</p>}
                  </div>

                  {b.status === 'BOOKED' && (
                    within12 ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setRescheduleId(b.id)}
                        >
                          Reschedule
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setConfirmCancel(b.id)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                          <Clock className="h-3.5 w-3.5" /> 12h window expired
                        </span>
                        <Link to="/app/tickets/new">
                          <Button size="sm" variant="secondary" className="text-xs">
                            <LifeBuoy className="h-3.5 w-3.5 mr-1" /> Raise Ticket
                          </Button>
                        </Link>
                      </div>
                    )
                  )}
                </div>

                {b.status === 'BOOKED' && within12 && (
                  <p className="mt-2 text-[11px] text-[#0e7c7b]">
                    ℹ️ Self-service changes allowed within 12 hours of booking ({hoursLeft}h remaining).
                  </p>
                )}

                {rescheduleId === b.id && (
                  <p className="mt-2 text-xs font-semibold text-[#b45309]">
                    Select a new slot below to move this appointment.
                  </p>
                )}
              </Card>
            );
          })}

        {/* Cancelled Bookings history drawer */}
        {showCancelled && (
          <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Cancelled Appointments History
            </p>
            {bookings
              .filter((b) => b.status === 'CANCELLED')
              .map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white p-3 text-sm opacity-80"
                >
                  <div>
                    <p className="font-medium text-stone-700">
                      {formatDate(b.date)} · {b.timeSlot} · {b.centreName}
                    </p>
                    <p className="text-xs text-stone-400">
                      Cancelled record retained for official audit trail
                    </p>
                  </div>
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
                    CANCELLED
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <h2 className="mt-8 font-display text-2xl">{rescheduleId ? 'Choose a new slot' : 'Available slots'}</h2>
      {allFilteredSlots.length === 0 && (
        <p className="mt-3 text-sm text-[#0b1c33]/55">No slots available. Contact the coordinator to add time slots.</p>
      )}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {allFilteredSlots.map((s) => {
          const full = s.booked >= s.capacity;
          const left = s.capacity - s.booked;
          return (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{s.centreName}</p>
                  <p className="text-sm text-[#0b1c33]/55">
                    {formatDate(s.date)} · {s.startTime}–{s.endTime}
                  </p>
                </div>
                <Badge tone={full ? 'danger' : left <= 2 ? 'warn' : 'success'}>
                  {full ? 'Full' : `${left} open`}
                </Badge>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0b1c33]/8">
                <div
                  className="h-full bg-[#0e7c7b]"
                  style={{ width: `${Math.min(100, (s.booked / s.capacity) * 100)}%` }}
                />
              </div>
              <Button className="mt-3" size="sm" disabled={full || busy} onClick={() => book(s.id)}>
                {busy ? <Spinner /> : rescheduleId ? 'Move here' : 'Book this slot'}
              </Button>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel medical appointment?"
        message="This action cannot be undone. Your appointment slot will be released for other applicants."
        confirmLabel="Yes, cancel it"
        variant="danger"
        onConfirm={() => confirmCancel && handleCancel(confirmCancel)}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
}
