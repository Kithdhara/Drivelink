import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { validatePassword } from '../../lib/utils';
import { Alert, Button, Field, Input } from '../../components/ui';

export default function Reset() {
  const { resetPassword } = useStore();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validatePassword(password);
    if (v) return setError(v);
    if (password !== confirm) return setError('Passwords do not match.');
    const res = resetPassword(token.trim(), password);
    if (!res.ok) return setError(res.error);
    setOk(true);
    setTimeout(() => nav('/login'), 1400);
  }

  return (
    <div className="auth-split">
      <div className="auth-hero">
        <img src="/images/auth-hero.jpg" alt="Driver on modern highway" />
        <div className="auth-hero-content">
          <p className="text-[11px] tracking-[0.28em] text-[#c6a15b] uppercase">Account recovery</p>
          <h2 className="mt-2 font-display text-5xl">Set a new password</h2>
          <p className="mt-4 max-w-md text-white/70">
            Enter the reset token you received and choose a secure new password to regain access to your account.
          </p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-card animate-slide-up">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#c6a15b] uppercase">Account recovery</p>
          <h2 className="mt-2 font-display text-3xl">Choose a new password</h2>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && <Alert kind="error">{error}</Alert>}
            {ok && <Alert kind="success">Password updated. Redirecting to sign in…</Alert>}
            <Field label="Reset token" required>
              <Input value={token} onChange={(e) => setToken(e.target.value)} />
            </Field>
            <Field label="New password" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field label="Confirm" required>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <Button type="submit" className="w-full" size="lg">
              Update password
            </Button>
            <Link to="/login" className="block text-center text-sm font-semibold text-[#0e7c7b] transition hover:underline">
              Back to sign in
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
