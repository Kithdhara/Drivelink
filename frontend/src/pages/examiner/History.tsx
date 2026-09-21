import { useEffect, useState } from 'react';
import { getAllExamsAPI, getAllTrialsAPI, type BackendExamBooking, type BackendTrialBooking } from '../../lib/api';
import { Badge, PageHeader, SearchBox, Spinner, TableWrap, Td, Th } from '../../components/ui';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ExaminerHistory() {
  const [exams, setExams] = useState<BackendExamBooking[]>([]);
  const [trials, setTrials] = useState<BackendTrialBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    Promise.all([
      getAllExamsAPI().catch(() => []),
      getAllTrialsAPI().catch(() => []),
    ]).then(([e, t]) => {
      setExams(e);
      setTrials(t);
    }).finally(() => setLoading(false));
  }, []);

  const needle = q.trim().toLowerCase();
  const rows = [
    ...exams.map((e) => ({
      id: `exam-${e.id}`,
      kind: 'Exam (MCQ)',
      applicationId: String(e.applicationId),
      applicantId: e.applicantId,
      centreName: e.centreName,
      date: e.date,
      attempt: e.attempt,
      result: e.result,
      score: e.score,
      status: e.status,
    })),
    ...trials.map((t) => ({
      id: `trial-${t.id}`,
      kind: 'Trial',
      applicationId: String(t.applicationId),
      applicantId: t.applicantId,
      centreName: t.centreName,
      date: t.date,
      attempt: t.attempt,
      result: t.result,
      score: undefined as number | undefined | null,
      status: t.status,
    })),
  ]
    .filter((r) => {
      if (!needle) return true;
      return (
        r.applicationId.toLowerCase().includes(needle) ||
        r.applicantId.toLowerCase().includes(needle) ||
        r.centreName.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <PageHeader kicker="Archive" title="Attempt history" subtitle="Search any applicant's previous exam and trial attempts." />
      <div className="mb-4 max-w-md">
        <SearchBox value={q} onChange={setQ} placeholder="Applicant ID, App ID or Centre" />
      </div>
      <TableWrap>
        <thead>
          <tr>
            <Th>Applicant</Th>
            <Th>Application</Th>
            <Th>Event</Th>
            <Th>Centre</Th>
            <Th>Date</Th>
            <Th>Attempt</Th>
            <Th>Result</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td>{r.applicantId}</Td>
              <Td>#{r.applicationId}</Td>
              <Td>{r.kind}</Td>
              <Td>{r.centreName}</Td>
              <Td>{formatDate(r.date)}</Td>
              <Td>{r.attempt}</Td>
              <Td>
                <Badge tone={r.result === 'PASS' ? 'success' : r.result === 'FAIL' ? 'danger' : 'neutral'}>
                  {r.result ?? r.status}
                  {r.score != null ? ` · ${r.score}/40` : ''}
                </Badge>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><Td colSpan={7}><p className="text-sm text-[#0b1c33]/55 text-center py-4">No history found.</p></Td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}
