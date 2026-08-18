import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROLE_HOME, ROLE_LABELS } from '../../types';
import type { Role } from '../../types';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../lib/utils';
import { Alert, Button, Field, Input } from '../../components/ui';

export default function Login() {
  const { login, user } = useAuth();
  const { resetDemo } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState('citizen@demo.gov');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!user) return;
    nav(ROLE_HOME[user.role], { replace: true });
  }, [user, nav]);

  function attempt(nextEmail: string, nextPassword: string) {
    setError('');
    setBusy(true);
    setEmail(nextEmail);
    setPassword(nextPassword);
    const res = login(nextEmail, nextPassword);
    if (!res.ok) {
      setBusy(false);
      setPendingRole(null);
      setError(res.error);
      return;
    }
    setPendingRole(res.user.role);
    window.setTimeout(() => nav(ROLE_HOME[res.user.role], { replace: true }), 0);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    attempt(email, password);
  }

  return (
    <div className="auth-split">
      <div className="auth-hero">
        <img src="/images/auth-hero.jpg" alt="Driver on modern highway" />
        <div className="auth-hero-content">
          <p className="text-[11px] tracking-[0.28em] text-[#c6a15b] uppercase">Secure access</p>
          <h2 className="mt-2 font-display text-5xl">Sign in to the licence service</h2>
          <p className="mt-4 max-w-md text-white/70">
            Citizens, registration officers, examiners, trainers, medical officers and administrators each land on a
            dedicated workspace.
          </p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-card animate-slide-up">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#c6a15b] uppercase">NMTA portal</p>
          <h2 className="mt-2 font-display text-3xl">Welcome back</h2>
          <p className="mt-1 text-sm text-[#0b1c33]/60">Use a demo role or your registered credentials.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && <Alert kind="error">{error}</Alert>}
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <div className="flex justify-end">
              <Link to="/forgot" className="text-xs font-semibold text-[#0e7c7b] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#0b1c33]/60">
            New citizen?{' '}
            <Link to="/register" className="font-semibold text-[#0e7c7b]">
              Create an account
            </Link>
          </p>

          <div className="mt-8">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-[#0b1c33]/50 uppercase">
              One-click demo roles · password {DEMO_PASSWORD}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  disabled={busy}
                  onClick={() => attempt(d.email, DEMO_PASSWORD)}
                  className="rounded-lg border border-[#0b1c33]/10 bg-white px-2 py-2 text-left text-[11px] transition hover:border-[#c6a15b] hover:shadow-sm disabled:opacity-60"
                >
                  <span className="block font-semibold">{ROLE_LABELS[d.role].split(' ')[0]}</span>
                  <span className="text-[#0b1c33]/50">{d.email}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-[#0e7c7b] underline"
              onClick={() => {
                resetDemo();
                setError('');
                setBusy(false);
                setEmail('citizen@demo.gov');
                setPassword(DEMO_PASSWORD);
              }}
            >
              Restore official demo accounts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
