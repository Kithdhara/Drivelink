import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Alert, Badge, Button, Card, PageHeader, Select, Spinner } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { isWithin12Hours, remainingEditHours } from '../../lib/utils';
import { Clock, History, LifeBuoy } from 'lucide-react';
import {
  bookExamAPI,
  cancelExamAPI,
  getAvailableSlotsAPI,
  getAllCentresAPI,
  getExamsByApplicantAPI,
  getApplicationsByApplicantAPI,
  rescheduleExamAPI,
  type BackendExamBooking,
  type BackendTimeSlot,
  type BackendApplication,
  type BackendCentre,
} from '../../lib/api';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BookExam() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [showCancelled, setShowCancelled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<BackendTimeSlot[]>([]);
  const [centres, setCentres] = useState<BackendCentre[]>([]);
  const [bookings, setBookings] = useState<BackendExamBooking[]>([]);
  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [city, setCity] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const [latestApp, setLatestApp] = useState<BackendApplication | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getAvailableSlotsAPI('EXAM').catch(() => []),
      getAllCentresAPI().catch(() => []),
      getExamsByApplicantAPI(user.id).catch(() => []),
      getApplicationsByApplicantAPI(user.id).catch(() => []),
    ]).then(([s, c, e, apps]) => {
      setSlots(s);
      setCentres(c);
      setBookings(e);
      if (apps.length > 0) setLatestApp(apps[0]);
      // Eligible for exam: Officer has approved the application or previous exam failed
      const eligible = apps.find((a) =>
        ['approved', 'documents_verified', 'medical_passed', 'exam_booked', 'exam_failed', 'exam_passed'].includes(a.status),
      );
      if (eligible) setActiveAppId(eligible.id);
    }).finally(() => setLoading(false));
  }, [user]);

  const cities = useMemo(() => {
    const fromCentres = centres.map((c) => c.city).filter(Boolean);
    const fromSlots = slots.map((s) => s.city).filter(Boolean) as string[];
    const combined = [...new Set([...fromCentres, ...fromSlots, 'Colombo', 'Werahera', 'Nugegoda', 'Gampaha', 'Kandy', 'Kurunegala', 'Galle'])];
    return combined.sort();
  }, [centres, slots]);

  const filteredSlots = useMemo(() => {
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
    if (!user || !activeAppId) return;
    setBusy(true);
    setErr('');
    try {
      if (rescheduleId) {
        await rescheduleExamAPI(rescheduleId, slotId);
        toast.success('Exam rescheduled.');
        setMsg('Exam moved to new slot.');
      } else {
        await bookExamAPI({ applicantId: user.id, applicationId: activeAppId, slotId });
        toast.success('Exam booked successfully.');
        setMsg('Exam booked. MCQ: 40 questions, 1 hour computerized test. Results will be given immediately.');
      }
      setRescheduleId(null);
      const [newSlots, newBookings] = await Promise.all([
        getAvailableSlotsAPI('EXAM').catch(() => []),
        getExamsByApplicantAPI(user.id).catch(() => []),
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
      await cancelExamAPI(id);
      toast.success('Exam booking cancelled.');
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
      const newSlots = await getAvailableSlotsAPI('EXAM').catch(() => []);
      setSlots(newSlots);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Cancellation failed');
    }
    setConfirmCancel(null);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  const hasPassedExam = bookings.some((b) => b.result === 'PASS') || latestApp?.status === 'exam_passed';
  const hasFailedExam = latestApp?.status === 'exam_failed' || bookings.some((b) => b.status === 'COMPLETED' && b.result === 'FAIL');

  return (
    <div>
      <PageHeader
        kicker="Stage 4: Theory test"
        title="Computerized driving exam"
        subtitle="MCQ: 40 questions within 1 hour. Results are given immediately after completion."
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <div className="mt-3"><Alert kind="error">{err}</Alert></div>}

      {/* Prerequisite and status guidance */}
      {hasPassedExam ? (
        <div className="mt-3">
          <Alert kind="success" title="Theory Examination Passed! 🎉">
            You have already passed the computerized theory examination. You are eligible to book your practical driving trial test.
            <div className="mt-3">
              <Button variant="gold" onClick={() => nav('/app/trial')}>
                Proceed to Practical Trial Booking →
              </Button>
            </div>
          </Alert>
        </div>
      ) : !activeAppId ? (
        <div className="mt-3">
          {!latestApp ? (
            <Alert kind="warning" title="Step 2 Required: Submit Licence Application">
              You must submit a driving licence application and obtain officer approval before you can book an exam.
              <div className="mt-3">
                <Button variant="gold" onClick={() => nav('/app/apply')}>
                  Go to Licence Application →
                </Button>
              </div>
            </Alert>
          ) : latestApp.status === 'rejected' ? (
            <Alert kind="error" title="Application Rejected">
              Your previous application was rejected: "{latestApp.rejectionReason || 'Requirements not met'}". Please submit a new application before booking an exam.
              <div className="mt-3">
                <Button variant="secondary" onClick={() => nav('/app/apply')}>
                  Reapply for Licence →
                </Button>
              </div>
            </Alert>
          ) : (
            <Alert kind="warning" title="Application Under Review">
              Your application (#{latestApp.id}) is currently awaiting Registration Officer review. Exam booking will unlock automatically once your application is approved.
              <div className="mt-3">
                <Button variant="secondary" onClick={() => nav(`/app/applications/${latestApp.id}`)}>
                  Track Application Status →
                </Button>
              </div>
            </Alert>
          )}
        </div>
      ) : null}

      {hasFailedExam && !hasPassedExam && (
        <div className="mt-3">
          <Alert kind="warning" title="Re-examination Required">
            You did not pass your previous theory examination attempt. You are eligible to book a new examination sitting from the available slots below to retake the computerized test.
          </Alert>
        </div>
      )}

      <div className="mt-4 rounded-xl bg-[#0b1c33] p-4 text-[#f6f1e7]">
        <p className="text-xs tracking-widest text-[#c6a15b] uppercase">Exam notice</p>
        <p className="mt-1 text-sm">
          This is a <strong>computerized MCQ examination</strong> consisting of <strong>40 multiple-choice questions</strong>.
          You will have <strong>1 hour</strong> to complete the test. Results will be provided <strong>immediately</strong> after submission.
        </p>
      </div>

      {/* City & Date Filter Bar */}
      <div className="mt-6">
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide uppercase text-[#0b1c33]/70">Filter by City / Centre</p>
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="all">All Cities & Examination Centres</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
        <h2 className="font-display text-2xl">Your exam bookings</h2>
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
              ? 'No active exam bookings. (Cancelled records hidden in history above).'
              : 'No exam history.'}
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
                      Attempt {b.attempt} · {formatDate(b.date)} · {b.timeSlot}
                    </p>
                    <p className="text-sm text-[#0b1c33]/55">
                      {b.centreName} · Status: <span className="font-semibold">{b.status}</span>
                      {b.score != null ? ` · Score: ${b.score}/40` : ''}
                      {b.result ? (
                        <span
                          className={`ml-2 rounded px-2 py-0.5 text-xs font-bold ${
                            b.result === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {b.result}
                        </span>
                      ) : (
                        ''
                      )}
                    </p>
                    {b.remarks && <p className="mt-1 text-sm italic text-stone-600">{b.remarks}</p>}
                  </div>

                  {b.status === 'BOOKED' && (
                    within12 ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setRescheduleId(b.id)}>
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
                    Select a new slot below to move this examination sitting.
                  </p>
                )}
              </Card>
            );
          })}

        {/* Cancelled Bookings history drawer */}
        {showCancelled && (
          <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Cancelled Examination Bookings History
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
                      Attempt {b.attempt} · {formatDate(b.date)} · {b.timeSlot} · {b.centreName}
                    </p>
                    <p className="text-xs text-stone-400">
                      Cancelled sitting retained for attempt counting & official audit
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

      <h2 className="mt-8 font-display text-2xl">{rescheduleId ? 'Choose a new slot' : 'Open sittings'}</h2>
      {filteredSlots.length === 0 && (
        <p className="mt-3 text-sm text-[#0b1c33]/55">No exam slots matching your criteria. Try adjusting the city or date filter.</p>
      )}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {filteredSlots.map((s) => {
          const full = s.booked >= s.capacity;
          const left = s.capacity - s.booked;
          return (
            <Card key={s.id}>
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{s.centreName}</p>
                  <p className="text-sm text-[#0b1c33]/55">
                    {formatDate(s.date)} · {s.startTime}–{s.endTime}
                    {s.city ? ` · ${s.city}` : ''}
                  </p>
                </div>
                <Badge tone={full ? 'danger' : left <= 2 ? 'warn' : 'success'}>
                  {full ? 'Full' : `${left} open`}
                </Badge>
              </div>
              <Button className="mt-3" size="sm" disabled={full || !activeAppId || busy} onClick={() => book(s.id)}>
                {busy ? <Spinner /> : rescheduleId ? 'Move here' : 'Book exam'}
              </Button>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel exam booking?"
        message="Your exam slot will be released. You can re-book if slots remain available."
        confirmLabel="Yes, cancel it"
        variant="danger"
        onConfirm={() => confirmCancel && handleCancel(confirmCancel)}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
}
