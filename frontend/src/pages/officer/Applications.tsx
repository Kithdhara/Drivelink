import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllApplicationsAPI, type BackendApplication } from '../../lib/api';
import { Input, PageHeader, Select, TableWrap, Td, Th } from '../../components/ui';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_OPTIONS = ['all', 'pending', 'approved', 'rejected'];

export default function OfficerApplications() {
  const [apps, setApps] = useState<BackendApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [st, setSt] = useState('all');

  useEffect(() => {
    getAllApplicationsAPI()
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return apps.filter((a) => {
      if (st !== 'all' && a.status !== st) return false;
      if (!needle) return true;
      return (
        String(a.id).includes(needle) ||
        a.nic.toLowerCase().includes(needle) ||
        a.fullName.toLowerCase().includes(needle) ||
        a.applicantName.toLowerCase().includes(needle)
      );
    });
  }, [apps, q, st]);

  return (
    <div>
      <PageHeader kicker="Casework" title="Application register" subtitle="All submitted applications from SQL Server." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="NIC, name or ID…"
          />
        </div>
        <Select value={st} onChange={(e) => setSt(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-[#0b1c33]/55 py-8 text-center">Loading applications…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#0b1c33]/55 py-8 text-center">No applications found.</p>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Applicant</Th>
              <Th>Class(es)</Th>
              <Th>One-Day</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <Td>
                  <span className="font-semibold">#{a.id}</span>
                </Td>
                <Td>
                  {a.fullName}
                  <div className="text-[11px] text-[#0b1c33]/45">{a.nic}</div>
                </Td>
                <Td>{a.licenseClasses}</Td>
                <Td>{a.oneDayService ? '⚡ Yes' : '—'}</Td>
                <Td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                      a.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : a.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {a.status}
                  </span>
                </Td>
                <Td>{formatDate(a.submittedAt)}</Td>
                <Td>
                  <Link
                    to={`/officer/applications/${a.id}`}
                    className="rounded-lg bg-[#0b1c33] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0b1c33]/80"
                  >
                    Review
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
