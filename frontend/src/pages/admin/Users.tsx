import { useMemo, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { ROLE_LABELS } from '../../types';
import type { Role, User } from '../../types';
import { DEMO_PASSWORD, validateEmail, validateNIC } from '../../lib/utils';
import {
  Alert,
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchBox,
  Select,
  TableWrap,
  Td,
  Th,
} from '../../components/ui';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const { state, createUser, updateUser, deactivateUser, log } = useStore();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<User | null>(null);
  const [err, setErr] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    nic: '',
    email: '',
    phone: '',
    password: DEMO_PASSWORD,
    role: 'officer' as Role,
    active: true,
  });

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return state.users.filter(
      (u) =>
        !n ||
        u.name.toLowerCase().includes(n) ||
        u.email.toLowerCase().includes(n) ||
        u.nic.toLowerCase().includes(n) ||
        u.role.includes(n),
    );
  }, [state.users, q]);

  function openNew() {
    setEdit(null);
    setForm({ name: '', nic: '', email: '', phone: '', password: DEMO_PASSWORD, role: 'officer', active: true });
    setOpen(true);
    setErr('');
  }

  function save() {
    const n = validateNIC(form.nic);
    const e = validateEmail(form.email);
    if (n || e || form.name.trim().length < 3) {
      setErr(n || e || 'Name is required.');
      return;
    }
    if (edit) {
      updateUser(edit.id, {
        name: form.name,
        nic: form.nic,
        email: form.email,
        phone: form.phone,
        role: form.role,
        active: form.active,
      });
      if (me) {
        log({
          userId: me.id,
          userName: me.name,
          action: 'UPDATE_USER',
          entity: 'User',
          entityId: edit.id,
          details: `${form.email} → ${form.role}`,
        });
      }
    } else {
      const res = createUser({ ...form });
      if (!res.ok) return setErr(res.error);
      if (me) {
        log({
          userId: me.id,
          userName: me.name,
          action: 'CREATE_USER',
          entity: 'User',
          entityId: res.user.id,
          details: `${res.user.email} (${res.user.role})`,
        });
      }
      toast.success(edit ? 'User updated successfully.' : 'User created successfully.');
    }
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        kicker="Directory"
        title="User management"
        subtitle="Create staff accounts, assign roles and deactivate compromised logins."
        actions={<Button onClick={openNew}>New account</Button>}
      />
      <div className="mb-4 max-w-md">
        <SearchBox value={q} onChange={setQ} placeholder="Name, email, NIC or role" />
      </div>
      <TableWrap>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>NIC / email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <Td className="font-semibold">{u.name}</Td>
              <Td>
                {u.nic}
                <div className="text-[11px] text-[#0b1c33]/45">{u.email}</div>
              </Td>
              <Td>{ROLE_LABELS[u.role]}</Td>
              <Td>
                <Badge tone={u.active ? 'success' : 'danger'}>{u.active ? 'Active' : 'Deactivated'}</Badge>
              </Td>
              <Td className="space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEdit(u);
                    setForm({
                      name: u.name,
                      nic: u.nic,
                      email: u.email,
                      phone: u.phone,
                      password: u.password,
                      role: u.role,
                      active: u.active,
                    });
                    setOpen(true);
                    setErr('');
                  }}
                >
                  Edit
                </Button>
                {u.active && u.id !== me?.id && (
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDeactivate(u.id)}>
                    Deactivate
                  </Button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Edit account' : 'Create account'}>
        <div className="space-y-3">
          {err && <Alert kind="error">{err}</Alert>}
          <Field label="Full name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="NIC">
            <Input value={form.nic} onChange={(e) => setForm({ ...form, nic: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          {!edit && (
            <Field label="Temporary password">
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
          )}
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
          {edit && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </label>
          )}
          <Button onClick={save}>Save account</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeactivate}
        title="Deactivate user?"
        message="This user will immediately lose access to the system. You can re-activate them later."
        confirmLabel="Yes, deactivate"
        variant="danger"
        onConfirm={() => {
          if (confirmDeactivate) {
            deactivateUser(confirmDeactivate);
            toast.success('User deactivated.');
          }
          setConfirmDeactivate(null);
        }}
        onCancel={() => setConfirmDeactivate(null)}
      />
    </div>
  );
}
