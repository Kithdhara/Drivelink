import { Link } from 'react-router-dom';
import { FileSearch, BadgeCheck, Ban, Clock } from 'lucide-react';
import { useStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import { Button, Card, PageHeader, StatCard, StatusBadge, TableWrap, Td, Th } from '../../components/ui';

export default function OfficerDashboard() {
  const { state } = useStore();
  const queue = state.applications.filter((a) => a.status === 'submitted' || a.status === 'trial_passed');
  const priority = queue.filter((a) => a.oneDayService);
  const approved = state.applications.filter((a) => a.status === 'approved' || a.status === 'license_issued').length;
  const rejected = state.applications.filter((a) => a.status === 'rejected').length;

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
              <Th>File</Th>
              <Th>Applicant</Th>
              <Th>Class</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {[...queue]
              .sort((a, b) => Number(b.oneDayService) - Number(a.oneDayService))
              .slice(0, 8)
              .map((a) => {
                const u = state.users.find((x) => x.id === a.applicantId);
                return (
                  <tr key={a.id} className={a.oneDayService ? 'bg-[#c6a15b]/10' : ''}>
                    <Td className="font-semibold">{a.id}</Td>
                    <Td>
                      {u?.name}
                      <div className="text-[11px] text-[#0b1c33]/45">{a.personal.nic}</div>
                    </Td>
                    <Td>{a.category}</Td>
                    <Td>
                      <StatusBadge status={a.status} />
                    </Td>
                    <Td>{formatDate(a.updatedAt)}</Td>
                    <Td>
                      <Link to={`/officer/applications/${a.id}`}>
                        <Button size="sm">Review</Button>
                      </Link>
                    </Td>
                  </tr>
                );
              })}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
