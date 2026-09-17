import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { registerUser } from '../../lib/api';
import { User } from '../../types';
import { validateEmail, validateNIC, validatePassword, validatePhone } from '../../lib/utils';
import { Alert, Button, Field, Input } from '../../components/ui';

export default function Register() {
  const { enterSession } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', nic: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 3) next.name = 'Enter your full name.';
    const n = validateNIC(form.nic);
    if (n) next.nic = n;
    const em = validateEmail(form.email);
    if (em) next.email = em;
    const ph = validatePhone(form.phone);
    if (ph) next.phone = ph;
    const pw = validatePassword(form.password);
    if (pw) next.password = pw;
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const user = await registerUser({
        name: form.name,
        nic: form.nic,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: 'APPLICANT', // Matches Java enum
      });
      // Ensure the returned user is treated as type User
      // Convert the uppercase backend role to lowercase for the frontend
      const appUser = {
        ...user,
        role: user.role.toLowerCase() as any
      };
      enterSession(appUser);
      nav('/app');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('nic already exists')) {
        setErrors({ nic: 'This NIC is already registered.' });
      } else if (msg.toLowerCase().includes('email already exists')) {
        setErrors({ email: 'This email is already registered.' });
      } else {
        setBanner(msg || 'Registration failed');
      }
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-hero">
        <img src="/images/auth-hero.jpg" alt="Driver on modern highway" />
        <div className="auth-hero-content">
          <p className="text-[11px] tracking-[0.28em] text-[#c6a15b] uppercase">Citizen enrolment</p>
          <h2 className="mt-2 font-display text-5xl">Join the digital licence service</h2>
          <p className="mt-4 max-w-md text-white/70">
            Register as a citizen to apply for a new driving licence, book your medical, sit exams and track progress in
            real time.
          </p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-card animate-slide-up">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#c6a15b] uppercase">Citizen enrolment</p>
          <h2 className="mt-2 font-display text-3xl">Create your NMTA account</h2>
          <p className="mt-2 text-sm text-[#0b1c33]/60">
            Registration is limited to applicants. Staff accounts are provisioned by the System Administrator.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {banner && <Alert kind="error">{banner}</Alert>}
            <Field label="Full name" required error={errors.name}>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="NIC" required error={errors.nic} hint="9 digits + V/X or 12 digits">
                <Input value={form.nic} onChange={(e) => set('nic', e.target.value)} />
              </Field>
              <Field label="Mobile" required error={errors.phone}>
                <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0771234567" />
              </Field>
            </div>
            <Field label="Email" required error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password" required error={errors.password}>
                <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
              </Field>
              <Field label="Confirm password" required error={errors.confirm}>
                <Input type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} />
              </Field>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Register & continue
            </Button>
            <p className="text-center text-sm text-[#0b1c33]/60">
              Already enrolled?{' '}
              <Link to="/login" className="font-semibold text-[#0e7c7b]">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
