import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { FEES } from '../../types';
import type { PaymentMethod, PaymentType } from '../../types';
import { formatDateTime, formatMoney } from '../../lib/utils';
import {
  createPaymentAPI,
  getPaymentsByUserAPI,
  getApplicationsByApplicantAPI,
  type BackendPaymentRecord,
  type BackendApplication,
} from '../../lib/api';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, TableWrap, Td, Th, PrintReceipt } from '../../components/ui';

export default function Payments() {
  const { user } = useAuth();
  const location = useLocation();
  const initialState = location.state as { appId?: string; type?: PaymentType } | null;
  
  const [type, setType] = useState<PaymentType>(initialState?.type || 'application');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [appId, setAppId] = useState(initialState?.appId || '');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [msg, setMsg] = useState('');
  const [printId, setPrintId] = useState<number | null>(null);

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    let formatted = val;
    if (val.length > 0) {
      formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    }
    setCard(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setExpiry(val);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    setCvv(val);
  };

  const [payments, setPayments] = useState<BackendPaymentRecord[]>([]);
  const [apps, setApps] = useState<BackendApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getPaymentsByUserAPI(user.id).catch(() => []),
      getApplicationsByApplicantAPI(user.id).catch(() => []),
    ]).then(([pData, aData]) => {
      setPayments(pData);
      setApps(aData);
      setLoading(false);
    });
  }, [user]);

  if (!user) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');

    if (method === 'card') {
      const plainCard = card.replace(/\s/g, '');
      if (plainCard.length !== 16) {
        setMsg('Error: Card number must be exactly 16 digits.');
        return;
      }
      if (expiry.length !== 5) {
        setMsg('Error: Expiry date must be in MM/YY format.');
        return;
      }
      if (cvv.length < 3) {
        setMsg('Error: CVV must be 3 or 4 digits.');
        return;
      }
      const month = parseInt(expiry.split('/')[0], 10);
      if (month < 1 || month > 12) {
        setMsg('Error: Invalid expiry month.');
        return;
      }
    }

    setBusy(true);
    try {
      const amount = FEES[type as keyof typeof FEES];
      const rec = await createPaymentAPI({
        userId: user!.id,
        applicationId: appId || undefined,
        type,
        method,
        amount,
      });
      setPayments([rec, ...payments]);
      setMsg(`Payment ${rec.reference} recorded successfully.`);
    } catch (err: any) {
      setMsg(`Error: ${err.message || 'Payment failed'}`);
    } finally {
      setBusy(false);
    }
  }

  function receipt(id: number) {
    setPrintId(id);
  }

  const p = printId ? payments.find((x) => x.id === printId) : null;

  return (
    <div>
      <PageHeader kicker="Treasury" title="Payments & receipts" subtitle="Settle application, test, one-day and renewal fees. Your transaction history is securely retained." />
      {msg && <Alert kind={msg.startsWith('Error') ? 'error' : 'success'}>{msg}</Alert>}
      
      <div className="mt-5 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl text-[#0b1c33]">Make a payment</h2>
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
                    App #{a.id} — Class {a.licenseClasses} ({a.status})
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
              <>
                <Field label="Card number" hint="e.g. 4242 4242 4242 4242">
                  <Input 
                    value={card} 
                    onChange={handleCardChange} 
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry date" hint="MM/YY">
                    <Input 
                      value={expiry} 
                      onChange={handleExpiryChange} 
                      placeholder="MM/YY" 
                      maxLength={5} 
                    />
                  </Field>
                  <Field label="CVV" hint="3 or 4 digits">
                    <Input 
                      value={cvv} 
                      onChange={handleCvvChange} 
                      placeholder="123" 
                      maxLength={4} 
                      type="password"
                    />
                  </Field>
                </div>
              </>
            )}
            <Button type="submit" variant="gold" disabled={busy}>
              {busy ? 'Processing...' : `Pay ${formatMoney(FEES[type])}`}
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
              {loading ? (
                <tr>
                  <Td colSpan={5} className="text-center py-4">Loading history...</Td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <Td colSpan={5} className="text-center py-4">No payment history found.</Td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-mono text-xs text-[#0b1c33]/70">{p.reference}</Td>
                    <Td>
                      <span className="capitalize">{p.type.replace('_', ' ')}</span>
                      {p.applicationId && <span className="ml-1 text-[#0b1c33]/50">· App #{p.applicationId}</span>}
                    </Td>
                    <Td className="font-semibold">{formatMoney(p.amount)}</Td>
                    <Td>
                      <Badge tone={p.status === 'paid' ? 'success' : 'warn'}>{p.status}</Badge>
                      <div className="text-[11px] text-[#0b1c33]/45 mt-0.5">{formatDateTime(p.createdAt)}</div>
                    </Td>
                    <Td>
                      <Button size="sm" variant="ghost" onClick={() => receipt(p.id)}>
                        PDF
                      </Button>
                    </Td>
                  </tr>
                ))
              )}
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
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Payer</th><td>{user.name} · {user.nic}</td></tr>
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Type</th><td className="capitalize">{p.type.replace('_', ' ')} · {p.method}</td></tr>
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Amount</th><td>{formatMoney(p.amount)}</td></tr>
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Status</th><td className="capitalize">{p.status} · {formatDateTime(p.createdAt)}</td></tr>
                <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Application ID</th><td>{p.applicationId ?? 'N/A'}</td></tr>
              </tbody>
            </table>
          </>
        )}
      </PrintReceipt>
    </div>
  );
}
