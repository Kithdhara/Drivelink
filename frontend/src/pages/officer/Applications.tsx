import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import { Badge, PageHeader, SearchBox, Select, StatusBadge, TableWrap, Td, Th } from '../../components/ui';
import type { ApplicationStatus } from '../../types';

export default function OfficerApplications() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [st, setSt] = useState<'all' | ApplicationStatus>('all');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.applications.filter((a) => {
      if (st !== 'all' && a.status !== st) return false;
      if (!needle) return true;
      const u = state.users.find((x) => x.id === a.applicantId);
      return (
        a.id.toLowerCase().includes(needle) ||
        a.personal.nic.toLowerCase().includes(needle) ||
        a.personal.fullName.toLowerCase().includes(needle) ||
        (u?.name.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [state.applications, state.users, q, st]);

  return (
    <div>
      <PageHeader kicker="Casework" title="Application register" subtitle="Search by NIC, name or file number." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <SearchBox value={q} onChange={setQ} placeholder="NIC, name or APP-…" />
        </div>
        <Select value={st} onChange={(e) => setSt(e.target.value as typeof st)}>
          <option value="all">All statuses</option>
          {[
            'submitted',
            'documents_verified',
            'medical_pending',
            'medical_passed',
            'exam_passed',
            'trial_passed',
            'approved',
            'rejected',
            'license_issued',
          ].map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      </div>
      <TableWrap>
        <thead>
          <tr>
            <Th>File</Th>
            <Th>Applicant</Th>
            <Th>Type</Th>
            <Th>Class</Th>
            <Th>Status</Th>
            <Th>Updated</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <Td>
                <Link to={`/officer/applications/${a.id}`} className="font-semibold text-[#0e7c7b]">
                  {a.id}
                </Link>
                {a.oneDayService && (
                  <div>
                    <Badge tone="gold">One-Day</Badge>
                  </div>
                )}
              </Td>
              <Td>
                {a.personal.fullName}
                <div className="text-[11px] text-[#0b1c33]/45">{a.personal.nic}</div>
              </Td>
              <Td className="capitalize">{a.type}</Td>
              <Td>{a.category}</Td>
              <Td>
                <StatusBadge status={a.status} />
              </Td>
              <Td>{formatDate(a.updatedAt)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}
