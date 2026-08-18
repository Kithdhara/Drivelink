import { useState } from 'react';
import { locById, useStore } from '../../lib/store';
import { formatDate } from '../../lib/utils';
import type { Schedule } from '../../types';
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  TableWrap,
  Td,
  Th,
} from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export default function CoordinatorSchedules() {
  const { state, createSchedule, updateSchedule, deleteSchedule } = useStore();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Schedule | null>(null);
  const [err, setErr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const toast = useToast();
  const [form, setForm] = useState({
    type: 'exam' as Schedule['type'],
    locationId: 'loc-ex-1',
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    capacity: 20,
    examKind: 'computer' as Schedule['examKind'],
  });

  function openNew() {
    setEdit(null);
    setForm({
      type: 'exam',
      locationId: state.locations[0]?.id ?? '',
      date: '',
      startTime: '09:00',
      endTime: '11:00',
      capacity: 20,
      examKind: 'computer',
    });
    setOpen(true);
  }

  function save() {
    if (!form.date) return setErr('Date is required.');
    if (edit) {
      updateSchedule(edit.id, form);
      toast.success('Schedule updated successfully.');
    } else {
      createSchedule(form);
      toast.success('Schedule created successfully.');
    }
    setOpen(false);
    setErr('');
  }

  function remove(id: string) {
    const res = deleteSchedule(id);
    if (!res.ok) setErr(res.error);
  }

  const locs = state.locations.filter((l) =>
    form.type === 'medical' ? l.type === 'medical' : form.type === 'exam' ? l.type === 'exam' : l.type === 'trial',
  );

  return (
    <div>
      <PageHeader
        kicker="Timetable"
        title="Exam, trial & medical schedules"
        actions={<Button onClick={openNew}>Create slot</Button>}
      />
      {err && <Alert kind="error">{err}</Alert>}
      <TableWrap>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Type</Th>
            <Th>Location</Th>
            <Th>Capacity</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {[...state.schedules]
            .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
            .map((s) => (
              <tr key={s.id}>
                <Td>
                  {formatDate(s.date)} · {s.startTime}–{s.endTime}
                </Td>
                <Td className="capitalize">
                  {s.type} {s.examKind ?? ''}
                </Td>
                <Td>{locById(state.locations, s.locationId)?.name}</Td>
                <Td>
                  <Badge tone={s.booked >= s.capacity ? 'danger' : 'info'}>
                    {s.booked}/{s.capacity}
                  </Badge>
                </Td>
                <Td className="space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEdit(s);
                      setForm({
                        type: s.type,
                        locationId: s.locationId,
                        date: s.date,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        capacity: s.capacity,
                        examKind: s.examKind,
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(s.id)}>
                    Delete
                  </Button>
                </Td>
              </tr>
            ))}
        </tbody>
      </TableWrap>

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Edit schedule' : 'New schedule'}>
        <div className="space-y-3">
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Schedule['type'] })}
            >
              <option value="exam">Exam</option>
              <option value="trial">Trial</option>
              <option value="medical">Medical</option>
            </Select>
          </Field>
          {form.type === 'exam' && (
            <Field label="Format">
              <Select
                value={form.examKind}
                onChange={(e) => setForm({ ...form, examKind: e.target.value as Schedule['examKind'] })}
              >
                <option value="computer">Computer</option>
                <option value="written">Written</option>
              </Select>
            </Field>
          )}
          <Field label="Location">
            <Select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
              {locs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </Field>
            <Field label="End">
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </Field>
          </div>
          <Field label="Capacity">
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            />
          </Field>
          <Button onClick={save}>Save slot</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete schedule?"
        message="Are you sure you want to delete this schedule slot? This action cannot be undone."
        confirmLabel="Yes, delete it"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) {
            remove(confirmDelete);
            toast.success('Schedule deleted.');
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
