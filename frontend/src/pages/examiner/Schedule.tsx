import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { locById, useStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Textarea } from '../../components/ui';

export default function ExaminerSchedule() {
  const { user } = useAuth();
  const { state, recordExam, recordTrial, log } = useStore();
  const [filter, setFilter] = useState<'all' | 'exam' | 'trial'>('all');
  const [msg, setMsg] = useState('');
  const [draft, setDraft] = useState<Record<string, { result: 'pass' | 'fail'; score: string; remarks: string }>>({});

  const exams = state.exams.filter((e) => e.status === 'booked');
  const trials = state.trials.filter((e) => e.status === 'booked');

  function d(id: string) {
    return draft[id] ?? { result: 'pass' as const, score: '75', remarks: '' };
  }

  function saveExam(id: string) {
    if (!user) return;
    const x = d(id);
    recordExam(id, user.id, x.result, Number(x.score) || undefined, x.remarks);
    log({
      userId: user.id,
      userName: user.name,
      action: 'EXAM_RESULT',
      entity: 'ExamBooking',
      entityId: id,
      details: `${x.result} ${x.score}`,
    });
    setMsg('Exam result saved.');
  }

  function saveTrial(id: string) {
    if (!user) return;
    const x = d(id);
    recordTrial(id, user.id, x.result, x.remarks);
    log({
      userId: user.id,
      userName: user.name,
      action: 'TRIAL_RESULT',
      entity: 'TrialBooking',
      entityId: id,
      details: x.result,
    });
    setMsg('Trial result saved.');
  }

  return (
    <div>
      <PageHeader kicker="Roll" title="Assigned exam & trial schedule" subtitle="Submit pass/fail with remarks. Previous attempts are visible on each card." />
      {msg && <Alert kind="success">{msg}</Alert>}
      <div className="my-4 max-w-xs">
        <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="all">Exams and trials</option>
          <option value="exam">Exams only</option>
          <option value="trial">Trials only</option>
        </Select>
      </div>

      {(filter !== 'trial' ? exams : []).map((e) => {
        const u = state.users.find((x) => x.id === e.applicantId);
        const history = state.exams.filter((x) => x.applicationId === e.applicationId && x.id !== e.id);
        const x = d(e.id);
        return (
          <Card key={e.id} className="mb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {u?.name} · {e.applicationId}
                </p>
                <p className="text-sm text-[#0b1c33]/55">
                  {formatDate(e.date)} {e.time} · {e.kind} · {locById(state.locations, e.locationId)?.name} · attempt {e.attempt}
                </p>
              </div>
              <Badge tone="warn">Awaiting result</Badge>
            </div>
            {history.length > 0 && (
              <p className="mt-2 text-xs text-[#0b1c33]/55">
                Previous: {history.map((h) => `${h.result ?? h.status}${h.score != null ? ` (${h.score})` : ''}`).join(', ')}
              </p>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Result">
                <Select
                  value={x.result}
                  onChange={(ev) => setDraft({ ...draft, [e.id]: { ...x, result: ev.target.value as 'pass' | 'fail' } })}
                >
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </Select>
              </Field>
              <Field label="Score">
                <Input value={x.score} onChange={(ev) => setDraft({ ...draft, [e.id]: { ...x, score: ev.target.value } })} />
              </Field>
              <Field label="Remarks">
                <Input value={x.remarks} onChange={(ev) => setDraft({ ...draft, [e.id]: { ...x, remarks: ev.target.value } })} />
              </Field>
            </div>
            <Button className="mt-3" size="sm" onClick={() => saveExam(e.id)}>
              Submit exam result
            </Button>
          </Card>
        );
      })}

      {(filter !== 'exam' ? trials : []).map((e) => {
        const u = state.users.find((x) => x.id === e.applicantId);
        const history = state.trials.filter((x) => x.applicationId === e.applicationId && x.id !== e.id);
        const x = d(e.id);
        return (
          <Card key={e.id} className="mb-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {u?.name} · {e.applicationId}
                </p>
                <p className="text-sm text-[#0b1c33]/55">
                  {formatDate(e.date)} {e.time} · {locById(state.locations, e.locationId)?.name} · attempt {e.attempt}
                </p>
              </div>
              <Badge tone="warn">Awaiting result</Badge>
            </div>
            {history.length > 0 && (
              <p className="mt-2 text-xs">Previous: {history.map((h) => h.result ?? h.status).join(', ')}</p>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Result">
                <Select
                  value={x.result}
                  onChange={(ev) => setDraft({ ...draft, [e.id]: { ...x, result: ev.target.value as 'pass' | 'fail' } })}
                >
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </Select>
              </Field>
              <Field label="Remarks">
                <Textarea value={x.remarks} onChange={(ev) => setDraft({ ...draft, [e.id]: { ...x, remarks: ev.target.value } })} />
              </Field>
            </div>
            <Button className="mt-3" size="sm" onClick={() => saveTrial(e.id)}>
              Submit trial result
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
