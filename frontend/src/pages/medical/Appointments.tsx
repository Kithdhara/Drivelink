import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Spinner, Textarea } from '../../components/ui';
import { useToast } from '../../components/Toast';
import {
  getAllMedicalsAPI,
  recordMedicalResultAPI,
  type BackendMedicalAppointment,
} from '../../lib/api';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MedicalAppointments() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BackendMedicalAppointment[]>([]);
  const [msg, setMsg] = useState('');
  const [draft, setDraft] = useState<
    Record<number, { result: 'PASS' | 'FAIL'; remarks: string; vision: string; hearing: string; bloodPressure: string }>
  >({});

  useEffect(() => {
    getAllMedicalsAPI()
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function d(id: number) {
    return (
      draft[id] ?? {
        result: 'PASS' as const,
        remarks: '',
        vision: '6/6',
        hearing: 'Normal',
        bloodPressure: '120/80',
      }
    );
  }

  async function save(id: number) {
    if (!user) return;
    const x = d(id);
    try {
      await recordMedicalResultAPI(id, {
        officerId: user.id,
        result: x.result,
        remarks: x.remarks,
        vision: x.vision,
        hearing: x.hearing,
        bloodPressure: x.bloodPressure,
      });
      toast.success('Medical result recorded.');
      setMsg('Medical result recorded.');
      // Refresh
      const updated = await getAllMedicalsAPI().catch(() => []);
      setRows(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save result');
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <PageHeader
        kicker="Clinic"
        title="Medical appointments"
        subtitle="Upload findings and flag applicants who fail statutory fitness standards."
      />
      {msg && <Alert kind="success">{msg}</Alert>}
      <div className="mt-4 space-y-4">
        {rows.length === 0 && <p className="text-sm text-[#0b1c33]/55">No appointments found.</p>}
        {rows.map((m) => {
          const x = d(m.id);
          return (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    Applicant: {m.applicantId}
                  </p>
                  <p className="text-sm text-[#0b1c33]/55">
                    {formatDate(m.date)} · {m.timeSlot} · {m.centreName}
                  </p>
                </div>
                <Badge tone={m.result === 'FAIL' ? 'danger' : m.result === 'PASS' ? 'success' : 'warn'}>
                  {m.result ?? m.status}
                </Badge>
              </div>
              {m.status === 'BOOKED' && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Vision">
                    <Input value={x.vision} onChange={(e) => setDraft({ ...draft, [m.id]: { ...x, vision: e.target.value } })} />
                  </Field>
                  <Field label="Hearing">
                    <Input value={x.hearing} onChange={(e) => setDraft({ ...draft, [m.id]: { ...x, hearing: e.target.value } })} />
                  </Field>
                  <Field label="Blood pressure">
                    <Input value={x.bloodPressure} onChange={(e) => setDraft({ ...draft, [m.id]: { ...x, bloodPressure: e.target.value } })} />
                  </Field>
                  <Field label="Finding">
                    <Select
                      value={x.result}
                      onChange={(e) => setDraft({ ...draft, [m.id]: { ...x, result: e.target.value as 'PASS' | 'FAIL' } })}
                    >
                      <option value="PASS">Fit to drive</option>
                      <option value="FAIL">Unfit / refer</option>
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
              {m.status === 'COMPLETED' && (
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
