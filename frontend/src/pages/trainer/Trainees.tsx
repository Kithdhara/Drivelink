import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { getTraineesByTrainerAPI, updateTrainerBookingAPI, type TraineeRecordDTO } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Alert, Button, Card, Field, Input, PageHeader, Select, Textarea } from '../../components/ui';

export default function TrainerTrainees() {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState<TraineeRecordDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [note, setNote] = useState('');
  const [sessions, setSessions] = useState(1);
  const [sel, setSel] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getTraineesByTrainerAPI(user.id);
      setTrainees(data);
      if (data.length > 0 && !sel) {
        setSel(String(data[0].trainerBookingId));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    const record = trainees.find((a) => String(a.trainerBookingId) === sel);
    if (!record) return;
    
    setBusy(true);
    setMsg('');
    try {
      await updateTrainerBookingAPI(record.trainerBookingId, { notes: note, sessions });
      setMsg('Training progress saved successfully.');
      setNote('');
      await fetchData();
    } catch (err: any) {
      setMsg(err.message || 'Failed to update progress');
    } finally {
      setBusy(false);
    }
  }

  function remind(applicantId: string) {
    // In a real system, this would call a notification API endpoint
    setMsg(`Reminder notification sent to applicant ${applicantId}.`);
  }

  if (!user) return null;

  return (
    <div>
      <PageHeader kicker="Cohort" title="Assigned trainees" subtitle="Update training progress and ping applicants who miss sessions." />
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      
      <div className="mt-5 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <h2 className="font-display text-xl">Log a session</h2>
          
          {loading && trainees.length === 0 ? (
            <div className="animate-pulse space-y-4 mt-4">
              <div className="h-10 bg-stone-100 rounded w-full"></div>
              <div className="h-10 bg-stone-100 rounded w-full"></div>
              <div className="h-24 bg-stone-100 rounded w-full"></div>
            </div>
          ) : trainees.length === 0 ? (
            <p className="mt-4 text-sm text-[#0b1c33]/60">You have no assigned trainees to log sessions for.</p>
          ) : (
            <div className="mt-4 space-y-4">
              <Field label="Trainee">
                <Select
                  value={sel}
                  onChange={(e) => {
                    setSel(e.target.value);
                    const t = trainees.find(x => String(x.trainerBookingId) === e.target.value);
                    if (t) {
                      setSessions(t.sessions || 1);
                      setNote(t.notes || '');
                    }
                  }}
                >
                  {trainees.map((a) => (
                    <option key={a.trainerBookingId} value={a.trainerBookingId}>
                      {a.applicantName} · {a.applicantId}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sessions Completed">
                <Input type="number" min={0} max={20} value={sessions} onChange={(e) => setSessions(Number(e.target.value))} />
              </Field>
              <Field label="Training Notes">
                <Textarea placeholder="Write down progress, areas to improve..." value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <Button onClick={save} disabled={busy} variant="gold" className="w-full">
                {busy ? 'Saving...' : 'Update Trainee Record'}
              </Button>
            </div>
          )}
        </Card>
        
        <div className="space-y-4 lg:col-span-3">
          {loading && trainees.length === 0 && (
            <div className="animate-pulse space-y-4">
               <div className="h-32 bg-white shadow-sm rounded-xl border border-stone-100 w-full"></div>
               <div className="h-32 bg-white shadow-sm rounded-xl border border-stone-100 w-full"></div>
            </div>
          )}
          
          {trainees.map((a) => {
            const progressPercent = Math.min(100, Math.max(0, (a.sessions / 10) * 100)); // Assume 10 sessions is 100%
            
            return (
              <Card key={a.trainerBookingId} className="group hover:border-[#c6a15b]/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#0b1c33] leading-tight">{a.applicantName}</h3>
                    <p className="text-xs text-[#0b1c33]/60 font-mono mt-1">
                      {a.applicantId} · NIC: {a.applicantNic}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-[#c6a15b]/20 text-[#0b1c33] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        Class {a.licenseClasses}
                      </span>
                      <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {a.status}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => remind(a.applicantId)}>
                    Ping Trainee
                  </Button>
                </div>
                
                <div className="mt-5">
                  <div className="flex justify-between text-xs font-semibold mb-1.5 text-[#0b1c33]/70">
                    <span>Training Progress</span>
                    <span>{a.sessions} sessions ({progressPercent.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-[#c6a15b] to-[#a48239] rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                </div>
                
                {a.notes && (
                  <div className="mt-4 pt-3 border-t border-[#0b1c33]/10">
                    <p className="text-[10px] font-bold uppercase text-[#0b1c33]/50 mb-1">Latest Notes</p>
                    <p className="text-sm text-[#0b1c33]/80 whitespace-pre-wrap leading-relaxed">{a.notes}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
