import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { getUserAPI, getAllUsersAPI, createAdminUserAPI, deactivateUserAPI, updateUserAPI, type BackendUser } from '../../lib/api';
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
  PhoneInput,
  NicInput,
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
  const [edit, setEdit] = useState<BackendUser | null>(null);
  const [err, setErr] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const toast = useToast();
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsersAPI();
      setUsers(data);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
    return users.filter(
      (u) =>
        !n ||
        u.name.toLowerCase().includes(n) ||
        u.email.toLowerCase().includes(n) ||
        u.nic.toLowerCase().includes(n) ||
        u.role.includes(n),
    );
  }, [users, q]);

  function openNew() {
    setEdit(null);
    setForm({ name: '', nic: '', email: '', phone: '', password: DEMO_PASSWORD, role: 'officer', active: true });
    setOpen(true);
    setErr('');
  }

  async function save() {
    const n = validateNIC(form.nic);
    const e = validateEmail(form.email);
    if (n || e || form.name.trim().length < 3) {
      setErr(n || e || 'Name is required.');
      return;
    }
    if (edit) {
      try {
        await updateUserAPI(edit.id, {
          name: form.name,
          nic: form.nic,
          email: form.email,
          phone: form.phone,
          role: form.role,
          active: form.active,
        });
        toast.success('User updated successfully.');
        fetchUsers();
      } catch (e: any) {
        setErr(e.message || 'Failed to update user');
        return;
      }
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
      try {
        const res = await createAdminUserAPI({ ...form });
        toast.success('User created successfully.');
        fetchUsers();
        if (me) {
          log({
            userId: me.id,
            userName: me.name,
            action: 'CREATE_USER',
            entity: 'User',
            entityId: res.id,
            details: `${res.email} (${res.role})`,
          });
        }
      } catch (e: any) {
        setErr(e.message || 'Failed to create user');
        return;
      }
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
              <Td>{ROLE_LABELS[u.role as Role] || u.role}</Td>
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
                      password: '',
                      role: u.role as Role,
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
            <NicInput value={form.nic} onChange={(v) => setForm({ ...form, nic: v })} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
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
        onConfirm={async () => {
          if (confirmDeactivate) {
            try {
              await deactivateUserAPI(confirmDeactivate);
              toast.success('User deactivated.');
              fetchUsers();
            } catch (e: any) {
              toast.error(e.message || 'Failed to deactivate user');
            }
          }
          setConfirmDeactivate(null);
        }}
        onCancel={() => setConfirmDeactivate(null)}
      />
    </div>
  );
}
