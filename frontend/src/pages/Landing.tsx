import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  FileCheck2,
  ShieldCheck,
  Stethoscope,
  Car,
  Clock3,
  Landmark,
} from 'lucide-react';
import { LICENSE_CATEGORIES } from '../types';

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

const child = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Landing() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative min-h-[86vh] overflow-hidden bg-[#0b1c33] text-[#f6f1e7]">
        <img
          src="/images/hero.jpg"
          alt="Sri Lanka National Transport Infrastructure"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1c33] via-[#0b1c33]/80 to-transparent" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 lg:flex-row lg:items-end lg:py-28">
          <motion.div variants={fade} initial="hidden" animate="show" className="max-w-2xl">
            <p className="mb-4 text-[11px] font-semibold tracking-[0.32em] text-[#c6a15b] uppercase">
              Motor Traffic Department · Digital First
            </p>
            <h1 className="font-display text-4xl leading-[1.1] sm:text-6xl">
              One portal.
              <br />
              Your driving licence,
              <br />
              without the queues.
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
              Apply, book medicals, sit the exam, schedule the trial and collect a digital licence — all from a single
              official service. Built for citizens, examiners and every officer in the chain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#c6a15b] px-6 py-3 font-semibold text-[#0b1c33] transition hover:bg-[#d4b46e] hover:shadow-lg"
              >
                Start an application <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-semibold text-white transition hover:bg-white/8 hover:border-white/40"
              >
                Staff & citizen sign in
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/8 p-5 backdrop-blur-md"
          >
            <p className="text-[11px] tracking-[0.2em] text-[#c6a15b] uppercase">Live counters</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {[
                ['Licences issued', '1.2M+'],
                ['Same-day slots', '140 / wk'],
                ['Pass rate (B)', '71%'],
                ['Avg. cycle', '18 days'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-display text-2xl">{v}</p>
                  <p className="text-xs text-white/60">{k}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-white/10 pt-4 text-xs text-white/60">
              Figures shown are illustrative for this working prototype.
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-[#c6a15b] uppercase">Citizen services</p>
        <h2 className="mt-2 font-display text-4xl">Everything the counter used to do</h2>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { icon: FileCheck2, t: 'New licence', d: 'Multi-step application, document upload and officer review.' },
            { icon: Stethoscope, t: 'Medical booking', d: 'Choose a centre and a live slot. Reschedule without a visit.' },
            { icon: CalendarClock, t: 'Exam & trial', d: 'Written, computer and practical tests with capacity control.' },
            { icon: Clock3, t: 'One-Day Service', d: 'Priority processing with a published surcharge, if eligible.' },
          ].map((s) => (
            <motion.div key={s.t} variants={child} className="rounded-2xl border border-[#0b1c33]/8 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
              <s.icon className="h-6 w-6 text-[#c6a15b]" />
              <h3 className="mt-4 font-display text-xl">{s.t}</h3>
              <p className="mt-2 text-sm text-[#0b1c33]/65">{s.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Digital licence showcase ── */}
      <section className="relative overflow-hidden bg-[#0b1c33] py-20 text-[#f6f1e7]">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'url(/images/pattern.svg)',
            backgroundSize: '60px 60px',
            backgroundRepeat: 'repeat',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          {/* Elegant English-Only Driving Licence Card with Security Guilloche Texture */}
          <div className="flex justify-center">
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#c6a15b]/40 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] select-none transition hover:scale-[1.02] hover:shadow-[0_30px_70px_rgba(198,161,91,0.3)]"
              style={{
                backgroundImage: 'url(/images/card-texture.svg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), inset 0 0 0 1px rgba(198, 161, 91, 0.35)',
              }}
            >
              {/* Header: Flag, Title, Emblem */}
              <div className="flex items-center justify-between gap-3 border-b border-[#c6a15b]/30 pb-4">
                <img
                  src="/images/sl-flag.png"
                  alt="Sri Lanka Flag"
                  className="h-8 w-auto rounded-[2px] shadow-sm ring-1 ring-[#c6a15b]/50"
                />
                <div className="text-center leading-tight">
                  <p className="text-[10px] font-bold tracking-[0.22em] text-[#c6a15b] uppercase">
                    Republic of Sri Lanka
                  </p>
                  <h3 className="font-display text-lg font-black tracking-wider text-white">
                    Driving Licence
                  </h3>
                </div>
                <img
                  src="/images/seal.png"
                  alt="State Emblem"
                  className="h-10 w-auto max-w-[40px] object-contain drop-shadow-md"
                />
              </div>

              {/* Body: Avatar + Details */}
              <div className="mt-4 flex items-center gap-4">
                {/* Photo Frame with Clean Avatar Silhouette */}
                <div className="relative h-28 w-22 shrink-0 overflow-hidden rounded-xl border border-[#c6a15b]/40 bg-[#081524] shadow-inner">
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#163456] to-[#091829] text-slate-300">
                    <div className="h-9 w-9 rounded-full bg-[#c6a15b]/25 border border-[#c6a15b]/40" />
                    <div className="mt-1 h-11 w-16 rounded-t-full bg-[#c6a15b]/20 border-t border-[#c6a15b]/30" />
                  </div>
                </div>

                {/* Details Grid */}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[9px] font-bold tracking-widest text-[#c6a15b] uppercase">Full Name</p>
                      <p className="font-semibold text-white truncate">Kumara Perera</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold tracking-widest text-[#c6a15b] uppercase">Licence No.</p>
                      <p className="font-mono font-bold text-[#f5ce62]">B 7845902</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold tracking-widest text-[#c6a15b] uppercase">Date of Birth</p>
                      <p className="text-white/90">12 Mar 1994</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold tracking-widest text-[#c6a15b] uppercase">Valid Until</p>
                      <p className="font-semibold text-[#38bdf8]">11 Mar 2034</p>
                    </div>
                  </div>

                  {/* Classes & Blood Group */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex gap-1.5">
                      {['A1', 'A', 'B', 'B1'].map((cat) => (
                        <span
                          key={cat}
                          className="rounded-md border border-[#c6a15b]/50 bg-[#0b1c33]/80 px-2 py-0.5 text-[10px] font-bold text-[#f5ce62]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-white/80">
                      Blood <strong className="text-[#f43f5e]">O+</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Gold Accent Bar */}
              <div className="mt-4 h-1 w-full rounded-full bg-gradient-to-r from-transparent via-[#c6a15b]/70 to-transparent" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[#c6a15b] uppercase">Digital credential</p>
            <h2 className="mt-2 font-display text-4xl">A licence you can download the hour it is issued</h2>
            <p className="mt-4 text-white/70">
              Once the Registration Officer approves a completed file, the system generates a licence number, validity
              period and a printable confirmation. Renewal holders keep their existing number where the Act allows.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                'Secure role-based staff dashboards',
                'Audit log of every approval and result',
                'Payment history and downloadable receipts',
              ].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-[#c6a15b]" /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Process steps ── */}
      <section id="process" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-display text-4xl">The statutory path, digitised</h2>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="mt-10 grid gap-4 md:grid-cols-6"
        >
          {['Apply', 'Medical', 'Exam', 'Trial', 'Approve', 'Issue'].map((s, i) => (
            <motion.div key={s} variants={child} className="rounded-2xl bg-[#0b1c33] p-4 text-[#f6f1e7] transition hover:bg-[#16304f]">
              <p className="font-display text-3xl text-[#c6a15b]">0{i + 1}</p>
              <p className="mt-3 text-lg font-semibold">{s}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Trust band ── */}
      <section className="bg-[#0e7c7b] py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3">
          {[
            { icon: ShieldCheck, t: 'Verified identity', d: 'NIC uniqueness checks at registration and application.' },
            { icon: Landmark, t: 'Seven official roles', d: 'Citizen, officer, coordinator, examiner, trainer, medical, admin.' },
            { icon: Car, t: 'Nine licence classes', d: 'From light motorcycles to articulated combinations.' },
          ].map((x) => (
            <div key={x.t} className="flex gap-4">
              <x.icon className="h-8 w-8 shrink-0" />
              <div>
                <p className="font-display text-2xl">{x.t}</p>
                <p className="mt-1 text-sm text-white/80">{x.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Licence classes ── */}
      <section id="centres" className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[#c6a15b] uppercase">Licence classes</p>
            <h2 className="mt-2 font-display text-4xl">Choose the category that matches the vehicle you will drive</h2>
            <p className="mt-3 text-[#0b1c33]/65">
              Each class follows the same digital path, with medical fitness and test requirements scaled to the
              vehicle.
            </p>
          </div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {LICENSE_CATEGORIES.map((c) => (
              <motion.div key={c.id} variants={child} className="rounded-xl border border-[#0b1c33]/10 bg-white p-3 transition hover:shadow-md hover:border-[#c6a15b]/30">
                <p className="font-display text-2xl text-[#c6a15b]">{c.id}</p>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-[#0b1c33]/55">{c.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden">
        {/* CSS gradient background instead of missing service-hall image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1c33] via-[#16304f] to-[#0e7c7b]" />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'url(/images/pattern.svg)',
            backgroundSize: '60px 60px',
            backgroundRepeat: 'repeat',
          }}
        />
        <div className="relative px-4 py-24 text-center text-[#f6f1e7]">
          <h2 className="font-display text-4xl">Ready when you are</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">
            Create a citizen account in under two minutes, or sign in with a staff demo role to inspect every
            dashboard.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/register" className="rounded-full bg-[#c6a15b] px-6 py-3 font-semibold text-[#0b1c33] transition hover:bg-[#d4b46e] hover:shadow-lg">
              Create account
            </Link>
            <Link to="/login" className="rounded-full border border-white/30 px-6 py-3 font-semibold transition hover:bg-white/8 hover:border-white/50">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
