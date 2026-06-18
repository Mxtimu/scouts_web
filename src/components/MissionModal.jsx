import React, { useState, useEffect, useRef } from 'react'
import {
  X, Clock, Star, MessageSquare, Image,
  ArrowLeft, Send, CheckCircle2, Loader2, ChevronDown, Shield, ChevronRight, Zap,
} from 'lucide-react'
import { TOPIC_META } from '../data/missions'
import FileUpload from './FileUpload'
import { submitMission } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

const MAX_CHARS = 1000

const TABS = [
  { id: 'text',  label: 'Write',  Icon: MessageSquare },
  { id: 'image', label: 'Upload', Icon: Image },
]

function usePreventBodyScroll(active) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [active])
}

// ── Intro / rules screen ──────────────────────────────────────────────────────
const RULES = [
  { icon: Shield,  text: 'Keep it safe — no account numbers, passwords, balances, or private family details.' },
  { icon: Shield,  text: 'Skip anything that feels too personal.' },
  { icon: Clock,   text: 'Each mission takes 8–15 minutes.' },
  { icon: Star,    text: 'Real examples beat perfect answers.' },
  { icon: MessageSquare, text: 'Written text (100–200 words) or voice note (1–2 min) per mission.' },
  { icon: Image,   text: 'Photos allowed only if cropped/blurred — no private details visible.' },
  { icon: Mic,     text: 'No video uploads at this stage.' },
]

