import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import { Alert, Button, Card, Field, Input, PageHeader, Select, Textarea } from '../../components/ui';

export default function TrainerTrainees() {
  const { user } = useAuth();
  const { state, addTrainingNote, sendTraineeReminder } = useStore();
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState(50);
  const [sel, setSel] = useState('');
  const [msg, setMsg] = useState('');

  if (!user) return null;
  const me = user;
  const assigned = state.applications.filter((a) => a.trainerId === me.id);

  function save() {
    const app = assigned.find((a) => a.id === sel) ?? assigned[0];
    if (!app || !note.trim()) return;
    addTrainingNote({
      trainerId: me.id,
      applicantId: app.applicantId,
      applicationId: app.id,
      note,
      progress,
      sessionDate: new Date().toISOString().slice(0, 10),
    });
    setNote('');
    setMsg('Progress note saved.');
  }

  function remind(applicantId: string) {
    sendTraineeReminder(me.id, applicantId, 'Please confirm attendance for your next training session at the department yard.');
    setMsg('Reminder sent to the trainee’s notification inbox.');
  }

  return (
    <div>
      <PageHeader kicker="Cohort" title="Assigned trainees" subtitle="Update training progress and ping applicants who miss sessions." />
      {msg && <Alert kind="success">{msg}</Alert>}
      <div className="mt-5 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl">Log a session</h2>
          <div className="mt-3 space-y-3">
            <Field label="Trainee">
              <Select
                value={sel}
                onChange={(e) => setSel(e.target.value)}
              >
                {assigned.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.personal.fullName} · {a.id}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Progress %">
              <Input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
            </Field>
            <Field label="Notes">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Button onClick={save}>Save note</Button>
          </div>
        </Card>
        <div className="space-y-3 lg:col-span-3">
          {assigned.map((a) => {
            const notes = state.trainingNotes.filter((n) => n.applicationId === a.id);
            const last = notes[0];
            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.personal.fullName}</p>
                    <p className="text-xs text-[#0b1c33]/55">
                      {a.id} · class {a.category} · {a.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => remind(a.applicantId)}>
                    Send reminder
                  </Button>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0b1c33]/8">
                  <div className="h-full bg-[#0e7c7b]" style={{ width: `${last?.progress ?? 10}%` }} />
                </div>
                <p className="mt-2 text-xs text-[#0b1c33]/50">{last ? `${last.progress}% · ${last.note}` : 'No notes yet'}</p>
                <ul className="mt-2 space-y-1 text-xs text-[#0b1c33]/70">
                  {notes.slice(0, 3).map((n) => (
                    <li key={n.id}>
                      {formatDate(n.sessionDate)} — {n.note}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
