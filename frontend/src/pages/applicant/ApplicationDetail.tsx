import { useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useStore, locById } from '../../lib/store';
import { formatDate, formatDateTime } from '../../lib/utils';
import { LICENSE_CATEGORIES } from '../../types';
import {
  Alert,
  Badge,
  Button,
  Card,
  PageHeader,
  StatusBadge,
  Timeline,
  PrintReceipt,
} from '../../components/ui';
import { useState } from 'react';

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { state } = useStore();
  const found = state.applications.find((a) => a.id === id);
  if (!found) return <Alert kind="error">Application not found.</Alert>;
  const app = found;
  if (user?.role === 'applicant' && app.applicantId !== user.id) {
    return <Alert kind="error">You do not have permission to view this application file.</Alert>;
  }
  const [showSlip, setShowSlip] = useState(false);

  const meds = state.medicals.filter((m) => m.applicationId === app.id);
  const exams = state.exams.filter((m) => m.applicationId === app.id);
  const trials = state.trials.filter((m) => m.applicationId === app.id);
  const licence = state.licenses.find((l) => l.applicationId === app.id);
  const pays = state.payments.filter((p) => p.applicationId === app.id);

  function printSlip() {
    setShowSlip(true);
  }

  return (
    <div>
      <PageHeader
        kicker={app.type === 'renewal' ? 'Renewal file' : 'New issue'}
        title={`${app.id} · Class ${app.category}`}
        subtitle={`${LICENSE_CATEGORIES.find((c) => c.id === app.category)?.name} · ${app.personal.fullName}`}
        actions={
          <>
            {app.oneDayService && <Badge tone="gold">One-Day Service</Badge>}
            <StatusBadge status={app.status} />
            <Button variant="secondary" onClick={printSlip}>
              Download confirmation
            </Button>
          </>
        }
      />

      {app.status === 'rejected' && (
        <div className="mb-4">
          <Alert kind="error" title="Rejected">
            {app.rejectionReason}
          </Alert>
        </div>
      )}

      <Card className="mb-6">
        <Timeline status={app.status} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl">Applicant particulars</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ['Full name', app.personal.fullName],
              ['NIC', app.personal.nic],
              ['Date of birth', app.personal.dob],
              ['Gender', app.personal.gender],
              ['Address', app.personal.address],
              ['Phone', app.personal.phone],
              ['Email', app.personal.email],
              ['Blood group', app.personal.bloodGroup || '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] tracking-wide text-[#0b1c33]/45 uppercase">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-6 font-display text-lg">Documents</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {app.documents.map((d) => (
              <div key={d.id} className="rounded-xl border border-[#0b1c33]/8 p-3">
                <p className="text-xs font-semibold uppercase">{d.type}</p>
                <p className="truncate text-xs text-[#0b1c33]/55">{d.name}</p>
                {d.mimeType.startsWith('image/') && (
                  <img src={d.dataUrl} alt="" className="mt-2 h-28 w-full rounded object-cover" />
                )}
                <p className="mt-1 text-[11px]">{d.verified ? 'Verified' : 'Awaiting verification'}</p>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          {licence && (
            <Card>
              <p className="text-[11px] tracking-widest text-[#c6a15b] uppercase">Licence</p>
              <p className="font-display text-2xl">{licence.licenseNumber}</p>
              <p className="text-sm">
                Issued {formatDate(licence.issuedAt)} · expires {formatDate(licence.expiresAt)}
              </p>
            </Card>
          )}
          <Card>
            <h3 className="font-display text-lg">Medical</h3>
            {meds.length === 0 ? (
              <p className="mt-2 text-sm text-[#0b1c33]/55">No appointments.</p>
            ) : (
              meds.map((m) => (
                <p key={m.id} className="mt-2 text-sm">
                  {m.date} {m.time} · {locById(state.locations, m.locationId)?.name} · {m.status}
                  {m.result ? ` · ${m.result}` : ''}
                </p>
              ))
            )}
          </Card>
          <Card>
            <h3 className="font-display text-lg">Exam</h3>
            {exams.length === 0 ? (
              <p className="mt-2 text-sm text-[#0b1c33]/55">No bookings.</p>
            ) : (
              exams.map((m) => (
                <p key={m.id} className="mt-2 text-sm">
                  Attempt {m.attempt} · {m.kind} · {m.date} · {m.status}
                  {m.score != null ? ` · ${m.score}` : ''}
                </p>
              ))
            )}
          </Card>
          <Card>
            <h3 className="font-display text-lg">Trial</h3>
            {trials.length === 0 ? (
              <p className="mt-2 text-sm text-[#0b1c33]/55">No bookings.</p>
            ) : (
              trials.map((m) => (
                <p key={m.id} className="mt-2 text-sm">
                  Attempt {m.attempt} · {m.date} {m.time} · {m.status}
                  {m.result ? ` · ${m.result}` : ''}
                </p>
              ))
            )}
          </Card>
          <Card>
            <h3 className="font-display text-lg">Payments</h3>
            {pays.map((p) => (
              <p key={p.id} className="mt-2 text-sm">
                {p.reference} · {p.type} · LKR {p.amount.toLocaleString()}
              </p>
            ))}
          </Card>
        </div>
      </div>

      <PrintReceipt open={showSlip} onClose={() => setShowSlip(false)}>
        <h2>NATIONAL MOTOR TRAFFIC AUTHORITY</h2>
        <h1 className="font-display text-2xl mb-6">Application confirmation {app.id}</h1>
        <table className="w-full text-left">
          <tbody>
            <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Applicant</th><td>{app.personal.fullName}</td></tr>
            <tr className="border-b border-[#0b1c33]/10"><th className="py-2">NIC</th><td>{app.personal.nic}</td></tr>
            <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Class</th><td>{app.category}</td></tr>
            <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Type</th><td className="capitalize">{app.type}</td></tr>
            <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Status</th><td>{app.status}</td></tr>
            <tr className="border-b border-[#0b1c33]/10"><th className="py-2">One-Day</th><td>{app.oneDayService ? 'Yes' : 'No'}</td></tr>
            <tr className="border-b border-[#0b1c33]/10"><th className="py-2">Submitted</th><td>{formatDateTime(app.createdAt)}</td></tr>
          </tbody>
        </table>
        <p className="mt-8 text-sm italic">
          This is a system-generated confirmation. Present this slip with your NIC at any booked appointment.
        </p>
      </PrintReceipt>
    </div>
  );
}
