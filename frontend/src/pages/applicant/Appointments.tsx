import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { locById, useStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Textarea } from '../../components/ui';
import { getMedicalAppointments, recordMedicalResult } from '../../lib/api';
import type { MedicalAppointment } from '../../types';

export default function MedicalAppointments() {
  const { user } = useAuth();
  // state.users/state.locations still come from the mock store - those belong
  // to other modules, not Medical Test Booking.
  const { state, log } = useStore();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<MedicalAppointment[]>([]);
  const [draft, setDraft] = useState<
    Record<string, { result: 'pass' | 'fail'; remarks: string; vision: string; hearing: string; bloodPressure: string }>
  >({});

  async function refresh() {
    try {
      const all = await getMedicalAppointments();
      setRows(all.filter((m) => m.status === 'booked' || m.status === 'completed'));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load appointments.');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function d(id: string) {
    return (
      draft[id] ?? {
        result: 'pass' as const,
        remarks: '',
        vision: '6/6',
        hearing: 'Normal',
        bloodPressure: '120/80',
      }
    );
  }

  async function save(id: string) {
    if (!user) return;
    const x = d(id);
    try {
      await recordMedicalResult(id, {
        officerId: user.id,
        result: x.result,
        remarks: x.remarks,
        vision: x.vision,
        hearing: x.hearing,
        bloodPressure: x.bloodPressure,
      });
      log({
        userId: user.id,
        userName: user.name,
        action: 'MEDICAL_RESULT',
        entity: 'MedicalAppointment',
        entityId: id,
        details: x.result,
      });
      setMsg('Medical result recorded.');
      setErr('');
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save result.');
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Clinic"
        title="Medical appointments"
        subtitle="Upload findings and flag applicants who fail statutory fitness standards."
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && (
        <div className="mt-3">
          <Alert kind="error">{err}</Alert>
        </div>
      )}
      <div className="mt-4 space-y-4">
        {rows.map((m) => {
          const u = state.users.find((x) => x.id === m.applicantId);
          const x = d(m.id);
          return (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {u?.name} · {m.applicationId}
                  </p>
                  <p className="text-sm text-[#0b1c33]/55">
                    {formatDate(m.date)} {m.time} · {locById(state.locations, m.locationId)?.name}
                  </p>
                </div>
                <Badge tone={m.result === 'fail' ? 'danger' : m.result === 'pass' ? 'success' : 'warn'}>
                  {m.result ?? m.status}
                </Badge>
              </div>
              {m.status === 'booked' && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Vision">
                    <Input value={x.vision} onChange={(e) => setDraft({ ...draft, [m.id]: { ...x, vision: e.target.value } })} />
                  </Field>
                  <Field label="Hearing">
                    <Input value={x.hearing} onChange={(e) => setDraft({ ...draft, [m.id]: { ...x, hearing: e.target.value } })} />
                  </Field>
                  <Field label="Blood pressure">
                    <Input
                      value={x.bloodPressure}
                      onChange={(e) => setDraft({ ...draft, [m.id]: { ...x, bloodPressure: e.target.value } })}
                    />
                  </Field>
                  <Field label="Finding">
                    <Select
                      value={x.result}
                      onChange={(e) => setDraft({ ...draft, [m.id]: { ...x, result: e.target.value as 'pass' | 'fail' } })}
                    >
                      <option value="pass">Fit to drive</option>
                      <option value="fail">Unfit / refer</option>
                    </Select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Clinical remarks">
                      <Textarea value={x.remarks} onChange={(e) => setDraft({ ...draft, [m.id]: { ...x, remarks: e.target.value } })} />
                    </Field>
                  </div>
                  <Button onClick={() => save(m.id)}>Save medical result</Button>
                </div>
              )}
              {m.status === 'completed' && (
                <p className="mt-3 text-sm">
                  Vision {m.vision} · Hearing {m.hearing} · BP {m.bloodPressure}
                  {m.remarks ? ` · ${m.remarks}` : ''}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
