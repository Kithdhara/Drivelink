import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  RefreshCw,
  ScrollText,
  Settings,
  Shield,
  Stethoscope,
  UserRound,
  Users,
  CalendarDays,
  GraduationCap,
  Car,
  X,
  Landmark,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { ROLE_LABELS } from '../types';
import type { Role } from '../types';
import { cls, initials } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';

const MENUS: Record<Role, { to: string; label: string; icon: typeof LayoutDashboard }[]> = {
  applicant: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/apply', label: 'New Application', icon: FileText },
    { to: '/app/renew', label: 'Renew Licence', icon: RefreshCw },
    { to: '/app/medical', label: 'Medical Booking', icon: Stethoscope },
    { to: '/app/exam', label: 'Exam Booking', icon: ClipboardList },
    { to: '/app/trial', label: 'Trial Booking', icon: Car },
    { to: '/app/payments', label: 'Payments', icon: CreditCard },
    { to: '/app/notifications', label: 'Notifications', icon: Bell },
    { to: '/app/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { to: '/app/profile', label: 'Profile', icon: UserRound },
  ],
  officer: [
    { to: '/officer', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/officer/applications', label: 'Applications', icon: FileText },
    { to: '/officer/reports', label: 'Reports', icon: ScrollText },
    { to: '/officer/notifications', label: 'Notifications', icon: Bell },
    { to: '/officer/profile', label: 'Profile', icon: UserRound },
  ],
  coordinator: [
    { to: '/coordinator', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/coordinator/schedules', label: 'Schedules', icon: CalendarDays },
    { to: '/coordinator/bookings', label: 'Daily Bookings', icon: ClipboardList },
    { to: '/coordinator/locations', label: 'Locations', icon: Landmark },
    { to: '/coordinator/notifications', label: 'Notifications', icon: Bell },
    { to: '/coordinator/profile', label: 'Profile', icon: UserRound },
  ],
  examiner: [
    { to: '/examiner', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/examiner/schedule', label: 'Assigned Schedule', icon: CalendarDays },
    { to: '/examiner/history', label: 'Attempt History', icon: ScrollText },
    { to: '/examiner/notifications', label: 'Notifications', icon: Bell },
    { to: '/examiner/profile', label: 'Profile', icon: UserRound },
  ],
  trainer: [
    { to: '/trainer', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/trainer/trainees', label: 'Trainees', icon: GraduationCap },
    { to: '/trainer/schedule', label: 'My Schedule', icon: CalendarDays },
    { to: '/trainer/notifications', label: 'Notifications', icon: Bell },
    { to: '/trainer/profile', label: 'Profile', icon: UserRound },
  ],
  medical: [
    { to: '/medical', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/medical/appointments', label: 'Appointments', icon: HeartPulse },
    { to: '/medical/notifications', label: 'Notifications', icon: Bell },
    { to: '/medical/profile', label: 'Profile', icon: UserRound },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/reports', label: 'Analytics', icon: ScrollText },
    { to: '/admin/audit', label: 'Audit Log', icon: Shield },
    { to: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/profile', label: 'Profile', icon: UserRound },
  ],
};

/** Resolve the current URL path to a human-readable page title */
function usePageTitle(items: typeof MENUS.applicant): string {
  const loc = useLocation();
  return useMemo(() => {
    // Try exact match first, then prefix match
    const exact = items.find((i) => i.to === loc.pathname);
    if (exact) return exact.label;
    const prefix = items
      .filter((i) => loc.pathname.startsWith(i.to) && i.to !== items[0].to)
      .sort((a, b) => b.to.length - a.to.length)[0];
    if (prefix) return prefix.label;
    // Fallback: capitalize the last path segment
    const seg = loc.pathname.split('/').filter(Boolean).pop() ?? '';
    return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ') || 'Dashboard';
  }, [loc.pathname, items]);
}

export function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f3eee4] text-[#0b1c33]">
      <header className="sticky top-0 z-40 border-b border-[#c6a15b]/30 bg-[#0b1c33] text-[#f6f1e7]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/seal.png" alt="Sri Lanka National Emblem" className="h-11 w-auto max-w-[44px] object-contain drop-shadow-md" />
            <div className="leading-tight">
              <p className="text-[10px] tracking-[0.28em] text-[#c6a15b] uppercase">Republic Service Portal</p>
              <p className="font-display text-lg">National Motor Traffic Authority</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="/#services" className="transition hover:text-[#c6a15b]">
              Services
            </a>
            <a href="/#process" className="transition hover:text-[#c6a15b]">
              Process
            </a>
            <a href="/#centres" className="transition hover:text-[#c6a15b]">
              Centres
            </a>
            {user ? (
              <Link
                to={MENUS[user.role][0].to}
                className="rounded-full bg-[#c6a15b] px-4 py-1.5 font-semibold text-[#0b1c33] transition hover:bg-[#d4b46e]"
              >
                Open portal
              </Link>
            ) : (
              <>
                <Link to="/login" className="transition hover:text-[#c6a15b]">
                  Sign in
                </Link>
                <Link to="/register" className="rounded-full bg-[#c6a15b] px-4 py-1.5 font-semibold text-[#0b1c33] transition hover:bg-[#d4b46e]">
                  Register
                </Link>
              </>
            )}
          </nav>
          <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 text-sm md:hidden animate-slide-up">
            <a href="/#services" onClick={() => setOpen(false)} className="transition hover:text-[#c6a15b]">
              Services
            </a>
            <a href="/#process" onClick={() => setOpen(false)} className="transition hover:text-[#c6a15b]">
              Process
            </a>
            {user ? (
              <Link
                to={MENUS[user.role][0].to}
                onClick={() => setOpen(false)}
                className="rounded-full bg-[#c6a15b] px-4 py-1.5 text-center font-semibold text-[#0b1c33]"
              >
                Open portal
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="transition hover:text-[#c6a15b]">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#c6a15b] px-4 py-1.5 text-center font-semibold text-[#0b1c33]"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </header>
      <Outlet />
      <footer className="border-t border-[#0b1c33]/10 bg-[#0b1c33] text-[#f6f1e7]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <p className="font-display text-xl">NMTA Digital Licence Service</p>
            <p className="mt-2 text-sm text-white/65">
              Official prototype of the web-based driving licence issuing service. All transactions in this demo are
              simulated.
            </p>
          </div>
          <div className="text-sm text-white/70">
            <p className="mb-2 font-semibold text-[#c6a15b]">Headquarters</p>
            <p>341 Baseline Road, Colombo 09</p>
            <p>Hotline 1919 · licence@nmta.gov.lk</p>
          </div>
          <div className="text-sm text-white/70">
            <p className="mb-2 font-semibold text-[#c6a15b]">Hours</p>
            <p>Weekdays 08:30 – 16:15</p>
            <p>One-Day Service counters close 14:00</p>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/45">
          © {new Date().getFullYear()} National Motor Traffic Authority · Motor Traffic Act portal
        </div>
      </footer>
    </div>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { state } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const items = user ? MENUS[user.role] : [];
  const unread = useMemo(
    () => (user ? state.notifications.filter((n) => n.userId === user.id && !n.read).length : 0),
    [state.notifications, user],
  );
  const pageTitle = usePageTitle(items);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#efe8d9] text-[#0b1c33]">
      <div className="flex min-h-screen">
        <aside
          className={cls(
            'fixed inset-y-0 left-0 z-40 w-68 md:sticky md:top-0 md:h-screen transform border-r border-white/10 bg-[#0b1c33] text-[#f6f1e7] transition md:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
                <img src="/images/seal.png" alt="" className="h-9 w-auto max-w-[38px] object-contain drop-shadow-sm" />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold leading-tight">NMTA Portal</p>
                  <p className="truncate text-[10px] tracking-[0.18em] text-[#c6a15b] uppercase">Licence Service</p>
                </div>
                <button className="ml-auto md:hidden" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
                {items.map((it) => {
                  const Icon = it.icon;
                  const exact = it.to.split('/').length <= 2;
                  return (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={exact}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cls(
                          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                          isActive ? 'bg-[#c6a15b] font-semibold text-[#0b1c33]' : 'text-white/75 hover:bg-white/6 hover:text-white',
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.label === 'Notifications' && unread > 0 && (
                        <span className="rounded-full bg-[#9f1239] px-2 py-0.5 text-xs font-bold text-white">{unread}</span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            <div className="border-t border-white/10 p-3 bg-black/15 flex items-center justify-between gap-2">
              <Link
                to={items.find((i) => i.label === 'Profile')?.to ?? '#'}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 transition hover:bg-white/5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c6a15b] font-display text-sm font-semibold text-[#0b1c33]">
                  {initials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-white/55">{ROLE_LABELS[user.role]}</p>
                </div>
              </Link>
              <button
                type="button"
                title="Sign out"
                onClick={() => setConfirmSignOut(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/75 transition hover:bg-rose-950/50 hover:border-rose-500/50 hover:text-rose-300 cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <ConfirmDialog
          open={confirmSignOut}
          title="Sign out of NMTA Portal?"
          message="Are you sure you want to end your active session? You will need to sign in with your credentials to access your workspace again."
          confirmLabel="Yes, sign out"
          cancelLabel="Stay signed in"
          variant="danger"
          onConfirm={() => {
            setConfirmSignOut(false);
            logout();
            navigate('/');
          }}
          onCancel={() => setConfirmSignOut(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#0b1c33]/8 bg-[#f6f1e7]/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-[#0b1c33]/10 p-2 md:hidden" onClick={() => setOpen(true)}>
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#c6a15b] uppercase">
                  {ROLE_LABELS[user.role]}
                </p>
                <p className="text-sm font-semibold text-[#0b1c33]">{pageTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={items.find((i) => i.label === 'Notifications')?.to ?? '#'}
                className="relative rounded-full border border-[#0b1c33]/10 bg-white p-2 transition hover:border-[#c6a15b]/40"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#9f1239]" />}
              </Link>
              <Link to={items.find((i) => i.label === 'Profile')?.to ?? '#'} className="hidden items-center gap-2 sm:flex">
                <Settings className="h-4 w-4 text-[#0b1c33]/50 transition hover:text-[#0b1c33]" />
              </Link>
            </div>
          </header>
          <main className="paper-grid flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
