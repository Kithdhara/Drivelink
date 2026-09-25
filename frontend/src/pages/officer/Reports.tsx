import { useStore } from '../../lib/store';
import { STATUS_LABELS } from '../../types';
import type { ApplicationStatus } from '../../types';
import { Card, PageHeader, StatCard } from '../../components/ui';

export default function OfficerReports() {
  const { state } = useStore();
  const byStatus = state.applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  const oneDay = state.applications.filter((a) => a.oneDayService).length;
  const renewals = state.applications.filter((a) => a.type === 'renewal').length;

  return (
    <div>
      <PageHeader kicker="Operations" title="Processing reports" subtitle="Snapshot of the live caseload on this workstation." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total files" value={state.applications.length} tone="ink" />
        <StatCard label="One-Day Service" value={oneDay} tone="gold" />
        <StatCard label="Renewals" value={renewals} tone="teal" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
          <Card key={s}>
            <p className="text-xs tracking-wide text-[#0b1c33]/50 uppercase">{STATUS_LABELS[s]}</p>
            <p className="font-display text-3xl">{byStatus[s] ?? 0}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
