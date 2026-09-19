import { useState, useEffect } from 'react';
import { formatDate } from '../../lib/utils';
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
import { 
  getAllSlotsAPI, getAllCentresAPI, createSlotAPI, updateSlotAPI, deleteSlotAPI,
  type BackendTimeSlot, type BackendCentre 
} from '../../lib/api';

export default function CoordinatorSchedules() {
  const [slots, setSlots] = useState<BackendTimeSlot[]>([]);
  const [centres, setCentres] = useState<BackendCentre[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<BackendTimeSlot | null>(null);
  const [err, setErr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const toast = useToast();
  
  const [form, setForm] = useState({
    type: 'EXAM',
    centreId: 1,
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    capacity: 20,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        getAllSlotsAPI(),
        getAllCentresAPI()
      ]);
      setSlots(s);
      setCentres(c);
      if (c.length > 0 && form.centreId === 1) {
        setForm(f => ({ ...f, centreId: c[0].id }));
      }
    } catch (e: any) {
      setErr(e.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEdit(null);
    setForm({
      type: 'EXAM',
      centreId: centres.length > 0 ? centres[0].id : 1,
      date: '',
      startTime: '09:00',
      endTime: '11:00',
      capacity: 20,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.date) return setErr('Date is required.');
    
    const centreName = centres.find(c => c.id === form.centreId)?.name || 'Unknown Centre';
    
    try {
      if (edit) {
        await updateSlotAPI(edit.id, {
          ...form,
          centreName
        });
        toast.success('Schedule updated successfully.');
      } else {
        await createSlotAPI({
          ...form,
          centreName
        });
        toast.success('Schedule created successfully.');
      }
      setOpen(false);
      setErr('');
      fetchData();
    } catch (e: any) {
      setErr(e.message || 'Failed to save schedule');
    }
  }

  async function remove(id: number) {
    try {
      await deleteSlotAPI(id);
      toast.success('Schedule deleted');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete schedule');
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Timetable"
        title="Exam, trial & medical schedules"
        actions={<Button onClick={openNew}>Create slot</Button>}
      />
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
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
          {loading ? (
             <tr><Td colSpan={5} className="text-center py-4">Loading schedules...</Td></tr>
          ) : slots.length === 0 ? (
             <tr><Td colSpan={5} className="text-center py-4">No schedules found. Create one above.</Td></tr>
          ) : [...slots]
            .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
            .map((s) => (
              <tr key={s.id}>
                <Td>
                  <span className="font-medium text-[#0b1c33]">{formatDate(s.date)}</span>
                  <span className="text-[#0b1c33]/60 ml-2">{s.startTime}–{s.endTime}</span>
                </Td>
                <Td className="capitalize font-bold text-[#0b1c33]/80">
                  {s.type}
                </Td>
                <Td>{s.centreName}</Td>
                <Td>
                  <Badge tone={s.booked >= s.capacity ? 'danger' : 'info'}>
                    {s.booked}/{s.capacity}
                  </Badge>
                </Td>
                <Td className="space-x-2 text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEdit(s);
                      setForm({
                        type: s.type,
                        centreId: s.centreId,
                        date: s.date,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        capacity: s.capacity,
                      });
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(s.id)}>
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
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="EXAM">Exam</option>
              <option value="TRIAL">Trial</option>
              <option value="MEDICAL">Medical</option>
            </Select>
          </Field>
          
          <Field label="Location">
            <Select value={form.centreId} onChange={(e) => setForm({ ...form, centreId: Number(e.target.value) })}>
              {centres.map((l) => (
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
          <Button onClick={save} variant="gold" className="w-full mt-2">Save slot</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete schedule?"
        message="Are you sure you want to delete this schedule slot? This action cannot be undone."
        confirmLabel="Yes, delete it"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) remove(confirmDelete);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
