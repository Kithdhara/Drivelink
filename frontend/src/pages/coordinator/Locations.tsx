import { useState } from 'react';
import { useStore } from '../../lib/store';
import { uid } from '../../lib/utils';
import type { Location } from '../../types';
import { Button, Card, Field, Input, PageHeader, Select } from '../../components/ui';

export default function CoordinatorLocations() {
  const { state, upsertLocation } = useStore();
  const blank: Location = {
    id: '',
    name: '',
    address: '',
    city: '',
    type: 'exam',
    capacity: 20,
    phone: '',
  };
  const [form, setForm] = useState<Location>(blank);

  function save(e: React.FormEvent) {
    e.preventDefault();
    upsertLocation({ ...form, id: form.id || uid('loc') });
    setForm(blank);
  }

  return (
    <div>
      <PageHeader kicker="Estate" title="Centres & circuits" subtitle="Maintain medical rooms, examination halls and trial yards." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">{form.id ? 'Edit location' : 'Add location'}</h2>
          <form onSubmit={save} className="mt-4 space-y-3">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Address">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Location['type'] })}>
                  <option value="medical">Medical</option>
                  <option value="exam">Exam</option>
                  <option value="trial">Trial</option>
                  <option value="both">Combined</option>
                </Select>
              </Field>
              <Field label="Default capacity">
                <Input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Button type="submit">Save location</Button>
          </form>
        </Card>
        <div className="space-y-3">
          {state.locations.map((l) => (
            <button
              key={l.id}
              onClick={() => setForm(l)}
              className="w-full rounded-2xl border border-[#0b1c33]/8 bg-white p-4 text-left hover:border-[#c6a15b]"
            >
              <p className="font-semibold">{l.name}</p>
              <p className="text-sm text-[#0b1c33]/55">
                {l.city} · {l.type} · cap {l.capacity}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
