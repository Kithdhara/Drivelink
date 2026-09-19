import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Spinner } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { isWithin12Hours, remainingEditHours } from '../../lib/utils';
import {
  bookTrialAPI,
  bookTrainerAPI,
  cancelTrialAPI,
  getAvailableSlotsAPI,
  getTrialsByApplicantAPI,
  getExamsByApplicantAPI,
  getApplicationsByApplicantAPI,
  getTrainersByApplicantAPI,
  rescheduleTrialAPI,
  type BackendTrialBooking,
  type BackendTimeSlot,
  type BackendApplication,
  type BackendTrainerBooking,
} from '../../lib/api';
import { Car, Clock, GraduationCap, History, LifeBuoy, Phone, UserCheck } from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BookTrial() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<BackendTimeSlot[]>([]);
  const [bookings, setBookings] = useState<BackendTrialBooking[]>([]);
  const [trainers, setTrainers] = useState<BackendTrainerBooking[]>([]);
  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [hasPassedExam, setHasPassedExam] = useState(false);
  const [latestApp, setLatestApp] = useState<BackendApplication | null>(null);

  // Trainer booking state (for active trial)
  const [selectedTrialId, setSelectedTrialId] = useState<number | null>(null);
  const [trainerType, setTrainerType] = useState<'DEPARTMENT' | 'PRIVATE'>('DEPARTMENT');
  const [deptTrainerName, setDeptTrainerName] = useState('Indika Rathnayake (Department Instructor)');
  const [privateName, setPrivateName] = useState('');
  const [privatePhone, setPrivatePhone] = useState('');
  const [trainerBusy, setTrainerBusy] = useState(false);

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getAvailableSlotsAPI('TRIAL').catch(() => []),
      getTrialsByApplicantAPI(user.id).catch(() => []),
      getExamsByApplicantAPI(user.id).catch(() => []),
      getApplicationsByApplicantAPI(user.id).catch(() => []),
      getTrainersByApplicantAPI(user.id).catch(() => []),
    ]).then(([s, t, exams, apps, trs]) => {
      setSlots(s);
      setBookings(t);
      setTrainers(trs);
      if (apps.length > 0) setLatestApp(apps[0]);

      // Check if applicant has passed theory exam
      const passed = exams.some((e) => e.result === 'PASS') ||
        apps.some((a) => ['exam_passed', 'trial_booked', 'trial_passed'].includes(a.status));
      setHasPassedExam(passed);

      const eligible = apps.find((a) =>
        ['exam_passed', 'trial_booked', 'trial_passed', 'trial_failed'].includes(a.status) ||
        (passed && a.status === 'approved'),
      );
      if (eligible) setActiveAppId(eligible.id);
    }).finally(() => setLoading(false));
  }, [user]);

  const sortedSlots = useMemo(() =>
    slots.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    [slots],
  );

  if (!user) return null;

  async function book(slotId: number) {
    if (!user || !activeAppId) return;
    setBusy(true);
    setErr('');
    try {
      if (rescheduleId) {
        await rescheduleTrialAPI(rescheduleId, slotId);
        toast.success('Trial rescheduled.');
        setMsg('Trial moved to new slot.');
      } else {
        await bookTrialAPI({
          applicantId: user.id,
          applicationId: activeAppId,
          slotId,
          trainerType: 'NONE',
        });
        toast.success('Trial test booked successfully! You can now arrange a driving trainer below.');
        setMsg('Driving trial test booked. Please arrange your trainer below if required.');
      }
      setRescheduleId(null);
      const [newSlots, newBookings] = await Promise.all([
        getAvailableSlotsAPI('TRIAL').catch(() => []),
        getTrialsByApplicantAPI(user.id).catch(() => []),
      ]);
      setSlots(newSlots);
      setBookings(newBookings);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleAssignTrainer(trialId: number) {
    if (!user) return;
    if (trainerType === 'PRIVATE' && (!privateName.trim() || !privatePhone.trim())) {
      setErr("Please provide both your private trainer's name and contact phone number.");
      return;
    }
    setTrainerBusy(true);
    setErr('');
    try {
      const assignedName = trainerType === 'DEPARTMENT' ? deptTrainerName : privateName.trim();
      const assignedPhone = trainerType === 'DEPARTMENT' ? '0771234571' : privatePhone.trim();

      await bookTrainerAPI(trialId, {
        applicantId: user.id,
        trainerType,
        trainerName: assignedName,
        trainerPhone: assignedPhone,
      });
      toast.success('Trainer booked and linked to your trial test successfully.');
      setMsg(`Trainer ${assignedName} has been assigned to your trial session.`);
      setSelectedTrialId(null);

      // Refresh bookings and trainers
      const [newBookings, newTrainers] = await Promise.all([
        getTrialsByApplicantAPI(user.id).catch(() => []),
        getTrainersByApplicantAPI(user.id).catch(() => []),
      ]);
      setBookings(newBookings);
      setTrainers(newTrainers);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to book trainer');
    } finally {
      setTrainerBusy(false);
    }
  }

  async function handleCancel(id: number) {
    if (!user) return;
    try {
      await cancelTrialAPI(id);
      toast.success('Trial booking cancelled.');
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
      const newSlots = await getAvailableSlotsAPI('TRIAL').catch(() => []);
      setSlots(newSlots);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Cancellation failed');
    }
    setConfirmCancel(null);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  const hasPassedTrial = bookings.some((b) => b.result === 'PASS') || latestApp?.status === 'trial_passed';
  const activeBookedTrial = bookings.find((b) => b.status === 'BOOKED');

  return (
    <div>
      <PageHeader
        kicker="Stage 5 & 6: Practical evaluation"
        title="Driving trial & trainer booking"
        subtitle="Schedule your practical driving trial on the circuit, then arrange an official or private trainer."
      />

      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <div className="mt-3"><Alert kind="error">{err}</Alert></div>}

      {/* Prerequisite: Theory exam passed check */}
      {!hasPassedExam ? (
        <div className="mt-3">
          <Card>
            <Alert kind="warning" title="Stage 4 Required: Pass Theory Exam First">
              Under Department sequential flow regulations, you must sit and pass the computerized theory examination before you can book a driving trial.
              <div className="mt-4 flex gap-3">
                <Button variant="gold" onClick={() => nav('/app/exam')}>
                  Go to Theory Exam Booking →
                </Button>
                <Button variant="ghost" onClick={() => nav('/app')}>
                  Return to Dashboard
                </Button>
              </div>
            </Alert>
          </Card>
        </div>
      ) : hasPassedTrial ? (
        <div className="mt-3">
          <Alert kind="success" title="Practical Trial Passed! 🏆">
            Congratulations! You have successfully passed the practical driving trial examination.
            Your file is now ready for official licence card issuance by the Registration Officer.
            <div className="mt-3">
              <Button variant="secondary" onClick={() => nav('/app')}>
                View Licence Status on Dashboard →
              </Button>
            </div>
          </Alert>
        </div>
      ) : null}

      {/* ── Your trial bookings with 12h Policy & History Toggle ── */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl">Your trial bookings</h2>
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

      <div className="mt-3 space-y-4">
        {bookings.filter((b) => b.status !== 'CANCELLED').length === 0 && (
          <p className="text-sm text-[#0b1c33]/55">
            {bookings.some((b) => b.status === 'CANCELLED')
              ? 'No active trial bookings. (Cancelled records hidden in history above).'
              : 'No trial history. Book a slot below once eligible.'}
          </p>
        )}

        {bookings
          .filter((b) => b.status !== 'CANCELLED')
          .map((b) => {
            const linkedTrainer = trainers.find((t) => t.trialBookingId === b.id);
            const hasTrainerAssigned = linkedTrainer || (b.trainerType && b.trainerType !== 'NONE');
            const within12 = isWithin12Hours(b.createdAt);
            const hoursLeft = remainingEditHours(b.createdAt);

            return (
              <Card key={b.id} className="border-l-4 border-l-[#0e7c7b]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-[#0e7c7b]" />
                      <p className="font-semibold text-[#0b1c33]">
                        Attempt {b.attempt} · {formatDate(b.date)} · {b.timeSlot}
                      </p>
                    </div>
                    <p className="text-sm text-[#0b1c33]/70 mt-1">
                      Circuit: <strong>{b.centreName}</strong> · Status: <span className="font-medium capitalize">{b.status}</span>
                      {b.result ? ` · Result: ${b.result}` : ''}
                    </p>

                    {/* Assigned trainer details badge */}
                    {hasTrainerAssigned && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1 text-xs text-teal-900">
                        <GraduationCap className="h-4 w-4 text-teal-700" />
                        <span>
                          Trainer: <strong>{linkedTrainer?.trainerName || b.privateTrainerName || b.trainerId || 'Department Trainer'}</strong>
                          {' '}({linkedTrainer?.trainerType || b.trainerType})
                          {linkedTrainer?.trainerPhone ? ` · Tel: ${linkedTrainer.trainerPhone}` : ''}
                        </span>
                      </div>
                    )}

                    {b.remarks && <p className="mt-1 text-xs text-[#0b1c33]/60 italic">{b.remarks}</p>}
                  </div>

                  {b.status === 'BOOKED' && (
                    within12 ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedTrialId(selectedTrialId === b.id ? null : b.id)}
                        >
                          <GraduationCap className="h-3.5 w-3.5 mr-1" />
                          {hasTrainerAssigned ? 'Change Trainer' : 'Book Trainer'}
                        </Button>
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
                    Select a new slot below to move this driving trial session.
                  </p>
                )}

                {/* Step 4B: Post-Trial Trainer Arrangement Drawer/Card */}
                {selectedTrialId === b.id && (
                  <div className="mt-4 rounded-xl bg-[#fcfaf6] border border-[#c6a15b]/40 p-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#0b1c33]/10">
                      <GraduationCap className="h-5 w-5 text-[#c6a15b]" />
                      <h3 className="font-display text-base font-semibold text-[#0b1c33]">
                        Stage 6: Arrange Trainer for Trial #{b.id}
                      </h3>
                    </div>

                    <p className="mt-2 text-xs text-[#0b1c33]/60">
                      Book a certified Department driving instructor or provide your registered private driving school trainer for this trial session.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="Trainer arrangement type">
                        <Select
                          value={trainerType}
                          onChange={(e) => setTrainerType(e.target.value as 'DEPARTMENT' | 'PRIVATE')}
                        >
                          <option value="DEPARTMENT">Department-assigned Instructor</option>
                          <option value="PRIVATE">Private Driving School Trainer</option>
                        </Select>
                      </Field>

                      {trainerType === 'DEPARTMENT' ? (
                        <Field label="Department Trainer">
                          <Select
                            value={deptTrainerName}
                            onChange={(e) => setDeptTrainerName(e.target.value)}
                          >
                            <option value="Indika Rathnayake (Department Instructor)">Indika Rathnayake (Dept. Instructor - Colombo)</option>
                            <option value="Sunil Jayasuriya (Senior Instructor)">Sunil Jayasuriya (Senior Instructor - Gampaha)</option>
                          </Select>
                        </Field>
                      ) : (
                        <>
                          <Field label="Private Trainer Full Name" required>
                            <Input
                              value={privateName}
                              onChange={(e) => setPrivateName(e.target.value)}
                              placeholder="e.g. Kamal Perera"
                            />
                          </Field>
                          <Field label="Private Trainer Phone Number" required>
                            <Input
                              value={privatePhone}
                              onChange={(e) => setPrivatePhone(e.target.value)}
                              placeholder="07XXXXXXXX"
                            />
                          </Field>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedTrialId(null)}
                      >
                        Close
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="gold"
                        disabled={trainerBusy}
                        onClick={() => handleAssignTrainer(b.id)}
                      >
                        {trainerBusy ? <Spinner /> : 'Save Trainer Assignment'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

        {/* Cancelled Bookings history drawer */}
        {showCancelled && (
          <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Cancelled Trial Bookings History
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
                      Cancelled trial retained for attempt counting & official audit
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

      {/* ── Open Trial Circuits ── */}
      {hasPassedExam && !hasPassedTrial && (
        <>
          <h2 className="mt-8 font-display text-2xl">{rescheduleId ? 'Choose a new circuit slot' : 'Open circuits'}</h2>
          {sortedSlots.length === 0 && (
            <p className="mt-3 text-sm text-[#0b1c33]/55">No trial slots available currently. Please check back soon or contact the coordinator.</p>
          )}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {sortedSlots.map((s) => {
              const full = s.booked >= s.capacity;
              const left = s.capacity - s.booked;
              return (
                <Card key={s.id}>
                  <div className="flex justify-between">
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
                  <Button
                    className="mt-3"
                    size="sm"
                    disabled={full || !activeAppId || busy}
                    onClick={() => book(s.id)}
                  >
                    {busy ? <Spinner /> : rescheduleId ? 'Move here' : 'Book trial test'}
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel trial booking?"
        message="Your driving trial slot will be released. You will need to re-book if slots remain."
        confirmLabel="Yes, cancel it"
        variant="danger"
        onConfirm={() => confirmCancel && handleCancel(confirmCancel)}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
}
