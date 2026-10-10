import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Spinner, Textarea } from '../../components/ui';
import { useToast } from '../../components/Toast';
import {
  getAllMedicalsAPI,
  recordMedicalResultAPI,
  getUserAPI,
  type BackendMedicalAppointment,
} from '../../lib/api';
import { CheckCircle2, XCircle, Stethoscope, ClipboardList, User, Search } from 'lucide-react';
import { shortId } from '../../lib/utils';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MedicalAppointments() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BackendMedicalAppointment[]>([]);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  // Track findings per appointment
  const [findings, setFindings] = useState<
    Record<number, { vision: string; hearing: string; bloodPressure: string; remarks: string }>
  >({});
  // Track fetched user details
  const [userDetails, setUserDetails] = useState<Record<string, any>>({});
  // Track which appointments have saved findings (step 1 complete)
  const [savedFindings, setSavedFindings] = useState<Set<number>>(new Set());
  // Track which appointment is being submitted
  const [submitting, setSubmitting] = useState<number | null>(null);

  useEffect(() => {
    getAllMedicalsAPI()
      .then(async (data) => {
        // Sort newest first
        const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRows(sorted);
        
        // Fetch user details for booked appointments
        const uniqueIds = [...new Set(sorted.filter((m) => m.status === 'BOOKED').map((m) => m.applicantId))];
        const users = await Promise.all(uniqueIds.map((id) => getUserAPI(id).catch(() => null)));
        const userMap: Record<string, any> = {};
        users.forEach((u) => {
          if (u) userMap[u.id] = u;
        });
        setUserDetails(userMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function getFinding(id: number) {
    return findings[id] ?? { vision: '6/6', hearing: 'Normal', bloodPressure: '120/80', remarks: '' };
  }

  function updateFinding(id: number, field: string, value: string) {
    setFindings((prev) => ({
      ...prev,
      [id]: { ...getFinding(id), [field]: value },
    }));
  }

  function saveFindings(id: number) {
    const f = getFinding(id);
    if (!f.vision.trim()) { toast.error('Vision field is required'); return; }
    if (!f.hearing.trim()) { toast.error('Hearing field is required'); return; }
    if (!f.bloodPressure.trim()) { toast.error('Blood pressure field is required'); return; }
    if (!f.remarks.trim()) { toast.error('Please add clinical remarks before proceeding'); return; }

    setSavedFindings((prev) => new Set(prev).add(id));
    toast.success('Findings saved. Now select Pass or Fail to finalize.');
  }

  async function submitResult(id: number, result: 'PASS' | 'FAIL') {
    if (!user) return;
    const f = getFinding(id);
    setSubmitting(id);
    try {
      await recordMedicalResultAPI(id, {
        officerId: user.id,
        result,
        remarks: f.remarks,
        vision: f.vision,
        hearing: f.hearing,
        bloodPressure: f.bloodPressure,
      });
      toast.success(`Applicant marked as ${result}. Medical result recorded.`);
      setMsg(`Medical result recorded — ${result}.`);
      setSavedFindings((prev) => { const n = new Set(prev); n.delete(id); return n; });
      const updated = await getAllMedicalsAPI().catch(() => []);
      const sorted = [...updated].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRows(sorted);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save result');
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  const booked = rows.filter((m) => m.status === 'BOOKED')
    .filter((m) =>
      !search ||
      m.applicantId.toLowerCase().includes(search.toLowerCase()) ||
      m.centreName?.toLowerCase().includes(search.toLowerCase())
    );
  const completed = rows.filter((m) => m.status === 'COMPLETED');

  return (
    <div>
      <PageHeader
        kicker="Clinic"
        title="Medical appointments"
        subtitle="Record clinical findings, then confirm pass or fail for each applicant."
      />
      {msg && <Alert kind="success">{msg}</Alert>}

      {/* Search bar */}
      <div className="mt-4 relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0b1c33]/40" />
        <input
          type="text"
          placeholder="Search by applicant ID or centre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[#0b1c33]/15 py-2 pl-9 pr-4 text-sm focus:border-[#c6a15b] focus:outline-none focus:ring-1 focus:ring-[#c6a15b]"
        />
      </div>

      {/* Pending examinations */}
      <div className="mt-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-[#0b1c33] mb-3">
          <Stethoscope className="h-5 w-5 text-[#0e7c7b]" /> Pending Examinations ({booked.length})
        </h3>
        {booked.length === 0 && <p className="text-sm text-[#0b1c33]/55 ml-7">No pending appointments{search ? ' matching your search' : ''}.</p>}
        <div className="space-y-4">
          {booked.map((m) => {
            const f = getFinding(m.id);
            const isSaved = savedFindings.has(m.id);
            const isSubmitting = submitting === m.id;
            return (
              <Card key={m.id} className="border-l-4 border-l-[#c6a15b]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-[#0b1c33]/8 text-[#0b1c33] px-2 py-0.5 rounded-full font-bold">
                        APT-{shortId(m.applicantId)}
                      </span>
                      {(m as any).applicantName && (
                        <span className="font-semibold text-[#0e7c7b]">{(m as any).applicantName}</span>
                      )}
                    </div>
                    <p className="text-sm text-[#0b1c33]/55 mt-0.5">
                      {formatDate(m.date)} · {m.timeSlot} · {m.centreName}
                    </p>
                  </div>
                  <Badge tone="warn">Awaiting Examination</Badge>
                </div>

                {/* Applicant details */}
                <div className="mt-4 rounded-xl bg-[#f6f1e7] p-3 text-sm">
                  <p className="text-xs font-semibold tracking-wide text-[#0b1c33]/50 uppercase mb-2 flex items-center gap-1">
                    <User className="h-3 w-3" /> Applicant Details
                  </p>
                  <div className="grid gap-x-4 gap-y-2 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-[#0b1c33]/50 mb-0.5">Name</p>
                      <p className="font-medium text-[#0b1c33]">{userDetails[m.applicantId]?.name || 'Loading...'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#0b1c33]/50 mb-0.5">Phone</p>
                      <p className="font-medium text-[#0b1c33]">{userDetails[m.applicantId]?.phone || 'Loading...'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#0b1c33]/50 mb-0.5">Address</p>
                      <p className="font-medium text-[#0b1c33]">{userDetails[m.applicantId]?.address || 'Loading...'}</p>
                    </div>
                  </div>
                </div>

                {!isSaved ? (
                  /* Step 1: Record findings */
                  <div className="mt-5">
                    <p className="text-xs font-semibold tracking-wide text-[#0b1c33]/50 uppercase mb-3">
                      Step 1 — Record Clinical Findings
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Vision (Snellen)">
                        <Input value={f.vision} onChange={(e) => updateFinding(m.id, 'vision', e.target.value)} placeholder="e.g. 6/6 bilateral" />
                      </Field>
                      <Field label="Hearing">
                        <Input value={f.hearing} onChange={(e) => updateFinding(m.id, 'hearing', e.target.value)} placeholder="e.g. Normal" />
                      </Field>
                      <Field label="Blood Pressure">
                        <Input value={f.bloodPressure} onChange={(e) => updateFinding(m.id, 'bloodPressure', e.target.value)} placeholder="e.g. 120/80 mmHg" />
                      </Field>
                    </div>
                    <div className="mt-3">
                      <Field label="Clinical Remarks">
                        <Textarea
                          value={f.remarks}
                          onChange={(e) => updateFinding(m.id, 'remarks', e.target.value)}
                          placeholder="Describe examination findings, observations, and medical opinion..."
                          rows={3}
                        />
                      </Field>
                    </div>
                    <div className="mt-4">
                      <Button onClick={() => saveFindings(m.id)} variant="gold">
                        Save Findings & Proceed
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Step 2: Choose Pass or Fail */
                  <div className="mt-5">
                    <p className="text-xs font-semibold tracking-wide text-[#0b1c33]/50 uppercase mb-2">
                      Step 1 — Findings Recorded ✓
                    </p>
                    <div className="rounded-xl bg-[#f6f1e7] p-3 mb-4">
                      <div className="grid gap-2 sm:grid-cols-3 text-sm">
                        <div><span className="font-semibold text-[#0b1c33]/70">Vision:</span> {f.vision}</div>
                        <div><span className="font-semibold text-[#0b1c33]/70">Hearing:</span> {f.hearing}</div>
                        <div><span className="font-semibold text-[#0b1c33]/70">BP:</span> {f.bloodPressure}</div>
                      </div>
                      <p className="mt-2 text-sm text-[#0b1c33]/70"><span className="font-semibold">Remarks:</span> {f.remarks}</p>
                      <button
                        onClick={() => setSavedFindings((prev) => { const n = new Set(prev); n.delete(m.id); return n; })}
                        className="mt-2 text-xs text-[#0e7c7b] font-semibold hover:underline"
                      >
                        ← Edit findings
                      </button>
                    </div>

                    <p className="text-xs font-semibold tracking-wide text-[#0b1c33]/50 uppercase mb-3">
                      Step 2 — Final Medical Decision
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => submitResult(m.id, 'PASS')}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-500 bg-emerald-50 px-6 py-4 font-bold text-emerald-700 transition-all hover:bg-emerald-100 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-6 w-6" />
                        <div className="text-left">
                          <p className="text-lg">PASS</p>
                          <p className="text-xs font-normal text-emerald-600">Medically fit to drive</p>
                        </div>
                      </button>
                      <button
                        onClick={() => submitResult(m.id, 'FAIL')}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-red-400 bg-red-50 px-6 py-4 font-bold text-red-700 transition-all hover:bg-red-100 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        <XCircle className="h-6 w-6" />
                        <div className="text-left">
                          <p className="text-lg">FAIL</p>
                          <p className="text-xs font-normal text-red-600">Unfit / refer for review</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Completed examinations */}
      {completed.length > 0 && (
        <div className="mt-10">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[#0b1c33] mb-3">
            <ClipboardList className="h-5 w-5 text-[#0b1c33]/50" /> Completed ({completed.length})
          </h3>
          <div className="space-y-3">
            {completed.map((m) => (
              <Card key={m.id} className="opacity-80">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold font-mono text-sm">APT-{shortId(m.applicantId)}</p>
                    <p className="text-sm text-[#0b1c33]/55">
                      {formatDate(m.date)} · {m.timeSlot} · {m.centreName}
                    </p>
                  </div>
                  <Badge tone={m.result === 'FAIL' ? 'danger' : 'success'}>
                    {m.result}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-[#0b1c33]/70">
                  Vision {m.vision} · Hearing {m.hearing} · BP {m.bloodPressure}
                  {m.remarks ? ` · ${m.remarks}` : ''}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
