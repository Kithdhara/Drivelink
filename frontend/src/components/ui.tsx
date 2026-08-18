import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cls, statusTone } from '../lib/utils';
import type { ApplicationStatus } from '../types';
import { STATUS_LABELS } from '../types';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-md',
    md: 'h-10 px-4 text-sm rounded-lg',
    lg: 'h-12 px-6 text-base rounded-lg',
  };
  const variants = {
    primary: 'bg-[#0b1c33] text-[#f6f1e7] hover:bg-[#16304f] shadow-sm',
    gold: 'bg-[#c6a15b] text-[#0b1c33] hover:bg-[#d4b46e] shadow-sm',
    secondary: 'bg-white text-[#0b1c33] border border-[#0b1c33]/15 hover:border-[#c6a15b] hover:bg-[#f6f1e7]',
    ghost: 'bg-transparent text-[#0b1c33] hover:bg-[#0b1c33]/6',
    danger: 'bg-[#9f1239] text-white hover:bg-[#be123c]',
  };
  return (
    <button className={cls(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0b1c33]/70">
        {label}
        {required && <span className="text-[#9f1239]">*</span>}
      </span>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[#0b1c33]/55">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-[#9f1239]">{error}</p>}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-[#0b1c33]/15 bg-white px-3 py-2.5 text-sm text-[#0b1c33] outline-none transition placeholder:text-[#0b1c33]/35 focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/30';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cls(inputCls, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cls(inputCls, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cls(inputCls, 'min-h-[110px] resize-y', props.className)} />;
}

export function Card({
  children,
  className,
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={cls(
        'rounded-2xl border border-[#0b1c33]/8 bg-white/90 shadow-[0_10px_30px_-18px_rgba(11,28,51,0.45)]',
        pad && 'p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'ink',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: 'ink' | 'gold' | 'teal' | 'rose';
}) {
  const tones = {
    ink: 'from-[#0b1c33] to-[#16304f] text-[#f6f1e7]',
    gold: 'from-[#c6a15b] to-[#a8843d] text-[#0b1c33]',
    teal: 'from-[#0e7c7b] to-[#0b5e5d] text-white',
    rose: 'from-[#9f1239] to-[#7f1d1d] text-white',
  };
  return (
    <div className={cls('relative overflow-hidden rounded-2xl bg-linear-to-br p-5 shadow-md', tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold leading-none">{value}</p>
          {hint && <p className="mt-2 text-xs opacity-75">{hint}</p>}
        </div>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
      <div className="pointer-events-none absolute -right-6 -bottom-8 h-24 w-24 rounded-full border-8 border-white/10" />
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children?: ReactNode;
  tone?: 'neutral' | 'success' | 'danger' | 'warn' | 'info' | 'gold';
}) {
  const map = {
    neutral: 'bg-[#0b1c33]/8 text-[#0b1c33]',
    success: 'bg-teal-100 text-teal-900',
    danger: 'bg-rose-100 text-rose-900',
    warn: 'bg-amber-100 text-amber-900',
    info: 'bg-sky-100 text-sky-900',
    gold: 'bg-[#c6a15b]/25 text-[#6b4e16]',
  };
  return (
    <span className={cls('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide', map[tone])}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={statusTone(status) as 'success' | 'danger' | 'warn' | 'neutral'}>{STATUS_LABELS[status]}</Badge>;
}

export function Alert({
  kind = 'info',
  title,
  children,
}: {
  kind?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
}) {
  const map = {
    info: { cls: 'bg-sky-50 border-sky-200 text-sky-950', Icon: Info },
    success: { cls: 'bg-teal-50 border-teal-200 text-teal-950', Icon: CheckCircle2 },
    warning: { cls: 'bg-amber-50 border-amber-200 text-amber-950', Icon: AlertCircle },
    error: { cls: 'bg-rose-50 border-rose-200 text-rose-950', Icon: AlertCircle },
  };
  const { cls: c, Icon } = map[kind];
  return (
    <div className={cls('flex gap-3 rounded-xl border px-4 py-3 text-sm', c)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>
      </div>
    </div>
  );
}

export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 h-px w-16 bg-[#c6a15b]" />
      <p className="font-display text-xl text-[#0b1c33]">{title}</p>
      {hint && <p className="mt-1 max-w-md text-sm text-[#0b1c33]/60">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button aria-label="Close" className="absolute inset-0 bg-[#0b1c33]/55 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cls(
          'relative z-10 max-h-[92vh] w-full overflow-auto rounded-t-3xl bg-[#f6f1e7] shadow-2xl sm:rounded-3xl',
          wide ? 'max-w-4xl' : 'max-w-lg',
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#0b1c33]/8 bg-[#f6f1e7]/95 px-5 py-4 backdrop-blur">
          <h3 className="font-display text-xl">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-[#0b1c33]/8">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#0b1c33]/40" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cls(inputCls, 'pl-9')}
      />
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c6a15b]">{kicker}</p>
        )}
        <h1 className="font-display text-3xl text-[#0b1c33] sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-[#0b1c33]/65">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Timeline({ status }: { status: ApplicationStatus }) {
  const steps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'medical_passed', label: 'Medical' },
    { key: 'exam_passed', label: 'Exam' },
    { key: 'trial_passed', label: 'Trial' },
    { key: 'approved', label: 'Approved' },
    { key: 'license_issued', label: 'Issued' },
  ];
  const order = ['submitted', 'medical_passed', 'exam_passed', 'trial_passed', 'approved', 'license_issued'];
  let idx = -1;
  if (status === 'documents_verified' || status === 'medical_pending' || status === 'medical_failed') idx = 0;
  else if (status === 'exam_pending' || status === 'exam_failed') idx = 1;
  else if (status === 'trial_pending' || status === 'trial_failed') idx = 2;
  else idx = order.indexOf(status);

  const failed = status.endsWith('_failed') || status === 'rejected';

  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {steps.map((s, i) => {
        const done = idx > i || status === s.key;
        const current = idx === i && status !== 'license_issued';
        return (
          <li key={s.key} className="relative">
            <div
              className={cls(
                'rounded-xl border px-3 py-3',
                done && !failed ? 'border-[#0e7c7b]/30 bg-teal-50' : '',
                current && failed ? 'border-rose-300 bg-rose-50' : '',
                current && !failed ? 'border-[#c6a15b] bg-[#c6a15b]/12' : '',
                !done && !current ? 'border-[#0b1c33]/10 bg-white' : '',
              )}
            >
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#0b1c33]/50">0{i + 1}</p>
              <p className="mt-1 text-sm font-semibold">{s.label}</p>
              <p className="mt-1 text-[11px] text-[#0b1c33]/55">
                {done && status === s.key ? 'Complete' : done ? 'Cleared' : current ? (failed ? 'Attention' : 'In progress') : 'Upcoming'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto rounded-2xl border border-[#0b1c33]/8 bg-white">
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cls('bg-[#0b1c33] px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-[#f6f1e7] uppercase', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cls('border-t border-[#0b1c33]/6 px-4 py-3 align-middle', className)}>{children}</td>;
}

export function Breadcrumb({ items }: { items: { label: string }[] }) {
  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-[#0b1c33]/55">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          <span className={i === items.length - 1 ? 'font-semibold text-[#0b1c33]' : ''}>{it.label}</span>
        </span>
      ))}
    </nav>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-3 font-display text-xl">
      <span className="h-px w-6 bg-[#c6a15b]" />
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------ */
/*  Spinner (loading indicator)                                        */
/* ------------------------------------------------------------------ */

export function Spinner({ size = 'sm', className }: { size?: 'sm' | 'md'; className?: string }) {
  const s = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <svg
      className={cls('animate-spin', s, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll to first validation error                                   */
/* ------------------------------------------------------------------ */

export function scrollToFirstError() {
  requestAnimationFrame(() => {
    const errorEl = document.querySelector('[data-error="true"], .text-\\[\\#9f1239\\]');
    if (errorEl) {
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Print Receipt Wrapper                                              */
/* ------------------------------------------------------------------ */

export function PrintReceipt({ children, open, onClose }: { children: ReactNode; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      window.print();
      onClose();
    }, 100);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-white print-receipt">
      {children}
    </div>
  );
}

