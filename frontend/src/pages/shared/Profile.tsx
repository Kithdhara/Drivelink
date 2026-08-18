import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { ROLE_LABELS } from '../../types';
import { validatePhone, validatePassword } from '../../lib/utils';
import { Alert, Button, Card, Field, Input, PageHeader, Select } from '../../components/ui';

export default function Profile() {
  const { user } = useAuth();
  const { updateProfile } = useStore();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    dob: user?.dob ?? '',
    gender: user?.gender ?? '',
  });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (!user) return null;
  const me = user;

  function save(e: React.FormEvent) {
    e.preventDefault();
    const ph = validatePhone(form.phone);
    if (ph) return setErr(ph);
    updateProfile(me.id, {
      name: form.name,
      phone: form.phone,
      address: form.address,
      dob: form.dob,
      gender: (form.gender || undefined) as 'male' | 'female' | 'other' | undefined,
    });
    setErr('');
    setMsg('Profile updated.');
  }

  function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.current !== me.password) return setErr('Current password is incorrect.');
    const v = validatePassword(pw.next);
    if (v) return setErr(v);
    if (pw.next !== pw.confirm) return setErr('New passwords do not match.');
    updateProfile(me.id, { password: pw.next });
    setPw({ current: '', next: '', confirm: '' });
    setErr('');
    setMsg('Password changed.');
  }

  return (
    <div>
      <PageHeader kicker="Account" title="Profile" subtitle="Keep your contact details current. NIC and email cannot be changed here." />
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <div className="mt-3"><Alert kind="error">{err}</Alert></div>}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Personal details</h2>
          <form onSubmit={save} className="mt-4 space-y-3">
            <Field label="Full name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="NIC">
              <Input value={user.nic} disabled />
            </Field>
            <Field label="Email">
              <Input value={user.email} disabled />
            </Field>
            <Field label="Mobile">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / prefer not to say</option>
              </Select>
            </Field>
            <Field label="Address">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <p className="text-xs text-[#0b1c33]/50">Role: {ROLE_LABELS[user.role]}</p>
            <Button type="submit">Save profile</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Change password</h2>
          <form onSubmit={changePw} className="mt-4 space-y-3">
            <Field label="Current password">
              <Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </Field>
            <Field label="New password">
              <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </Field>
            <Button type="submit" variant="secondary">
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
