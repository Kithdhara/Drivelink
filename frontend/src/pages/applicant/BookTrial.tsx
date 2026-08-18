import { useMemo, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { locById, useStore } from '../../lib/store';
import { canReschedule, formatDate } from '../../lib/utils';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export default function BookTrial() {
  const { user } = useAuth();
  const { state, bookTrial, cancelTrial, rescheduleTrial, pay } = useStore();
  const toast = useToast();
  const [trainerType, setTrainerType] = useState<'department' | 'private'>('department');
  const [trainerId, setTrainerId] = useState('u-tra-1');
  const [privateName, setPrivateName] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const slots = useMemo(
    () =>
      state.schedules
        .filter((s) => s.type === 'trial' && s.date >= new Date().toISOString().slice(0, 10))
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    [state.schedules],
  );

  if (!user) return null;
  const me = user;
  const apps = state.applications.filter(
    (a) => a.applicantId === me.id && ['exam_passed', 'trial_pending', 'trial_failed'].includes(a.status),
  );
  const active = apps[0];
  const bookings = state.trials.filter((t) => t.applicantId === me.id);
  const trainers = state.users.filter((u) => u.role === 'trainer' && u.active);

  function book(scheduleId: string) {
    if (!active) return setErr('Pass the theory exam before booking a trial.');
    if (trainerType === 'private' && !privateName.trim()) return setErr('Enter your private trainer’s name.');
    const res = rescheduleId
      ? rescheduleTrial(rescheduleId, scheduleId)
      : bookTrial({
          applicationId: active.id,
          applicantId: me.id,
          scheduleId,
          trainerType,
          trainerId: trainerType === 'department' ? trainerId : undefined,
          privateTrainerName: trainerType === 'private' ? privateName : undefined,
        });
    if (!res.ok) return setErr(res.error);
    if (!rescheduleId) pay({ userId: me.id, applicationId: active.id, type: 'trial', method: 'card', cardLast4: '4242' });
    toast.success(rescheduleId ? 'Trial rescheduled.' : 'Trial booked successfully.');
    setMsg(rescheduleId ? 'Trial moved.' : 'Trial booked.');
    setErr('');
    setRescheduleId(null);
  }

  return (
    <div>
      <PageHeader
        kicker="Practical test"
        title="Driving trial"
        subtitle="Select a circuit, then request a department trainer or confirm that you will arrive with a private instructor."
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && (
        <div className="mt-3">
          <Alert kind="error">{err}</Alert>
        </div>
      )}

      <Card className="mt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Trainer arrangement">
            <Select value={trainerType} onChange={(e) => setTrainerType(e.target.value as typeof trainerType)}>
              <option value="department">Department-assigned trainer</option>
              <option value="private">I have a private trainer</option>
            </Select>
          </Field>
          {trainerType === 'department' ? (
            <Field label="Preferred trainer">
              <Select value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Private trainer name">
              <Input value={privateName} onChange={(e) => setPrivateName(e.target.value)} />
            </Field>
          )}
        </div>
      </Card>

      <h2 className="mt-8 font-display text-2xl">Your trial bookings</h2>
      <div className="mt-3 space-y-3">
        {bookings.map((b) => (
          <Card key={b.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  Attempt {b.attempt} · {formatDate(b.date)} {b.time}
                </p>
                <p className="text-sm text-[#0b1c33]/55">
                  {locById(state.locations, b.locationId)?.name} · {b.trainerType} · {b.status}
                  {b.result ? ` · ${b.result}` : ''}
                </p>
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
      </div>

      <h2 className="mt-8 font-display text-2xl">Open circuits</h2>
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
                    {formatDate(s.date)} · {s.startTime}–{s.endTime}
                  </p>
                </div>
                <Badge tone={full ? 'danger' : 'success'}>
                  {s.booked}/{s.capacity}
                </Badge>
              </div>
              <Button className="mt-3" size="sm" disabled={full || !active} onClick={() => book(s.id)}>
                {rescheduleId ? 'Move here' : 'Book trial'}
              </Button>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel trial booking?"
        message="Your driving trial slot will be released. You will need to re-book if slots remain."
        confirmLabel="Yes, cancel it"
        variant="danger"
        onConfirm={() => {
          if (confirmCancel) {
            cancelTrial(confirmCancel);
            toast.success('Trial booking cancelled.');
          }
          setConfirmCancel(null);
        }}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
}
