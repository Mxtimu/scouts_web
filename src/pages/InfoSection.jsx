import React from 'react'
import { Zap, ArrowRight, MessageSquare, Image, Mic } from 'lucide-react'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create your profile',
    body: 'Sign up fast. Your Scout ID keeps you anonymous.',
  },
  {
    step: '02',
    title: 'Pick up missions',
    body: 'Every wave brings short missions. Write, record a voice note (1–2 minutes), or upload a safe photo.',
  },
  {
    step: '03',
    title: 'Get rewarded',
    body: 'Submit your evidence and redeem your reward. Bonuses for richer, more detailed stories.',
  },
]

const FEATURES = [
  { Icon: MessageSquare, label: 'Write your take',     desc: 'Long-form text responses when you need to say more.' },
  { Icon: Image,         label: 'Upload proof',         desc: 'Screenshots or photos to support your answer — cropped and blurred.' },
  { Icon: Mic,           label: 'Record a voice note',  desc: 'Speak your mind — up to 3 minutes of audio.' },
]

export default function InfoSection({ onGoToMissions }) {
  return (
    <div className="min-h-screen bg-scout-bg text-slate-200">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-scout-border bg-gradient-to-b from-scout-surface to-scout-bg">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-scout-accent/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-scout-accent/30 bg-scout-accent/10 px-3 py-1 text-xs font-semibold text-scout-accent-light">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-scout-accent" />
            June 2026 wave is live
          </div>

          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Your voice.{' '}
            <span className="text-scout-accent">Real stories.</span>{' '}
            <br className="hidden sm:block" />
            Real impact.
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Signal Scouts is the platform where youth shape the playbook for how brands listen. Complete short missions, share your perspective, and get rewarded — safely and anonymously.
          </p>

          <button
            onClick={onGoToMissions}
            className="inline-flex items-center gap-2 rounded-2xl bg-scout-accent px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-scout-accent/30 transition hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          >
            Go to Mission Board
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b border-scout-border py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-scout-accent">
            Simple process
          </p>
          <h2 className="mb-10 text-center text-2xl font-extrabold text-white sm:text-3xl">
            How Signal Scouts works
          </h2>

          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, body }) => (
              <div key={step} className="rounded-2xl border border-scout-border bg-scout-card p-6">
                <span className="mb-3 block text-3xl font-black text-scout-accent/30">{step}</span>
                <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Evidence types ── */}
      <section className="border-b border-scout-border py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-scout-accent">
            Multiple ways to respond
          </p>
          <h2 className="mb-10 text-center text-2xl font-extrabold text-white sm:text-3xl">
            Share your truth, your way
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ Icon, label, desc }) => (
              <div key={label} className="flex gap-4 rounded-2xl border border-scout-border bg-scout-card p-5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-scout-accent/10 border border-scout-accent/20">
                  <Icon size={18} className="text-scout-accent" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-bold text-white">{label}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collective Progress Cue ── */}
      <section className="border-b border-scout-border py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-3xl border border-scout-accent/20 bg-gradient-to-b from-scout-surface to-scout-card p-8 sm:p-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-scout-accent">
              Collective Progress
            </p>
            <h2 className="mb-4 text-xl font-extrabold text-white sm:text-2xl">
              Every mission you complete adds your piece to the shared playbook.
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Together, Scouts transform raw youth expression into real economic influence. The playbook unlocks the full map of what it means to be young, where access breaks, and what feels real vs fake when brands try to help.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-scout-border py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-600 sm:px-6">
          Signal Scouts Playbook is powered by{' '}
          <span className="text-slate-400 font-medium">Young Narratives</span>
          {' '}(a Youth-Native cultural translation engine)
        </div>
      </footer>
    </div>
  )
}
