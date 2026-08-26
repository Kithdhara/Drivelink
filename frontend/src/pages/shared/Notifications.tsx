import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { formatDateTime } from '../../lib/utils';
import { Badge, Button, Card, Empty, PageHeader } from '../../components/ui';

export default function Notifications() {
  const { user } = useAuth();
  const { state, markRead, markAllRead } = useStore();
  if (!user) return null;
  const items = state.notifications.filter((n) => n.userId === user.id);

  return (
    <div>
      <PageHeader
        kicker="Inbox"
        title="Notifications"
        subtitle="Booking confirmations, approvals, rejections and expiry reminders."
        actions={
          <Button variant="secondary" onClick={() => markAllRead(user.id)}>
            Mark all read
          </Button>
        }
      />
      {items.length === 0 ? (
        <Card>
          <Empty title="No notices yet" hint="Confirmations and status changes will appear here." />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card key={n.id} className={n.read ? 'opacity-75' : 'ring-1 ring-[#c6a15b]/40'}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{n.title}</p>
                    <Badge
                      tone={
                        n.kind === 'success' ? 'success' : n.kind === 'error' ? 'danger' : n.kind === 'warning' ? 'warn' : 'info'
                      }
                    >
                      {n.kind}
                    </Badge>
                    {!n.read && <Badge tone="gold">New</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-[#0b1c33]/70">{n.message}</p>
                  <p className="mt-2 text-xs text-[#0b1c33]/45">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                  {n.link && (
                    <Link to={n.link}>
                      <Button size="sm">Open</Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
