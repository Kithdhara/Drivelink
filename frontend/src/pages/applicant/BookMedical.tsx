import { useMemo, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { locById, useStore } from '../../lib/store';
import { canReschedule, formatDate } from '../../lib/utils';
import { Alert, Badge, Button, Card, PageHeader, Select } from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export default function BookMedical() {
  const { user } = useAuth();
  const { state, bookMedical, cancelMedical, rescheduleMedical, pay } = useStore();
  const toast = useToast();
  const [appId, setAppId] = useState('');
  const [city, setCity] = useState('all');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const slots = useMemo(() => {
    return state.schedules
      .filter((s) => s.type === 'medical' && s.date >= new Date().toISOString().slice(0, 10))
      .filter((s) => {
        if (city === 'all') return true;
        return locById(state.locations, s.locationId)?.city === city;
      })
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [state.schedules, state.locations, city]);

  if (!user) return null;
  const me = user;
  const apps = state.applications.filter(
    (a) =>
      a.applicantId === me.id &&
      ['submitted', 'documents_verified', 'medical_pending', 'medical_failed'].includes(a.status),
  );
  const activeApp = apps.find((a) => a.id === appId) ?? apps[0];
  const bookings = state.medicals.filter((m) => m.applicantId === me.id);
  const cities = [...new Set(state.locations.filter((l) => l.type === 'medical').map((l) => l.city))];

  function book(scheduleId: string) {
    if (!activeApp) return setErr('No eligible application. Submit a file first.');
    const res = rescheduleId
      ? rescheduleMedical(rescheduleId, scheduleId)
      : bookMedical({ applicationId: activeApp.id, applicantId: me.id, scheduleId });
    if (!res.ok) return setErr(res.error);
    if (!rescheduleId) {
      pay({ userId: me.id, applicationId: activeApp.id, type: 'medical', method: 'card', cardLast4: '4242' });
    }
    toast.success(rescheduleId ? 'Appointment moved successfully.' : 'Medical appointment booked.');
    setMsg(rescheduleId ? 'Appointment moved.' : 'Medical appointment booked. Fee receipt is in Payments.');
    setErr('');
    setRescheduleId(null);
  }

  return (
    <div>
      <PageHeader
        kicker="Fitness to drive"
        title="Medical examination"
        subtitle="Live capacity is shown for every centre. Full slots cannot be double-booked."
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && (
        <div className="mt-3">
          <Alert kind="error">{err}</Alert>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold tracking-wide uppercase">Application</p>
          <Select value={activeApp?.id ?? ''} onChange={(e) => setAppId(e.target.value)}>
            {apps.length === 0 && <option value="">No eligible file</option>}
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} · {a.status}
              </option>
            ))}
          </Select>
        </Card>
        <Card>
          <p className="text-xs font-semibold tracking-wide uppercase">Centre city</p>
          <Select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="all">All cities</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Card>
      </div>

      <h2 className="mt-8 font-display text-2xl">Your medical bookings</h2>
      <div className="mt-3 space-y-3">
        {bookings.length === 0 && <p className="text-sm text-[#0b1c33]/55">None yet.</p>}
        {bookings.map((b) => (
          <Card key={b.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {formatDate(b.date)} · {b.time} · {locById(state.locations, b.locationId)?.name}
                </p>
                <p className="text-sm text-[#0b1c33]/55">
                  {b.applicationId} · {b.status}
                  {b.result ? ` · ${b.result}` : ''}
                </p>
                {b.remarks && <p className="mt-1 text-sm">{b.remarks}</p>}
              </div>
              {b.status === 'booked' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!canReschedule(b.date, b.time)}
                    onClick={() => setRescheduleId(b.id)}
                  >
                    Reschedule
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirmCancel(b.id)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            {rescheduleId === b.id && (
              <p className="mt-2 text-xs text-[#b45309]">Select a new slot below. Changes allowed up to 24 hours before.</p>
            )}
          </Card>
        ))}
      </div>

      <h2 className="mt-8 font-display text-2xl">{rescheduleId ? 'Choose a new slot' : 'Available slots'}</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {slots.map((s) => {
          const loc = locById(state.locations, s.locationId);
          const full = s.booked >= s.capacity;
          const left = s.capacity - s.booked;
          return (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{loc?.name}</p>
                  <p className="text-sm text-[#0b1c33]/55">
                    {loc?.city} · {formatDate(s.date)} · {s.startTime}–{s.endTime}
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
              <Button className="mt-3" size="sm" disabled={full || !activeApp} onClick={() => book(s.id)}>
                {rescheduleId ? 'Move here' : 'Book this slot'}
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
        onConfirm={() => {
          if (confirmCancel) {
            cancelMedical(confirmCancel);
            toast.success('Medical appointment cancelled.');
          }
          setConfirmCancel(null);
        }}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
}
