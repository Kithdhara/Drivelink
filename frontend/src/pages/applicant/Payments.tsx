import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { FEES } from '../../types';
import type { PaymentMethod, PaymentType } from '../../types';
import { formatDateTime, formatMoney } from '../../lib/utils';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, TableWrap, Td, Th, PrintReceipt } from '../../components/ui';

export default function Payments() {
  const { user } = useAuth();
  const { state, pay } = useStore();
  const [type, setType] = useState<PaymentType>('application');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [appId, setAppId] = useState('');
  const [card, setCard] = useState('4242424242424242');
  const [msg, setMsg] = useState('');
  const [printId, setPrintId] = useState<string | null>(null);

  if (!user) return null;
  const me = user;
  const rows = state.payments.filter((p) => p.userId === me.id);
  const apps = state.applications.filter((a) => a.applicantId === me.id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const last4 = card.replace(/\s/g, '').slice(-4);
    const rec = pay({ userId: me.id, applicationId: appId || undefined, type, method, cardLast4: last4 });
    setMsg(`Payment ${rec.reference} recorded.`);
  }

  function receipt(id: string) {
    setPrintId(id);
  }

  const p = printId ? rows.find((x) => x.id === printId) : null;

  return (
    <div>
      <PageHeader kicker="Treasury" title="Payments & receipts" subtitle="Settle application, test, one-day and renewal fees. History is retained on this device." />
      {msg && <Alert kind="success">{msg}</Alert>}
      <div className="mt-5 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl">Make a payment</h2>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Field label="Fee type">
              <Select value={type} onChange={(e) => setType(e.target.value as PaymentType)}>
                {Object.entries(FEES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {k.replace('_', ' ')} — {formatMoney(v)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Link to application">
              <Select value={appId} onChange={(e) => setAppId(e.target.value)}>
                <option value="">Unlinked</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Method">
              <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                <option value="card">Card</option>
                <option value="bank">Bank transfer</option>
                <option value="wallet">LankaQR / wallet</option>
              </Select>
            </Field>
            {method === 'card' && (
              <Field label="Card number" hint="Demo only — any 16 digits">
                <Input value={card} onChange={(e) => setCard(e.target.value)} />
              </Field>
            )}
            <Button type="submit" variant="gold">
              Pay {formatMoney(FEES[type])}
            </Button>
          </form>
        </Card>
        <div className="lg:col-span-3">
          <TableWrap>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Type</Th>
                <Th>Amount</Th>
                <Th>When</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <Td className="font-mono text-xs">{p.reference}</Td>
                  <Td>
                    {p.type} {p.applicationId ? `· ${p.applicationId}` : ''}
                  </Td>
                  <Td>{formatMoney(p.amount)}</Td>
                  <Td>
                    <Badge tone={p.status === 'paid' ? 'success' : 'warn'}>{p.status}</Badge>
                    <div className="text-[11px] text-[#0b1c33]/45">{formatDateTime(p.createdAt)}</div>
                  </Td>
                  <Td>
                    <Button size="sm" variant="ghost" onClick={() => receipt(p.id)}>
                      PDF
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </div>

      <PrintReceipt open={!!p} onClose={() => setPrintId(null)}>
        {p && (
          <>
            <h2>NATIONAL MOTOR TRAFFIC AUTHORITY</h2>
            <h1 className="font-display text-3xl mb-6">Official receipt</h1>
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Reference</th><td className="font-mono">{p.reference}</td></tr>
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Payer</th><td>{me.name} · {me.nic}</td></tr>
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Type</th><td className="capitalize">{p.type} · {p.method}</td></tr>
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Amount</th><td>{formatMoney(p.amount)}</td></tr>
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Status</th><td className="capitalize">{p.status} · {formatDateTime(p.createdAt)}</td></tr>
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Application</th><td>{p.applicationId ?? '—'}</td></tr>
              </tbody>
            </table>
          </>
        )}
      </PrintReceipt>
    </div>
  );
}
