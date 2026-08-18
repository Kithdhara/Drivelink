import { Link } from 'react-router-dom';
import { Users, Banknote, FileCheck, Shield } from 'lucide-react';
import { useStore } from '../../lib/store';
import { formatMoney } from '../../lib/utils';
import { Button, Card, PageHeader, StatCard } from '../../components/ui';

export default function AdminDashboard() {
  const { state, resetDemo } = useStore();
  const revenue = state.payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const issued = state.licenses.length;
  const activeUsers = state.users.filter((u) => u.active).length;
  const exams = state.exams.filter((e) => e.result);
  const passRate = exams.length ? Math.round((exams.filter((e) => e.result === 'pass').length / exams.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        kicker="Control room"
        title="System Administrator"
        subtitle="Accounts, revenue, pass rates and the immutable audit trail."
        actions={
          <>
            <Link to="/admin/users">
              <Button>Manage users</Button>
            </Link>
            <Button variant="secondary" onClick={() => resetDemo()}>
              Reset demo data
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active accounts" value={activeUsers} tone="ink" icon={<Users />} />
        <StatCard label="Revenue collected" value={formatMoney(revenue)} tone="gold" icon={<Banknote />} />
        <StatCard label="Licences issued" value={issued} tone="teal" icon={<FileCheck />} />
        <StatCard label="Exam pass rate" value={`${passRate}%`} tone="rose" icon={<Shield />} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Recent audit events</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {state.audit.slice(0, 6).map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span>
                  <strong>{a.action}</strong> · {a.details}
                </span>
                <span className="shrink-0 text-[#0b1c33]/45">{a.userName}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Open complaints</h2>
          {state.complaints
            .filter((c) => c.status !== 'resolved')
            .map((c) => (
              <p key={c.id} className="mt-2 text-sm">
                {c.subject} · {c.status}
              </p>
            ))}
          <Link to="/admin/complaints" className="mt-3 inline-block text-sm font-semibold text-[#0e7c7b]">
            Review all →
          </Link>
        </Card>
      </div>
    </div>
  );
}
