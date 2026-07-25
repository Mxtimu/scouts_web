import React from 'react'
import { Clock, Star, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { TOPIC_META } from '../data/missions'

// Admin-scheduled missions carry a real future opens time; ones with none
// (manual-publish-only) just show static "Opens when published" text.
function formatOpensIn(scheduledOpenAt) {
  if (!scheduledOpenAt) return null
  const ms = new Date(scheduledOpenAt).getTime() - Date.now()
  if (ms <= 0) return 'Live now'
  const totalHours = Math.floor(ms / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0) return `Live in ${days}d ${hours}h`
  if (totalHours > 0) return `Live in ${totalHours}h`
  const mins = Math.floor(ms / (1000 * 60))
  return `Live in ${mins}m`
}

// ── Upcoming card ─────────────────────────────────────────────────────────────
function UpcomingCard({ mission }) {
  const meta = TOPIC_META[mission.topic] || TOPIC_META['Culture']
  const opensIn = formatOpensIn(mission.scheduledOpenAt)

  return (
    <div className="group relative rounded-2xl border border-scout-border bg-scout-card p-4 transition-all duration-200 hover:border-scout-muted hover:shadow-xl hover:shadow-black/30">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent to-scout-bg/40" />

      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${meta.color} ${meta.bg} ${meta.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {mission.topic}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-scout-text-sub group-hover:text-scout-text">{mission.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-scout-text-muted">{mission.teaser}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-scout-text-muted">
            <span className="flex items-center gap-1 text-xs"><Clock size={11} />{mission.estimatedTime}</span>
            <span className="flex items-center gap-1 text-xs"><Star size={11} />{mission.reward}</span>
          </div>
          <span className="text-xs text-scout-text-muted">{opensIn ? opensIn : 'Opens when published'}</span>
        </div>
      </div>
    </div>
  )
}

// ── Current (active) card ─────────────────────────────────────────────────────
function CurrentCard({ mission, onClick }) {
  const meta = TOPIC_META[mission.topic] || TOPIC_META['Culture']
  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-2xl border border-scout-border bg-scout-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-scout-accent/60 hover:shadow-2xl hover:shadow-scout-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-scout-accent"
    >
      <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-scout-accent/0 via-scout-accent/60 to-scout-accent/0 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${meta.color} ${meta.bg} ${meta.border}`}>
            <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${meta.dot}`} />
            {mission.topic}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-bold text-scout-text">{mission.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-scout-text-muted">{mission.teaser}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-scout-text-muted">
            <span className="flex items-center gap-1 text-xs"><Clock size={11} />{mission.estimatedTime}</span>
            <span className="flex items-center gap-1 text-xs font-medium text-scout-accent-light"><Star size={11} />{mission.reward}</span>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-scout-accent group-hover:gap-2 transition-all">
            Start <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Completed card ────────────────────────────────────────────────────────────
function CompletedCard({ mission, onClick }) {
  const meta = TOPIC_META[mission.topic] || TOPIC_META['Culture']
  const submittedDate = mission.submittedAt
    ? new Date(mission.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border border-scout-border bg-scout-card/60 p-4 text-left opacity-75 transition hover:opacity-100 hover:border-scout-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-scout-accent"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${meta.color} ${meta.bg} ${meta.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {mission.topic}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 size={10} strokeWidth={2.5} />
            Submitted
          </span>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-scout-text-muted line-through decoration-scout-muted">{mission.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-scout-text-muted">{mission.teaser}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-emerald-400/70">
            <Star size={11} />
            {mission.reward}
          </span>
          {submittedDate && (
            <span className="text-xs text-scout-text-muted">Submitted {submittedDate}</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Missed card ───────────────────────────────────────────────────────────────
function MissedCard({ mission, onClick }) {
  const meta = TOPIC_META[mission.topic] || TOPIC_META['Culture']

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border border-rose-500/20 bg-scout-card/60 p-4 text-left opacity-75 transition hover:opacity-100 hover:border-rose-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${meta.color} ${meta.bg} ${meta.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {mission.topic}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
            <AlertTriangle size={10} strokeWidth={2.5} />
            Missed
          </span>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-scout-text-muted line-through decoration-scout-muted">{mission.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-scout-text-muted">{mission.teaser}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-scout-text-muted line-through">
            <Star size={11} />
            {mission.reward}
          </span>
          <span className="text-xs text-rose-400/70">Window closed</span>
        </div>
      </div>
    </button>
  )
}

// ── Exported dispatcher ───────────────────────────────────────────────────────
export default function MissionCard({ mission, onClick }) {
  if (mission.status === 'upcoming') return <UpcomingCard mission={mission} />
  if (mission.status === 'current')  return <CurrentCard  mission={mission} onClick={onClick} />
  if (mission.status === 'missed')   return <MissedCard   mission={mission} onClick={onClick} />
  return <CompletedCard mission={mission} onClick={onClick} />
}
