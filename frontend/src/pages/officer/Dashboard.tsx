import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, BadgeCheck, Ban, Clock } from 'lucide-react';
import { getAllApplicationsAPI, type BackendApplication } from '../../lib/api';
import { Button, Card, PageHeader, Spinner, StatCard, TableWrap, Td, Th } from '../../components/ui';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function OfficerDashboard() {
  const [apps, setApps] = useState<BackendApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllApplicationsAPI()
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const queue = apps.filter((a) => ['pending', 'submitted', 'documents_verified', 'trial_passed'].includes(a.status));
  const priority = queue.filter((a) => a.oneDayService);
  const approved = apps.filter((a) => ['approved', 'license_issued'].includes(a.status)).length;
  const rejected = apps.filter((a) => a.status === 'rejected').length;

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <PageHeader
        kicker="Registration desk"
        title="Licence Registration Officer"
        subtitle="Verify supporting documents, decide completed files and issue licences."
        actions={
          <Link to="/officer/applications">
            <Button>Open full queue</Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Awaiting action" value={queue.length} tone="ink" icon={<Clock />} />
        <StatCard label="One-Day priority" value={priority.length} tone="gold" icon={<FileSearch />} />
        <StatCard label="Approved / issued" value={approved} tone="teal" icon={<BadgeCheck />} />
        <StatCard label="Rejected" value={rejected} tone="rose" icon={<Ban />} />
      </div>
      <Card className="mt-6" pad={false}>
        <div className="px-5 py-4">
          <h2 className="font-display text-xl">Priority & new submissions</h2>
        </div>
        <TableWrap>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Applicant</Th>
              <Th>Class</Th>
              <Th>One-Day</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {[...queue]
              .sort((a, b) => Number(b.oneDayService) - Number(a.oneDayService))
              .slice(0, 8)
              .map((a) => (
                <tr key={a.id} className={a.oneDayService ? 'bg-[#c6a15b]/10' : ''}>
                  <Td className="font-semibold">#{a.id}</Td>
                  <Td>
                    {a.fullName}
                    <div className="text-[11px] text-[#0b1c33]/45">{a.nic}</div>
                  </Td>
                  <Td>{a.licenseClasses}</Td>
                  <Td>{a.oneDayService ? '⚡ Yes' : '—'}</Td>
                  <Td>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                      a.status === 'approved' ? 'bg-green-100 text-green-800'
                        : a.status === 'rejected' ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {a.status}
                    </span>
                  </Td>
                  <Td>{formatDate(a.submittedAt)}</Td>
                  <Td>
                    <Link to={`/officer/applications/${a.id}`}>
                      <Button size="sm">Review</Button>
                    </Link>
                  </Td>
                </tr>
              ))}
            {queue.length === 0 && (
              <tr><Td colSpan={7}><p className="text-sm text-[#0b1c33]/55 text-center py-4">No pending applications.</p></Td></tr>
            )}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
