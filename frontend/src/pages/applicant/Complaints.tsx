import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { formatDateTime } from '../../lib/utils';
import type { Complaint } from '../../types';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Textarea } from '../../components/ui';

export default function Complaints() {
  const { user } = useAuth();
  const { state, addComplaint } = useStore();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<Complaint['category']>('service');
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState('');

  if (!user) return null;
  const me = user;
  const mine = state.complaints.filter((c) => c.userId === me.id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (subject.trim().length < 4 || message.trim().length < 10) return;
    addComplaint({ userId: me.id, subject, category, message });
    setSubject('');
    setMessage('');
    setOk('Inquiry lodged. A registration officer or administrator will respond.');
  }

  return (
    <div>
      <PageHeader kicker="Help desk" title="Complaints & inquiries" subtitle="Use this channel for service delays, booking issues or staff conduct." />
      {ok && <Alert kind="success">{ok}</Alert>}
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">New inquiry</h2>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Field label="Subject" required>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value as Complaint['category'])}>
                <option value="service">Service delay</option>
                <option value="booking">Booking</option>
                <option value="payment">Payment</option>
                <option value="staff">Staff conduct</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Details" required>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
            </Field>
            <Button type="submit">Submit</Button>
          </form>
        </Card>
        <div className="space-y-3">
          {mine.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{c.subject}</p>
                <Badge tone={c.status === 'resolved' ? 'success' : c.status === 'open' ? 'warn' : 'info'}>{c.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-[#0b1c33]/70">{c.message}</p>
              {c.response && (
                <p className="mt-2 rounded-lg bg-[#f6f1e7] p-3 text-sm">
                  <strong>Reply: </strong>
                  {c.response}
                </p>
              )}
              <p className="mt-2 text-[11px] text-[#0b1c33]/45">{formatDateTime(c.createdAt)}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
