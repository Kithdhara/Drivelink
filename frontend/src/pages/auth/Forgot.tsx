import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { validateEmail } from '../../lib/utils';
import { Alert, Button, Field, Input } from '../../components/ui';

export default function Forgot() {
  const { requestReset } = useStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateEmail(email);
    if (v) {
      setError(v);
      return;
    }
    const res = requestReset(email);
    if (!res.ok) {
      setError(res.error);
      setToken('');
      return;
    }
    setError('');
    setToken(res.token);
  }

  return (
    <div className="auth-split">
      <div className="auth-hero">
        <img src="/images/auth-hero.jpg" alt="Driver on modern highway" />
        <div className="auth-hero-content">
          <p className="text-[11px] tracking-[0.28em] text-[#c6a15b] uppercase">Account recovery</p>
          <h2 className="mt-2 font-display text-5xl">Reset your credentials</h2>
          <p className="mt-4 max-w-md text-white/70">
            Enter the email linked to your account. A reset token will be issued so you can choose a new password.
          </p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-card animate-slide-up">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#c6a15b] uppercase">Account recovery</p>
          <h2 className="mt-2 font-display text-3xl">Reset your password</h2>
          <p className="mt-2 text-sm text-[#0b1c33]/60">
            Enter the email on your account. In this prototype the reset token is displayed so you can complete the flow
            without a mailbox.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && <Alert kind="error">{error}</Alert>}
            {token && (
              <Alert kind="success" title="Reset token issued">
                Use this token on the next screen:{' '}
                <span className="font-mono font-semibold">{token}</span>
                <div className="mt-2">
                  <Link to={`/reset?token=${token}`} className="font-semibold underline">
                    Continue to set a new password
                  </Link>
                </div>
              </Alert>
            )}
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button type="submit" className="w-full" size="lg">
              Send reset token
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
