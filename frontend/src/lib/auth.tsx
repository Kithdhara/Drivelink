import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { Role, User } from '../types';
import { ROLE_HOME } from '../types';
import { useStore } from './store';

const SESSION_KEY = 'nmta-session';
const IDLE_MS = 20 * 60 * 1000;

interface AuthApi {
  user: User | null;
  login: (email: string, password: string) => { ok: true; user: User } | { ok: false; error: string };
  enterSession: (user: User) => void;
  logout: () => void;
  refresh: () => void;
}

const AuthCtx = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { state, login: doLogin, log } = useStore();
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const timer = useRef<number | null>(null);

  const user = useMemo(() => {
    if (pendingUser && (!userId || pendingUser.id === userId)) return pendingUser;
    return state.users.find((u) => u.id === userId && u.active) ?? null;
  }, [state.users, userId, pendingUser]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setPendingUser(null);
    setUserId(null);
  }, []);

  const bump = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!userId) return;
    timer.current = window.setTimeout(() => {
      logout();
    }, IDLE_MS);
  }, [logout, userId]);

  useEffect(() => {
    bump();
    const evts = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    evts.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => {
      evts.forEach((e) => window.removeEventListener(e, bump));
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [bump]);

  const enterSession = useCallback(
    (next: User) => {
      try {
        localStorage.setItem(SESSION_KEY, next.id);
      } catch {
        /* ignore */
      }
      flushSync(() => {
        setPendingUser(next);
        setUserId(next.id);
      });
      try {
        log({
          userId: next.id,
          userName: next.name,
          action: 'LOGIN',
          entity: 'User',
          entityId: next.id,
          details: `Signed in as ${next.role}`,
        });
      } catch {
        /* never block sign-in on audit */
      }
    },
    [log],
  );

  const login = useCallback(
    (email: string, password: string) => {
      try {
        const res = doLogin(email, password);
        if (!res.ok) return res;
        enterSession(res.user);
        return { ok: true as const, user: res.user };
      } catch {
        return { ok: false as const, error: 'Could not sign in. Please try a demo role again.' };
      }
    },
    [doLogin, enterSession],
  );

  const refresh = useCallback(() => {
    setUserId(localStorage.getItem(SESSION_KEY));
  }, []);

  const value = useMemo(
    () => ({ user, login, enterSession, logout, refresh }),
    [user, login, enterSession, logout, refresh],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setWaited(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!waited) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (roles && !roles.includes(user.role)) {
      navigate(ROLE_HOME[user.role], { replace: true });
    }
  }, [user, roles, navigate, waited]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1c33] text-[#c6a15b]">
        <p className="font-display text-xl">Opening your workspace…</p>
      </div>
    );
  }
  if (roles && !roles.includes(user.role)) return null;
  return <>{children}</>;
}
