import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import { Button, Card, Field, Input, PageHeader, Select } from '../../components/ui';

export default function TrainerSchedule() {
  const { user } = useAuth();
  const { state, addTrainerSlot, removeTrainerSlot } = useStore();
  const [form, setForm] = useState({ date: '', startTime: '08:00', endTime: '10:00', applicantId: '', notes: '' });

  if (!user) return null;
  const me = user;
  const mine = state.trainerSchedules.filter((s) => s.trainerId === me.id);
  const assigned = state.applications.filter((a) => a.trainerId === me.id);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;
    addTrainerSlot({
      trainerId: me.id,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      applicantId: form.applicantId || undefined,
      notes: form.notes,
    });
    setForm({ ...form, notes: '' });
  }

  return (
    <div>
      <PageHeader kicker="Diary" title="Training schedule" subtitle="Block time for yard practice, highway sessions or rest." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Add a block</h2>
          <form onSubmit={add} className="mt-4 space-y-3">
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start">
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </Field>
              <Field label="End">
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </Field>
            </div>
            <Field label="Trainee (optional)">
              <Select value={form.applicantId} onChange={(e) => setForm({ ...form, applicantId: e.target.value })}>
                <option value="">Unassigned / admin</option>
                {assigned.map((a) => (
                  <option key={a.id} value={a.applicantId}>
                    {a.personal.fullName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Notes">
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <Button type="submit">Add to diary</Button>
          </form>
        </Card>
        <div className="space-y-3">
          {mine
            .slice()
            .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
            .map((s) => {
              const trainee = state.users.find((u) => u.id === s.applicantId);
              return (
                <Card key={s.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">
                        {formatDate(s.date)} · {s.startTime}–{s.endTime}
                      </p>
                      <p className="text-sm text-[#0b1c33]/55">
                        {trainee?.name ?? 'Open block'} {s.notes ? `· ${s.notes}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeTrainerSlot(s.id)}>
                      Remove
                    </Button>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
