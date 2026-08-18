import { useState } from 'react';
import { useStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import { Badge, PageHeader, SearchBox, TableWrap, Td, Th } from '../../components/ui';

export default function ExaminerHistory() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();

  const rows = [
    ...state.exams.map((e) => ({
      id: e.id,
      kind: `Exam · ${e.kind}`,
      applicationId: e.applicationId,
      applicantId: e.applicantId,
      date: e.date,
      attempt: e.attempt,
      result: e.result,
      score: e.score,
      status: e.status,
    })),
    ...state.trials.map((e) => ({
      id: e.id,
      kind: 'Trial',
      applicationId: e.applicationId,
      applicantId: e.applicantId,
      date: e.date,
      attempt: e.attempt,
      result: e.result,
      score: undefined as number | undefined,
      status: e.status,
    })),
  ]
    .filter((r) => {
      if (!needle) return true;
      const u = state.users.find((x) => x.id === r.applicantId);
      return (
        r.applicationId.toLowerCase().includes(needle) ||
        (u?.name.toLowerCase().includes(needle) ?? false) ||
        (u?.nic.toLowerCase().includes(needle) ?? false)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader kicker="Archive" title="Attempt history" subtitle="Search any applicant’s previous exam and trial attempts." />
      <div className="mb-4 max-w-md">
        <SearchBox value={q} onChange={setQ} placeholder="Name, NIC or file number" />
      </div>
      <TableWrap>
        <thead>
          <tr>
            <Th>Applicant</Th>
            <Th>File</Th>
            <Th>Event</Th>
            <Th>Date</Th>
            <Th>Attempt</Th>
            <Th>Result</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const u = state.users.find((x) => x.id === r.applicantId);
            return (
              <tr key={r.id}>
                <Td>
                  {u?.name}
                  <div className="text-[11px] text-[#0b1c33]/45">{u?.nic}</div>
                </Td>
                <Td>{r.applicationId}</Td>
                <Td>{r.kind}</Td>
                <Td>{formatDate(r.date)}</Td>
                <Td>{r.attempt}</Td>
                <Td>
                  <Badge tone={r.result === 'pass' ? 'success' : r.result === 'fail' ? 'danger' : 'neutral'}>
                    {r.result ?? r.status}
                    {r.score != null ? ` · ${r.score}` : ''}
                  </Badge>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>
    </div>
  );
}