function IntroScreen({ onStart, onClose }) {
  return (
    <div className="relative flex w-full max-w-2xl animate-slide-up flex-col overflow-hidden rounded-t-3xl border border-scout-border bg-scout-surface max-h-[90vh] sm:rounded-2xl">
      <div className="flex justify-center pt-3 sm:hidden">
        <div className="h-1 w-10 rounded-full bg-scout-muted" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between border-b border-scout-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-scout-accent/10 border border-scout-accent/20">
            <Zap size={16} className="text-scout-accent" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Welcome, Scout</h2>
            <p className="text-xs text-slate-400">Read before you begin</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-scout-card hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Context */}
        <div className="rounded-xl border border-scout-accent/20 bg-scout-accent/5 px-4 py-4">
          <p className="text-sm leading-relaxed text-slate-300">
            You are stepping into five short Signal Scouts quests. Together, Scouts are building a map of how money shows up in youth life — what it unlocks, where access breaks, and what feels real vs fake when banks try to help.
          </p>
        </div>

        {/* Rules */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Rules of Play</p>
          <div className="space-y-2">
            {RULES.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-scout-border bg-scout-card px-3 py-2.5">
                <Icon size={13} className="mt-0.5 flex-shrink-0 text-scout-accent" strokeWidth={2} />
                <p className="text-xs leading-relaxed text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress note */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
          <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-emerald-400" />
          <p className="text-xs leading-relaxed text-emerald-300">
            Each mission you complete adds your piece to the shared map.
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-scout-border bg-scout-surface px-5 py-4">
        <button
          onClick={onStart}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 active:scale-[0.98]"
        >
          Start Mission
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Completed / read-only view ────────────────────────────────────────────────
function CompletedView({ mission, meta, onClose }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const submittedDate = mission.submittedAt
    ? new Date(mission.submittedAt).toLocaleString('en-ZA', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="relative flex w-full max-w-2xl animate-slide-up flex-col overflow-hidden rounded-t-3xl border border-scout-border bg-scout-surface max-h-[90vh] sm:rounded-2xl">
      <div className="flex justify-center pt-3 sm:hidden">
        <div className="h-1 w-10 rounded-full bg-scout-muted" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between border-b border-scout-border px-5 py-4">
        <div className="space-y-1.5 pr-8">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${meta.color} ${meta.bg} ${meta.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {mission.topic}
          </span>
          <h2 className="text-base font-bold text-white leading-snug">{mission.title}</h2>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock size={11} />{mission.estimatedTime}</span>
            <span className="flex items-center gap-1 font-medium text-emerald-400">
              <Star size={11} />{mission.reward}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-scout-card hover:text-white"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Submitted banner */}
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 size={20} className="flex-shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-emerald-400">Evidence submitted</p>
            {submittedDate && (
              <p className="text-xs text-emerald-400/70 mt-0.5">{submittedDate}</p>
            )}
          </div>
        </div>

        {/* Collapsible prompt */}
        {mission.prompt && (
          <div className="rounded-xl border border-scout-border bg-scout-card">
            <button
              onClick={() => setShowPrompt(s => !s)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mission brief</span>
              <ChevronDown
                size={14}
                className={`text-slate-500 transition-transform duration-200 ${showPrompt ? 'rotate-180' : ''}`}
              />
            </button>
            {showPrompt && (
              <p className="px-4 pb-4 text-sm leading-relaxed text-slate-300 border-t border-scout-border pt-3">
                {mission.prompt}
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-slate-500 text-center">
          Submitted missions can't be edited. Contact us if you need to make a correction.
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-scout-border bg-scout-surface px-5 py-4">
        <button
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm font-semibold text-slate-400 transition hover:border-scout-muted hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to missions
        </button>
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function MissionModal({ mission, onClose, onSubmit }) {
  const { user } = useAuth()
  const [step, setStep]             = useState('intro')  // 'intro' | 'mission'
  const [activeTab, setActiveTab]   = useState('text')
  const [text, setText]             = useState('')
  const [files, setFiles]           = useState([])
  const [submitState, setSubmit]    = useState('idle')
  const [submitError, setSubmitError] = useState(null)
  const [showPrompt, setShowPrompt] = useState(true)
  const overlayRef                  = useRef(null)

  usePreventBodyScroll(!!mission)

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  if (!mission) return null

  const meta       = TOPIC_META[mission.topic] || TOPIC_META['Culture']
  const isComplete = mission.status === 'completed'

  if (isComplete) {
    return (
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <CompletedView mission={mission} meta={meta} onClose={onClose} />
      </div>
    )
  }

  const hasContent = text.trim().length > 0 || files.length > 0
  const canSubmit  = hasContent && submitState === 'idle'

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmit('loading')
    setSubmitError(null)
    try {
      await submitMission({
        scout_id:      user?.scout_id || 'anonymous',
        mission_id:    mission.id,
        wave:          'June 2026',
        text_response: text,
        image_files:   files,
      })
      setSubmit('success')
      setTimeout(() => {
        onSubmit?.(mission.id)
        onClose()
      }, 1000)
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.')
      setSubmit('idle')
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 animate-fade-in glass"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {step === 'intro' && (
        <IntroScreen onStart={() => setStep('mission')} onClose={onClose} />
      )}
      {step === 'mission' && (
      <div className="relative flex w-full max-w-2xl animate-slide-up flex-col overflow-hidden rounded-t-3xl border border-scout-border bg-scout-surface max-h-[90vh] sm:rounded-2xl">

        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-scout-muted" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-scout-border px-5 py-4">
          <div className="space-y-1.5 pr-8">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${meta.color} ${meta.bg} ${meta.border}`}>
              <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${meta.dot}`} />
              {mission.topic}
            </span>
            <h2 id="modal-title" className="text-base font-bold text-white leading-snug">
              {mission.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock size={11} />{mission.estimatedTime}</span>
              <span className="flex items-center gap-1 font-medium text-scout-accent-light"><Star size={11} />{mission.reward}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-scout-card hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div className="rounded-xl border border-scout-border bg-scout-card">
            <button
              onClick={() => setShowPrompt(s => !s)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mission brief</span>
              <ChevronDown
                size={14}
                className={`text-slate-500 transition-transform duration-200 ${showPrompt ? 'rotate-180' : ''}`}
              />
            </button>
            {showPrompt && (
              <p className="px-4 pb-4 text-sm leading-relaxed text-slate-300 border-t border-scout-border pt-3">
                {mission.prompt}
              </p>
            )}
          </div>

          {/* Tab selector */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Your evidence</p>
            <div className="grid grid-cols-3 gap-2">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold transition-all ${
                    activeTab === id
                      ? 'border-scout-accent/50 bg-scout-accent/10 text-scout-accent-light shadow-lg shadow-scout-accent/10'
                      : 'border-scout-border bg-scout-card text-slate-400 hover:border-scout-muted hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab panels */}
          <div className="animate-fade-in">
            {activeTab === 'text' && (
              <div className="space-y-2">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="Share your thoughts, experiences, opinions… there are no wrong answers."
                  rows={6}
                  className="w-full resize-none rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                />
                <div className="flex justify-end">
                  <span className={`text-xs ${text.length >= MAX_CHARS ? 'text-rose-400' : text.length > MAX_CHARS * 0.8 ? 'text-amber-400' : 'text-slate-600'}`}>
                    {text.length}/{MAX_CHARS}
                  </span>
                </div>
              </div>
            )}
            {activeTab === 'image' && <FileUpload onFilesChange={setFiles} />}
          </div>

          {/* Content summary chips */}
          {(text.trim() || files.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {text.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full border border-scout-accent/20 bg-scout-accent/10 px-2.5 py-0.5 text-[11px] text-scout-accent-light">
                  <MessageSquare size={10} /> {text.trim().split(/\s+/).length} words
                </span>
              )}
              {files.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-scout-accent/20 bg-scout-accent/10 px-2.5 py-0.5 text-[11px] text-scout-accent-light">
                  <Image size={10} /> {files.length} file{files.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-scout-border bg-scout-surface px-5 py-4">
          {submitError && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-400">
              <X size={12} className="mt-0.5 flex-shrink-0" />
              {submitError}
            </div>
          )}
          {submitState === 'success' ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={16} />
              Evidence submitted!
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm font-semibold text-slate-400 transition hover:border-scout-muted hover:text-white"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Back</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                  canSubmit
                    ? 'bg-scout-accent text-white shadow-lg shadow-scout-accent/25 hover:opacity-90 active:scale-[0.98]'
                    : 'cursor-not-allowed bg-scout-card text-slate-600'
                }`}
              >
                {submitState === 'loading' ? (
                  <><Loader2 size={16} className="animate-spin" />Submitting…</>
                ) : (
                  <><Send size={14} />Submit Evidence</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
