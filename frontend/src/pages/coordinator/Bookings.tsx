import { useState } from 'react';
import { locById, useStore } from '../../lib/store';
import { todayISO } from '../../lib/utils';
import { Badge, Button, Card, Input, PageHeader, Select } from '../../components/ui';

export default function CoordinatorBookings() {
  const { state, cancelExam, cancelTrial, cancelMedical, rescheduleExam, rescheduleTrial, rescheduleMedical } =
    useStore();
  const [date, setDate] = useState(todayISO());
  const [move, setMove] = useState<{ kind: 'exam' | 'trial' | 'medical'; id: string } | null>(null);
  const [slot, setSlot] = useState('');

  const exams = state.exams.filter((e) => e.date === date);
  const trials = state.trials.filter((e) => e.date === date);
  const meds = state.medicals.filter((e) => e.date === date);

  const altSlots = state.schedules.filter((s) => s.date >= todayISO() && (!move || s.type === (move.kind === 'exam' ? 'exam' : move.kind)));

  function applyMove() {
    if (!move || !slot) return;
    if (move.kind === 'exam') rescheduleExam(move.id, slot);
    if (move.kind === 'trial') rescheduleTrial(move.id, slot);
    if (move.kind === 'medical') rescheduleMedical(move.id, slot);
    setMove(null);
    setSlot('');
  }

  return (
    <div>
      <PageHeader kicker="Daily list" title="Bookings" subtitle="Handle walk-up reschedules and cancellations for a selected date." />
      <div className="mb-5 max-w-xs">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      {[
        ['Exams', exams, 'exam'] as const,
        ['Trials', trials, 'trial'] as const,
        ['Medicals', meds, 'medical'] as const,
      ].map(([title, rows, kind]) => (
        <Card key={title} className="mb-4">
          <h2 className="font-display text-xl">{title}</h2>
          <div className="mt-3 space-y-2">
            {rows.length === 0 && <p className="text-sm text-[#0b1c33]/50">None.</p>}
            {rows.map((r) => {
              const u = state.users.find((x) => x.id === r.applicantId);
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f6f1e7] px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {u?.name} · {r.applicationId}
                    </p>
                    <p className="text-xs text-[#0b1c33]/55">
                      {r.time} · {locById(state.locations, r.locationId)?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{r.status}</Badge>
                    {r.status === 'booked' && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setMove({ kind, id: r.id })}>
                          Move
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (kind === 'exam') cancelExam(r.id);
                            if (kind === 'trial') cancelTrial(r.id);
                            if (kind === 'medical') cancelMedical(r.id);
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {move && (
        <Card>
          <p className="font-semibold">Move booking to another published slot</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Select value={slot} onChange={(e) => setSlot(e.target.value)} className="max-w-md">
              <option value="">Select slot</option>
              {altSlots.map((s) => (
                <option key={s.id} value={s.id} disabled={s.booked >= s.capacity}>
                  {s.date} {s.startTime} · {locById(state.locations, s.locationId)?.name} ({s.booked}/{s.capacity})
                </option>
              ))}
            </Select>
            <Button onClick={applyMove}>Confirm move</Button>
            <Button variant="ghost" onClick={() => setMove(null)}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
