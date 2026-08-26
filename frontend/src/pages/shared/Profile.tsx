import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { ROLE_LABELS } from '../../types';
import { validatePassword } from '../../lib/utils';
import { Alert, Button, Card, Field, Input, PageHeader, Select, PhoneInput } from '../../components/ui';
import { updateProfileAPI } from '../../lib/api';
import { useToast } from '../../components/Toast';

export default function Profile() {
  const { user, enterSession } = useAuth();
  const toast = useToast();
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
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  if (!user) return null;
  const me = user;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setSavingProfile(true);
    try {
      const updated = await updateProfileAPI(me.id, {
        name: form.name,
        phone: form.phone,
        address: form.address,
        dob: form.dob,
        gender: form.gender,
      });
      // Update the auth session with new details
      enterSession({ ...me, ...updated, password: '' } as any);
      setMsg('Profile updated successfully.');
      toast.success('Profile updated!');
    } catch (e: any) {
      setErr(e.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const v = validatePassword(pw.next);
    if (v) return setErr(v);
    if (pw.next !== pw.confirm) return setErr('New passwords do not match.');
    setSavingPw(true);
    try {
      await updateProfileAPI(me.id, {
        currentPassword: pw.current,
        newPassword: pw.next,
      });
      setPw({ current: '', next: '', confirm: '' });
      setMsg('Password changed successfully.');
      toast.success('Password updated!');
    } catch (e: any) {
      setErr(e.message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
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
              <PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
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
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Change password</h2>
          <form onSubmit={changePw} className="mt-4 space-y-3">
            <Field label="Current password">
              <Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
            </Field>
            <Field label="New password">
              <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
            </Field>
            <Button type="submit" variant="secondary" disabled={savingPw}>
              {savingPw ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
