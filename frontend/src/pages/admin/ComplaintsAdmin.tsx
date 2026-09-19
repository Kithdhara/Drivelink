import { useState } from 'react';
import { useStore } from '../../lib/store';
import { formatDateTime } from '../../lib/utils';
import { Badge, Button, Card, Field, PageHeader, Textarea } from '../../components/ui';

export default function ComplaintsAdmin() {
  const { state, respondComplaint } = useStore();
  const [draft, setDraft] = useState<Record<string, string>>({});

  return (
    <div>
      <PageHeader kicker="Service recovery" title="Complaints inbox" subtitle="Respond to citizen inquiries and close resolved tickets." />
      <div className="space-y-4">
        {state.complaints.map((c) => {
          const u = state.users.find((x) => x.id === c.userId);
          return (
            <Card key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.subject}</p>
                  <p className="text-xs text-[#0b1c33]/50">
                    {u?.name} · {c.category} · {formatDateTime(c.createdAt)}
                  </p>
                </div>
                <Badge tone={c.status === 'resolved' ? 'success' : c.status === 'open' ? 'warn' : 'info'}>{c.status}</Badge>
              </div>
              <p className="mt-3 text-sm">{c.message}</p>
              {c.response && <p className="mt-2 rounded-lg bg-[#f6f1e7] p-3 text-sm">{c.response}</p>}
              <Field label="Reply">
                <Textarea
                  value={draft[c.id] ?? c.response ?? ''}
                  onChange={(e) => setDraft({ ...draft, [c.id]: e.target.value })}
                />
              </Field>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => respondComplaint(c.id, draft[c.id] ?? '', 'in_progress')}>
                  Mark in progress
                </Button>
                <Button size="sm" onClick={() => respondComplaint(c.id, draft[c.id] ?? '', 'resolved')}>
                  Resolve
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
