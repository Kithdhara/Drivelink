import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Spinner, Textarea, TableWrap, Th, Td } from '../../components/ui';
import { useToast } from '../../components/Toast';
import {
  getAllExamsAPI,
  getAllTrialsAPI,
  recordExamResultAPI,
  recordTrialResultAPI,
  type BackendExamBooking,
  type BackendTrialBooking,
} from '../../lib/api';

import { shortId } from '../../lib/utils';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ExaminerSchedule() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exams' | 'trials'>('exams');
  const [exams, setExams] = useState<BackendExamBooking[]>([]);
  const [trials, setTrials] = useState<BackendTrialBooking[]>([]);
  const [msg, setMsg] = useState('');
  const [draft, setDraft] = useState<Record<string, { result: 'PASS' | 'FAIL'; score: string; remarks: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getAllExamsAPI().catch(() => []),
      getAllTrialsAPI().catch(() => []),
    ]).then(([e, t]) => {
      setExams(e);
      setTrials(t);
    }).finally(() => setLoading(false));
  }, []);

  function d(id: string) {
    return draft[id] ?? { result: 'PASS' as const, score: '35', remarks: '' };
  }

  async function saveExam(id: number) {
    if (!user) return;
    const x = d(`exam-${id}`);
    setSavingId(`exam-${id}`);
    try {
      await recordExamResultAPI(id, {
        examinerId: user.id,
        result: x.result,
        score: Number(x.score) || (x.result === 'PASS' ? 35 : 20),
        remarks: x.remarks || (x.result === 'PASS' 
          ? `Passed Computerized Theory Exam. Score: ${x.score || 35}/40.` 
          : `Failed Theory Exam (Score: ${x.score || 20}/40). Re-examination required.`),
      });
      toast.success(`Exam result recorded as ${x.result}`);
      setMsg(`Exam #${id} graded as ${x.result}. Applicant application status updated accordingly.`);
      const updated = await getAllExamsAPI().catch(() => []);
      setExams(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save exam result');
    } finally {
      setSavingId(null);
    }
  }

  async function saveTrial(id: number) {
    if (!user) return;
    const x = d(`trial-${id}`);
    setSavingId(`trial-${id}`);
    try {
      await recordTrialResultAPI(id, {
        examinerId: user.id,
        result: x.result,
        remarks: x.remarks || (x.result === 'PASS' ? 'Passed practical road test.' : 'Failed practical road test.'),
      });
      toast.success(`Trial result recorded as ${x.result}`);
      setMsg(`Trial #${id} graded as ${x.result}.`);
      const updated = await getAllTrialsAPI().catch(() => []);
      setTrials(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save trial result');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  const pendingExams = exams.filter((e) => e.status === 'BOOKED');
  const completedExams = exams.filter((e) => e.status === 'COMPLETED');
  const pendingTrials = trials.filter((t) => t.status === 'BOOKED');
  const completedTrials = trials.filter((t) => t.status === 'COMPLETED');

  return (
    <div>
      <PageHeader
        kicker="Examiner Assessment Portal"
        title="Examinations & Driving Trials"
        subtitle="Evaluate applicants on theory MCQ tests and practical driving road tests."
      />
      
      {msg && (
        <div className="mb-4">
          <Alert kind="success">{msg}</Alert>
        </div>
      )}

      {/* Two Dedicated Tabs */}
      <div className="mt-4 mb-6 flex border-b border-[#0b1c33]/10">
        <button
          type="button"
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 border-b-2 px-6 py-4 font-semibold text-sm transition-all ${
            activeTab === 'exams'
              ? 'border-[#0e7c7b] text-[#0e7c7b]'
              : 'border-transparent text-[#0b1c33]/60 hover:text-[#0b1c33] hover:bg-[#0b1c33]/5'
          }`}
        >
          <span>Computerized Theory Exams</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${activeTab === 'exams' ? 'bg-[#0e7c7b] text-white' : 'bg-[#0b1c33]/10 text-[#0b1c33]/70'}`}>
            {pendingExams.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trials')}
          className={`flex items-center gap-2 border-b-2 px-6 py-4 font-semibold text-sm transition-all ${
            activeTab === 'trials'
              ? 'border-[#0e7c7b] text-[#0e7c7b]'
              : 'border-transparent text-[#0b1c33]/60 hover:text-[#0b1c33] hover:bg-[#0b1c33]/5'
          }`}
        >
          <span>Practical Driving Trials</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${activeTab === 'trials' ? 'bg-[#0e7c7b] text-white' : 'bg-[#0b1c33]/10 text-[#0b1c33]/70'}`}>
            {pendingTrials.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Computerized Theory Exams */}
      {activeTab === 'exams' && (
        <div className="space-y-8">
          <div className="rounded-xl bg-gradient-to-r from-stone-100 to-stone-50 shadow-sm ring-1 ring-stone-200/50 p-5 text-sm">
            <h3 className="font-bold tracking-tight text-stone-800">Theory Examination Guidelines</h3>
            <p className="mt-2 text-stone-600 leading-relaxed">
              Ensure the applicant completes 40 Multiple-Choice Questions (MCQ) within the 1-hour duration. The minimum pass mark is 30/40. 
              If an applicant <strong className="font-semibold text-stone-900 bg-emerald-50 px-1 rounded">passes</strong>, they immediately unlock their practical trial booking. 
              If an applicant <strong className="font-semibold text-stone-900 bg-rose-50 px-1 rounded">fails</strong>, they must rebook the examination.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#0b1c33]">
              Pending Theory Exams <span className="text-[#0b1c33]/40 font-medium text-base ml-1.5">({pendingExams.length})</span>
            </h3>
            {pendingExams.length === 0 ? (
              <p className="mt-2 text-sm text-[#0b1c33]/55">No pending theory examinations scheduled at this time.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {pendingExams.map((e) => {
                  const x = d(`exam-${e.id}`);
                  const isSaving = savingId === `exam-${e.id}`;
                  return (
                    <Card key={`exam-${e.id}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-base text-[#0b1c33]">
                            Applicant: <span className="font-mono text-[#0e7c7b]">{shortId(e.applicantId, 'APT')}</span> · App #{e.applicationId}
                          </p>
                          <p className="text-sm text-[#0b1c33]/65">
                            {formatDate(e.date)} · Slot: {e.timeSlot} · {e.centreName} · Attempt: <span className="font-bold">#{e.attempt}</span>
                          </p>
                        </div>
                        <Badge tone="warn">Awaiting Result</Badge>
                      </div>

                      <div className="mt-4 grid gap-4 rounded-lg bg-stone-50 p-4 sm:grid-cols-3">
                        <Field label="Assessment Result">
                          <Select
                            value={x.result}
                            onChange={(ev) => {
                              const res = ev.target.value as 'PASS' | 'FAIL';
                              setDraft({
                                ...draft,
                                [`exam-${e.id}`]: {
                                  ...x,
                                  result: res,
                                  score: res === 'PASS' ? (Number(x.score) < 30 ? '35' : x.score) : (Number(x.score) >= 30 ? '22' : x.score),
                                },
                              });
                            }}
                          >
                            <option value="PASS">PASS (Eligible for Trial)</option>
                            <option value="FAIL">FAIL (Must Retake Exam)</option>
                          </Select>
                        </Field>

                        <Field label="Score (out of 40)">
                          <Input
                            type="number"
                            min="0"
                            max="40"
                            value={x.score}
                            onChange={(ev) => setDraft({ ...draft, [`exam-${e.id}`]: { ...x, score: ev.target.value } })}
                          />
                        </Field>

                        <Field label="Remarks & Observations">
                          <Input
                            placeholder="Optional notes or remarks"
                            value={x.remarks}
                            onChange={(ev) => setDraft({ ...draft, [`exam-${e.id}`]: { ...x, remarks: ev.target.value } })}
                          />
                        </Field>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-3">
                        <Button
                          size="sm"
                          variant={x.result === 'PASS' ? 'gold' : 'danger'}
                          disabled={isSaving}
                          onClick={() => saveExam(e.id)}
                        >
                          {isSaving ? <Spinner /> : `Submit Result as ${x.result}`}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {completedExams.length > 0 && (
            <div className="mt-10">
              <h3 className="text-lg font-bold text-[#0b1c33] mb-4">Completed Exams ({completedExams.length})</h3>
              
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Applicant</Th>
                    <Th>Date & Center</Th>
                    <Th>Score</Th>
                    <Th>Result</Th>
                  </tr>
                </thead>
                <tbody>
                  {completedExams.slice(0, 10).map((e) => (
                    <tr key={`completed-exam-${e.id}`}>
                      <Td>
                        <span className="font-semibold text-[#0e7c7b]">{shortId(e.applicantId, 'APT')}</span>
                        <div className="text-[11px] text-[#0b1c33]/50 font-mono mt-0.5">App #{e.applicationId}</div>
                      </Td>
                      <Td>
                        {formatDate(e.date)}
                        <div className="text-[11px] text-[#0b1c33]/60 mt-0.5">{e.centreName}</div>
                      </Td>
                      <Td>
                        <span className="font-mono font-medium">{e.score ?? '-'}/40</span>
                      </Td>
                      <Td>
                        <Badge tone={e.result === 'PASS' ? 'success' : 'danger'}>
                          {e.result}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Practical Driving Trials */}
      {activeTab === 'trials' && (
        <div className="space-y-8">
          <div className="rounded-xl bg-gradient-to-r from-stone-100 to-stone-50 shadow-sm ring-1 ring-stone-200/50 p-5 text-sm">
            <h3 className="font-bold tracking-tight text-stone-800">Practical Road Test Assessment</h3>
            <p className="mt-2 text-stone-600 leading-relaxed">
              Verify the applicant has successfully passed the Computerized Theory Examination prior to evaluation. 
              Grading encompasses vehicle handling, road signs, traffic observance, and safe maneuvering under standard conditions.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#0b1c33]">
              Pending Practical Trials <span className="text-[#0b1c33]/40 font-medium text-base ml-1.5">({pendingTrials.length})</span>
            </h3>
            {pendingTrials.length === 0 ? (
              <p className="mt-2 text-sm text-[#0b1c33]/55">No pending practical driving trials scheduled at this time.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {pendingTrials.map((t) => {
                  const x = d(`trial-${t.id}`);
                  const isSaving = savingId === `trial-${t.id}`;
                  return (
                    <Card key={`trial-${t.id}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-base text-[#0b1c33]">
                            Applicant: <span className="font-mono text-[#0e7c7b]">{shortId(t.applicantId, 'APT')}</span> · App #{t.applicationId}
                          </p>
                          <p className="text-sm text-[#0b1c33]/65">
                            {formatDate(t.date)} · Slot: {t.timeSlot} · {t.centreName} · Attempt: <span className="font-bold">#{t.attempt}</span> · Trainer: {t.trainerType}
                          </p>
                        </div>
                        <Badge tone="warn">Awaiting Evaluation</Badge>
                      </div>

                      <div className="mt-4 grid gap-4 rounded-lg bg-stone-50 p-4 sm:grid-cols-2">
                        <Field label="Road Test Result">
                          <Select
                            value={x.result}
                            onChange={(ev) => setDraft({
                              ...draft,
                              [`trial-${t.id}`]: { ...x, result: ev.target.value as 'PASS' | 'FAIL' },
                            })}
                          >
                            <option value="PASS">PASS (Eligible for Driving Licence)</option>
                            <option value="FAIL">FAIL (Must Retake Road Test)</option>
                          </Select>
                        </Field>

                        <Field label="Assessment Remarks">
                          <Textarea
                            rows={2}
                            placeholder="Maneuvering, road discipline, vehicle control observations..."
                            value={x.remarks}
                            onChange={(ev) => setDraft({
                              ...draft,
                              [`trial-${t.id}`]: { ...x, remarks: ev.target.value },
                            })}
                          />
                        </Field>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-3">
                        <Button
                          size="sm"
                          variant={x.result === 'PASS' ? 'gold' : 'danger'}
                          disabled={isSaving}
                          onClick={() => saveTrial(t.id)}
                        >
                          {isSaving ? <Spinner /> : `Submit Trial Result as ${x.result}`}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {completedTrials.length > 0 && (
            <div className="mt-10">
              <h3 className="text-lg font-bold text-[#0b1c33] mb-4">Completed Trials ({completedTrials.length})</h3>
              
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Applicant</Th>
                    <Th>Date & Center</Th>
                    <Th>Remarks</Th>
                    <Th>Result</Th>
                  </tr>
                </thead>
                <tbody>
                  {completedTrials.slice(0, 10).map((t) => (
                    <tr key={`completed-trial-${t.id}`}>
                      <Td>
                        <span className="font-semibold text-[#0e7c7b]">{shortId(t.applicantId, 'APT')}</span>
                        <div className="text-[11px] text-[#0b1c33]/50 font-mono mt-0.5">App #{t.applicationId}</div>
                      </Td>
                      <Td>
                        {formatDate(t.date)}
                        <div className="text-[11px] text-[#0b1c33]/60 mt-0.5">{t.centreName}</div>
                      </Td>
                      <Td>
                        <span className="max-w-[200px] truncate block" title={t.remarks || '—'}>
                          {t.remarks || '—'}
                        </span>
                      </Td>
                      <Td>
                        <Badge tone={t.result === 'PASS' ? 'success' : 'danger'}>
                          {t.result}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
