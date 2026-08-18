import { useMemo, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { locById, useStore } from '../../lib/store';
import { canReschedule, formatDate } from '../../lib/utils';
import { Alert, Badge, Button, Card, PageHeader, Select } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export default function BookExam() {
  const { user } = useAuth();
  const { state, bookExam, cancelExam, rescheduleExam, pay } = useStore();
  const toast = useToast();
  const [kind, setKind] = useState<'written' | 'computer' | 'any'>('any');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const slots = useMemo(
    () =>
      state.schedules
        .filter((s) => s.type === 'exam' && s.date >= new Date().toISOString().slice(0, 10))
        .filter((s) => (kind === 'any' ? true : s.examKind === kind))
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    [state.schedules, kind],
  );

  if (!user) return null;
  const me = user;
  const apps = state.applications.filter(
    (a) => a.applicantId === me.id && ['medical_passed', 'exam_pending', 'exam_failed'].includes(a.status),
  );
  const active = apps[0];
  const bookings = state.exams.filter((e) => e.applicantId === me.id);

  function book(scheduleId: string, k: 'written' | 'computer') {
    if (!active) return setErr('Your medical must be passed before booking an exam.');
    const res = rescheduleId
      ? rescheduleExam(rescheduleId, scheduleId)
      : bookExam({ applicationId: active.id, applicantId: me.id, scheduleId, kind: k });
    if (!res.ok) return setErr(res.error);
    if (!rescheduleId) pay({ userId: me.id, applicationId: active.id, type: 'exam', method: 'card', cardLast4: '4242' });
    toast.success(rescheduleId ? 'Exam rescheduled.' : 'Exam booked successfully.');
    setMsg(rescheduleId ? 'Exam moved.' : 'Exam booked.');
    setErr('');
    setRescheduleId(null);
  }

  return (
    <div>
      <PageHeader
        kicker="Theory test"
        title="Written / computer exam"
        subtitle="Reschedule is allowed until 24 hours before the sitting. Full halls are locked."
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && (
        <div className="mt-3">
          <Alert kind="error">{err}</Alert>
        </div>
      )}
      {!active && (
        <div className="mt-3">
          <Alert kind="warning">No file is currently eligible. Complete the medical stage first.</Alert>
        </div>
      )}

      <div className="mt-5 max-w-xs">
        <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="any">All formats</option>
          <option value="computer">Computer based</option>
          <option value="written">Written paper</option>
        </Select>
      </div>

      <h2 className="mt-8 font-display text-2xl">Your exam bookings</h2>
      <div className="mt-3 space-y-3">
        {bookings.map((b) => (
          <Card key={b.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  Attempt {b.attempt} · {b.kind} · {formatDate(b.date)} {b.time}
                </p>
                <p className="text-sm text-[#0b1c33]/55">
                  {locById(state.locations, b.locationId)?.name} · {b.status}
                  {b.score != null ? ` · score ${b.score}` : ''}
                </p>
                {b.remarks && <p className="text-sm">{b.remarks}</p>}
              </div>
              {b.status === 'booked' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={!canReschedule(b.date, b.time)} onClick={() => setRescheduleId(b.id)}>
                    Reschedule
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmCancel(b.id)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
        {bookings.length === 0 && <p className="text-sm text-[#0b1c33]/55">No exam history.</p>}
      </div>

      <h2 className="mt-8 font-display text-2xl">Open sittings</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {slots.map((s) => {
          const loc = locById(state.locations, s.locationId);
          const full = s.booked >= s.capacity;
          return (
            <Card key={s.id}>
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{loc?.name}</p>
                  <p className="text-sm text-[#0b1c33]/55">
                    {formatDate(s.date)} · {s.startTime}–{s.endTime} · {s.examKind}
                  </p>
                </div>
                <Badge tone={full ? 'danger' : 'success'}>
                  {s.booked}/{s.capacity}
                </Badge>
              </div>
              <Button
                className="mt-3"
                size="sm"
                disabled={full || !active}
                onClick={() => book(s.id, (s.examKind ?? 'computer') as 'written' | 'computer')}
              >
                {rescheduleId ? 'Move here' : 'Book'}
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
        onConfirm={() => {
          if (confirmCancel) {
            cancelExam(confirmCancel);
            toast.success('Exam booking cancelled.');
          }
          setConfirmCancel(null);
        }}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
}
