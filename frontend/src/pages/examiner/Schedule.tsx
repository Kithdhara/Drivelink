import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Spinner, Textarea } from '../../components/ui';
import { useToast } from '../../components/Toast';
import {
  getAllExamsAPI,
  getAllTrialsAPI,
  recordExamResultAPI,
  recordTrialResultAPI,
  type BackendExamBooking,
  type BackendTrialBooking,
} from '../../lib/api';

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
      <div className="mt-4 mb-6 flex border-b border-[#0b1c33]/15">
        <button
          type="button"
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'exams'
              ? 'border-[#0e7c7b] text-[#0e7c7b]'
              : 'border-transparent text-[#0b1c33]/60 hover:text-[#0b1c33]'
          }`}
        >
          <span>🖥️ Computerized Theory Exams</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === 'exams' ? 'bg-[#0e7c7b]/15 text-[#0e7c7b]' : 'bg-stone-200 text-stone-700'}`}>
            {pendingExams.length} pending
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trials')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'trials'
              ? 'border-[#0e7c7b] text-[#0e7c7b]'
              : 'border-transparent text-[#0b1c33]/60 hover:text-[#0b1c33]'
          }`}
        >
          <span>🚗 Practical Driving Trials</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === 'trials' ? 'bg-[#0e7c7b]/15 text-[#0e7c7b]' : 'bg-stone-200 text-stone-700'}`}>
            {pendingTrials.length} pending
          </span>
        </button>
      </div>

      {/* Tab 1: Computerized Theory Exams */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#0e7c7b]/20 bg-[#0e7c7b]/5 p-4 text-sm text-[#0b1c33]">
            <p className="font-semibold text-[#0e7c7b]">Theory Examination Guidelines</p>
            <p className="mt-1 text-xs text-[#0b1c33]/80">
              40 Multiple-Choice Questions (MCQ) · 1 Hour Duration. Pass mark is 30/40.
              If an applicant <strong>Passes</strong>, they immediately unlock practical trial booking.
              If an applicant <strong>Fails</strong>, their status is set to <code className="rounded bg-red-100 px-1 py-0.5 text-red-800">exam_failed</code> and they can rebook the examination.
            </p>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold text-[#0b1c33]">Pending Theory Exams ({pendingExams.length})</h3>
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
                            Applicant ID: <span className="font-mono text-[#0e7c7b]">{e.applicantId}</span> · App #{e.applicationId}
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
            <div className="mt-8 border-t border-[#0b1c33]/10 pt-6">
              <h3 className="font-display text-lg font-semibold text-[#0b1c33]/80">Completed Exams ({completedExams.length})</h3>
              <div className="mt-3 space-y-3">
                {completedExams.slice(0, 10).map((e) => (
                  <Card key={`completed-exam-${e.id}`} className="bg-stone-50/70">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Applicant {e.applicantId}</span> · App #{e.applicationId} · {formatDate(e.date)} · {e.centreName}
                        <span className="text-xs text-[#0b1c33]/60 ml-2">Score: {e.score ?? '-'}/40</span>
                      </div>
                      <Badge tone={e.result === 'PASS' ? 'success' : 'danger'}>
                        {e.result}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Practical Driving Trials */}
      {activeTab === 'trials' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-amber-600/20 bg-amber-500/5 p-4 text-sm text-[#0b1c33]">
            <p className="font-semibold text-amber-800">Practical Road Test Assessment</p>
            <p className="mt-1 text-xs text-[#0b1c33]/80">
              Only applicants who have successfully passed the Computerized Theory Examination are eligible for the practical road test.
              Grading covers vehicle handling, road signs, traffic observance, and safe maneuvering.
            </p>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold text-[#0b1c33]">Pending Practical Trials ({pendingTrials.length})</h3>
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
                            Applicant ID: <span className="font-mono text-[#0e7c7b]">{t.applicantId}</span> · App #{t.applicationId}
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
            <div className="mt-8 border-t border-[#0b1c33]/10 pt-6">
              <h3 className="font-display text-lg font-semibold text-[#0b1c33]/80">Completed Trials ({completedTrials.length})</h3>
              <div className="mt-3 space-y-3">
                {completedTrials.slice(0, 10).map((t) => (
                  <Card key={`completed-trial-${t.id}`} className="bg-stone-50/70">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Applicant {t.applicantId}</span> · App #{t.applicationId} · {formatDate(t.date)} · {t.centreName}
                        {t.remarks && <p className="text-xs text-[#0b1c33]/60 mt-0.5">{t.remarks}</p>}
                      </div>
                      <Badge tone={t.result === 'PASS' ? 'success' : 'danger'}>
                        {t.result}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
