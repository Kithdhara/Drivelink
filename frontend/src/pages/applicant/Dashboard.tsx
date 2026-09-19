import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CreditCard,
  FilePlus2,
  Bell,
  Download,
  Stethoscope,
  ClipboardList,
  UserCheck,
  GraduationCap,
  Car,
  Award,
  CheckCircle2,
  Clock,
  Lock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { formatDate, formatMoney } from '../../lib/utils';
import {
  getApplicationsByApplicantAPI,
  getMedicalsByApplicantAPI,
  getExamsByApplicantAPI,
  getTrialsByApplicantAPI,
  getTrainersByApplicantAPI,
  getLicensesByApplicantAPI,
  type BackendApplication,
  type BackendMedicalAppointment,
  type BackendExamBooking,
  type BackendTrialBooking,
  type BackendTrainerBooking,
  type BackendLicenseRecord,
} from '../../lib/api';
import {
  Button,
  Card,
  Empty,
  PageHeader,
  StatCard,
  Alert,
} from '../../components/ui';

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const { state } = useStore();
  if (!user) return null;

  // Real backend states
  const [apps, setApps] = useState<BackendApplication[]>([]);
  const [medicals, setMedicals] = useState<BackendMedicalAppointment[]>([]);
  const [exams, setExams] = useState<BackendExamBooking[]>([]);
  const [trials, setTrials] = useState<BackendTrialBooking[]>([]);
  const [trainers, setTrainers] = useState<BackendTrainerBooking[]>([]);
  const [licences, setLicences] = useState<BackendLicenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getApplicationsByApplicantAPI(user.id).catch(() => []),
      getMedicalsByApplicantAPI(user.id).catch(() => []),
      getExamsByApplicantAPI(user.id).catch(() => []),
      getTrialsByApplicantAPI(user.id).catch(() => []),
      getTrainersByApplicantAPI(user.id).catch(() => []),
      getLicensesByApplicantAPI(user.id).catch(() => []),
    ]).then(([a, m, e, t, tr, l]) => {
      setApps(a);
      setMedicals(m);
      setExams(e);
      setTrials(t);
      setTrainers(tr);
      setLicences(l);
    }).finally(() => setLoading(false));
  }, [user.id]);

  const latest = apps[0];
  const isRejected = latest?.status === 'rejected';
  const isApproved = ['approved', 'exam_booked', 'exam_passed', 'trial_booked', 'trial_passed', 'license_issued'].includes(latest?.status ?? '');

  // Calculate upcoming appointments
  const upcoming = [
    ...medicals.filter((m) => m.status === 'BOOKED').map((m) => ({ id: `med-${m.id}`, title: 'Medical Examination', date: m.date, time: m.timeSlot, centre: m.centreName, link: '/app/medical' })),
    ...exams.filter((m) => m.status === 'BOOKED').map((m) => ({ id: `exam-${m.id}`, title: 'Theory Examination', date: m.date, time: m.timeSlot, centre: m.centreName, link: '/app/exam' })),
    ...trials.filter((m) => m.status === 'BOOKED').map((m) => ({ id: `trial-${m.id}`, title: 'Driving Trial', date: m.date, time: m.timeSlot, centre: m.centreName, link: '/app/trial' })),
  ].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const unread = state.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const paid = state.payments.filter((p) => p.userId === user.id && p.status === 'paid');

  // Sequential pipeline calculations
  const hasMedical = medicals.length > 0;
  const medicalPassed = medicals.some((m) => m.result === 'PASS');
  const hasApp = apps.length > 0 && !isRejected;
  const officerApproved = isApproved;
  const examPassed = exams.some((e) => e.result === 'PASS') || ['exam_passed', 'trial_booked', 'trial_passed', 'license_issued'].includes(latest?.status ?? '');
  const trialPassed = trials.some((t) => t.result === 'PASS') || latest?.status === 'trial_passed' || latest?.status === 'license_issued';
  const hasTrainer = trainers.length > 0;
  const licenseIssued = licences.length > 0 || latest?.status === 'license_issued';

  const pipelineSteps = [
    {
      num: 1,
      title: 'Medical Booking',
      desc: medicalPassed ? 'Passed' : hasMedical ? 'Booked' : 'Book NTMI test',
      status: medicalPassed ? 'completed' : hasMedical ? 'active' : 'current',
      to: '/app/medical',
      icon: Stethoscope,
    },
    {
      num: 2,
      title: 'Licence Application',
      desc: isRejected ? 'Rejected (Reapply)' : hasApp ? 'Submitted' : hasMedical ? 'Ready to Apply' : 'Locked',
      status: isRejected ? 'rejected' : hasApp ? 'completed' : hasMedical ? 'current' : 'locked',
      to: '/app/apply',
      icon: FilePlus2,
    },
    {
      num: 3,
      title: 'Officer Review',
      desc: isRejected ? 'Rejected' : officerApproved ? 'Approved' : hasApp ? 'Under Review' : 'Locked',
      status: isRejected ? 'rejected' : officerApproved ? 'completed' : hasApp ? 'active' : 'locked',
      to: latest ? `/app/applications/${latest.id}` : '/app/apply',
      icon: UserCheck,
    },
    {
      num: 4,
      title: 'Theory Exam',
      desc: examPassed ? 'Passed' : exams.some(e => e.status === 'BOOKED') ? 'Booked' : officerApproved ? 'Ready to Book' : 'Locked',
      status: examPassed ? 'completed' : exams.some(e => e.status === 'BOOKED') ? 'active' : officerApproved ? 'current' : 'locked',
      to: '/app/exam',
      icon: ClipboardList,
    },
    {
      num: 5,
      title: 'Driving Trial',
      desc: trialPassed ? 'Passed' : trials.some(t => t.status === 'BOOKED') ? 'Booked' : examPassed ? 'Ready to Book' : 'Locked',
      status: trialPassed ? 'completed' : trials.some(t => t.status === 'BOOKED') ? 'active' : examPassed ? 'current' : 'locked',
      to: '/app/trial',
      icon: Car,
    },
    {
      num: 6,
      title: 'Trainer Booking',
      desc: hasTrainer ? 'Arranged' : trials.some(t => t.status === 'BOOKED') ? 'Ready to Assign' : 'Locked',
      status: hasTrainer ? 'completed' : trials.some(t => t.status === 'BOOKED') ? 'current' : 'locked',
      to: '/app/trial',
      icon: GraduationCap,
    },
    {
      num: 7,
      title: 'Licence Issuance',
      desc: licenseIssued ? 'Issued' : trialPassed ? 'Ready for Issuance' : 'Locked',
      status: licenseIssued ? 'completed' : trialPassed ? 'active' : 'locked',
      to: latest ? `/app/applications/${latest.id}` : '/app',
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={`Good day, ${user.name.split(' ')[0]}`}
        title="Your licence workspace"
        subtitle="Track every sequential milestone from medical fitness to card collection."
        actions={
          <div className="flex gap-2">
            {isRejected ? (
              <Link to="/app/apply">
                <Button variant="gold">
                  <RefreshCw className="h-4 w-4 mr-1" /> Reapply for Licence
                </Button>
              </Link>
            ) : !hasApp ? (
              <Link to="/app/apply">
                <Button variant="gold">
                  <FilePlus2 className="h-4 w-4 mr-1" /> New application
                </Button>
              </Link>
            ) : null}
            <Link to="/app/renew">
              <Button variant="secondary">Renew Licence</Button>
            </Link>
          </div>
        }
      />

      {/* ── Rejection Notification & Reapply Action ── */}
      {isRejected && (
        <Alert kind="error" title={`Application #${latest.id} was Rejected`}>
          The Registration Officer rejected your previous application with the reason:
          <strong className="block mt-1">"{latest.rejectionReason || 'Requirements not met'}"</strong>
          <p className="mt-2 text-xs">
            As per Department policy, you are eligible to reapply. Click the button below to submit a new application with corrected particulars.
          </p>
          <div className="mt-3">
            <Link to="/app/apply">
              <Button variant="gold">
                <RefreshCw className="h-4 w-4 mr-1" /> Reapply Now →
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* ── Sequential Journey Pipeline Card ── */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0b1c33]/8 pb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0b1c33]">Licence Issuance Sequential Flow</h2>
            <p className="text-xs text-[#0b1c33]/55">Strict step-by-step progress without shortcuts or loopholes.</p>
          </div>
          <span className="rounded-full bg-[#0b1c33]/5 px-3 py-1 text-xs font-semibold text-[#0b1c33]/70">
            {trialPassed ? 'Stage 7 of 7' : examPassed ? 'Stage 5 of 7' : officerApproved ? 'Stage 4 of 7' : hasApp ? 'Stage 3 of 7' : hasMedical ? 'Stage 2 of 7' : 'Stage 1 of 7'}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {pipelineSteps.map((step) => {
            const Icon = step.icon;
            const isDone = step.status === 'completed';
            const isActive = step.status === 'active';
            const isCurrent = step.status === 'current';
            const isRej = step.status === 'rejected';

            return (
              <Link
                key={step.num}
                to={step.status !== 'locked' ? step.to : '#'}
                className={`relative rounded-xl border p-3 transition ${
                  isDone
                    ? 'border-green-300 bg-green-50/50 hover:bg-green-50'
                    : isRej
                    ? 'border-red-300 bg-red-50/50 hover:bg-red-50'
                    : isActive || isCurrent
                    ? 'border-[#c6a15b] bg-[#fcfaf6] shadow-sm hover:border-[#0b1c33]'
                    : 'border-[#0b1c33]/10 bg-[#f8f9fa] opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isDone ? 'bg-green-600 text-white' : isRej ? 'bg-red-600 text-white' : isActive || isCurrent ? 'bg-[#0b1c33] text-[#f6f1e7]' : 'bg-[#0b1c33]/20 text-[#0b1c33]/60'
                  }`}>
                    {isDone ? '✓' : step.num}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : isRej ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : isActive || isCurrent ? (
                    <Clock className="h-4 w-4 text-[#c6a15b]" />
                  ) : (
                    <Lock className="h-4 w-4 text-[#0b1c33]/30" />
                  )}
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <Icon className={`h-4 w-4 ${isDone ? 'text-green-700' : isRej ? 'text-red-700' : isActive || isCurrent ? 'text-[#0e7c7b]' : 'text-[#0b1c33]/40'}`} />
                  <p className="text-xs font-semibold text-[#0b1c33] leading-tight truncate">{step.title}</p>
                </div>

                <p className={`mt-1 text-[11px] font-medium truncate ${
                  isDone ? 'text-green-700' : isRej ? 'text-red-700' : isActive || isCurrent ? 'text-[#c6a15b]' : 'text-[#0b1c33]/45'
                }`}>
                  {step.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={apps.length} hint="Files under your NIC" tone="ink" icon={<FilePlus2 />} />
        <StatCard label="Upcoming Bookings" value={upcoming.length} hint="Medical, exam or trial" tone="teal" icon={<CalendarDays />} />
        <StatCard label="Unread Notices" value={unread} hint="Approvals and reminders" tone="gold" icon={<Bell />} />
        <StatCard
          label="Fees Paid"
          value={formatMoney(paid.reduce((s, p) => s + p.amount, 0))}
          hint={`${paid.length} receipts`}
          tone="rose"
          icon={<CreditCard />}
        />
      </div>

      {/* ── Current Application File ── */}
      {latest ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#c6a15b] uppercase">Current Application File</p>
              <h2 className="font-display text-2xl">#{latest.id} · Class {latest.licenseClasses}</h2>
              <p className="text-sm text-[#0b1c33]/60">
                Submitted {formatDate(latest.submittedAt)} · Last updated {formatDate(latest.updatedAt)}
                {latest.oneDayService ? ' · One-Day Fast Track' : ''}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              latest.status === 'approved' || latest.status === 'trial_passed' || latest.status === 'license_issued'
                ? 'bg-green-100 text-green-800'
                : latest.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {latest.status.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/app/applications/${latest.id}`}>
              <Button>Open File Tracker →</Button>
            </Link>
            {isRejected && (
              <Link to="/app/apply">
                <Button variant="gold">Reapply for Licence</Button>
              </Link>
            )}
            {officerApproved && !examPassed && (
              <Link to="/app/exam">
                <Button variant="gold">Book Theory Exam →</Button>
              </Link>
            )}
            {examPassed && !trialPassed && (
              <Link to="/app/trial">
                <Button variant="gold">Book Driving Trial →</Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <Empty
            title="No applications yet"
            hint="Begin by booking your medical examination. After booking medical, you will be able to submit your driving licence application."
            action={
              <Link to="/app/medical">
                <Button variant="gold">
                  <Stethoscope className="h-4 w-4 mr-1" /> Step 1: Book Medical
                </Button>
              </Link>
            }
          />
        </Card>
      )}

      {/* ── Upcoming Appointments & Issued Licences ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-xl">Upcoming appointments</h3>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-[#0b1c33]/55">Nothing booked currently. Slots unlock sequentially at each milestone.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#0b1c33]/8">
              {upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-semibold">{b.title}</span>
                    <p className="text-xs text-[#0b1c33]/55">{formatDate(b.date)} · {b.time} · {b.centre}</p>
                  </div>
                  <Link to={b.link}>
                    <Button size="sm" variant="secondary">View</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="font-display text-xl">Issued driving licences</h3>
          {licences.length === 0 ? (
            <p className="mt-3 text-sm text-[#0b1c33]/55">No active licence on file yet. Complete all stages to receive your official licence card.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {licences.map((l) => (
                <li key={l.id} className="flex items-center justify-between rounded-xl bg-[#f6f1e7] p-3 border border-[#c6a15b]/30">
                  <div>
                    <p className="font-mono text-base font-bold text-[#0b1c33]">{l.licenseNumber}</p>
                    <p className="text-xs text-[#0b1c33]/65">
                      Class {l.category} · Issued {l.issuedAt} · Expires {l.expiresAt}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-semibold">
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

