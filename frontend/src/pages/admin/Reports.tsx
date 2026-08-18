import { useStore } from '../../lib/store';
import { FEES } from '../../types';
import type { PaymentType } from '../../types';
import { formatMoney } from '../../lib/utils';
import { Card, PageHeader, StatCard } from '../../components/ui';

export default function AdminReports() {
  const { state } = useStore();
  const paid = state.payments.filter((p) => p.status === 'paid');
  const byType = paid.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + p.amount;
    return acc;
  }, {});
  const examPass = state.exams.filter((e) => e.result === 'pass').length;
  const examFail = state.exams.filter((e) => e.result === 'fail').length;
  const trialPass = state.trials.filter((e) => e.result === 'pass').length;
  const trialFail = state.trials.filter((e) => e.result === 'fail').length;
  const medPass = state.medicals.filter((e) => e.result === 'pass').length;
  const medFail = state.medicals.filter((e) => e.result === 'fail').length;

  const maxRev = Math.max(1, ...Object.values(byType));

  return (
    <div>
      <PageHeader kicker="Intelligence" title="System analytics" subtitle="Applications processed, pass/fail rates and treasury yield." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Applications" value={state.applications.length} tone="ink" />
        <StatCard label="Gross receipts" value={formatMoney(paid.reduce((s, p) => s + p.amount, 0))} tone="gold" />
        <StatCard label="Active licences" value={state.licenses.filter((l) => l.status === 'active').length} tone="teal" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Revenue by fee type</h2>
          <ul className="mt-4 space-y-3">
            {(Object.keys(FEES) as PaymentType[]).map((t) => {
              const v = byType[t] ?? 0;
              return (
                <li key={t}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize">{t.replace('_', ' ')}</span>
                    <span className="font-semibold">{formatMoney(v)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#0b1c33]/8">
                    <div className="h-full bg-[#c6a15b]" style={{ width: `${(v / maxRev) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Outcome rates</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              ['Medical', medPass, medFail],
              ['Exam', examPass, examFail],
              ['Trial', trialPass, trialFail],
            ].map(([l, p, f]) => (
              <div key={String(l)} className="rounded-xl bg-[#f6f1e7] p-3">
                <p className="text-xs tracking-wide uppercase">{l}</p>
                <p className="font-display text-2xl text-[#0e7c7b]">{p}</p>
                <p className="text-xs text-[#9f1239]">{f} failed</p>
              </div>
            ))}
          </div>
          <h3 className="mt-6 text-sm font-semibold">Files by class</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {['A', 'A1', 'B', 'B1', 'C', 'C1', 'D', 'G', 'CE'].map((c) => (
              <li key={c} className="flex justify-between">
                <span>Class {c}</span>
                <span>{state.applications.filter((a) => a.category === c).length}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
