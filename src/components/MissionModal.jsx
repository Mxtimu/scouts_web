import React, { useState, useEffect, useRef } from 'react'
import {
  X, Clock, Star, MessageSquare, Image, Lock,
  ArrowLeft, Send, CheckCircle2, Loader2, ChevronDown, Shield,
  ChevronRight, Zap, Edit2, Save, AlertCircle, Trash2,
} from 'lucide-react'
import { TOPIC_META } from '../data/missions'
import FileUpload from './FileUpload'
import { submitMission, updateSubmission, uploadSubmissionImages } from '../services/supabase'
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
  { icon: Shield,       text: 'Keep it safe — no account numbers, passwords, balances, or private family details.' },
  { icon: Shield,       text: 'Skip anything that feels too personal.' },
  { icon: Clock,        text: 'Each mission takes 8–15 minutes.' },
  { icon: Star,         text: 'Real examples beat perfect answers.' },
  { icon: MessageSquare,text: 'Written text (100–200 words) per mission.' },
  { icon: Image,        text: 'Photos allowed only if cropped/blurred — no private details visible.' },
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
            <h2 className="text-base font-bold text-scout-text">Welcome, Scout</h2>
            <p className="text-xs text-scout-text-muted">Read before you begin</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-scout-text-muted transition hover:bg-scout-card hover:text-scout-text"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div className="rounded-xl border border-scout-accent/20 bg-scout-accent/5 px-4 py-4">
          <p className="text-sm leading-relaxed text-scout-text-sub">
            You are stepping into five short Signal Scouts quests. Together, Scouts are building a map of how money shows up in youth life — what it unlocks, where access breaks, and what feels real vs fake when banks try to help.
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-scout-text-muted">Rules of Play</p>
          <div className="space-y-2">
            {RULES.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-scout-border bg-scout-card px-3 py-2.5">
                <Icon size={13} className="mt-0.5 flex-shrink-0 text-scout-accent" strokeWidth={2} />
                <p className="text-xs leading-relaxed text-scout-text-sub">{text}</p>
              </div>
            ))}
          </div>
        </div>

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

// ── Completed / read-only + edit view ────────────────────────────────────────
function CompletedView({ mission, meta, onClose, onUpdate, isExpired }) {
  const { user } = useAuth()
  const [currentText, setCurrentText]     = useState(mission.submittedText || '')
  const [currentImages, setCurrentImages] = useState(mission.submittedImages || [])
  const [editing, setEditing]             = useState(false)
  const [editText, setEditText]           = useState(mission.submittedText || '')
  const [editImages, setEditImages]       = useState(mission.submittedImages || [])
  const [newFiles, setNewFiles]           = useState([])
  const [saving, setSaving]               = useState(false)
  const [saveError, setSaveError]         = useState(null)
  const [showPrompt, setShowPrompt]       = useState(false)

  const submittedDate = mission.submittedAt
    ? new Date(mission.submittedAt).toLocaleString('en-ZA', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  const handleStartEdit = () => {
    setEditText(currentText)
    setEditImages(currentImages)
    setNewFiles([])
    setSaveError(null)
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditText(currentText)
    setEditImages(currentImages)
    setNewFiles([])
    setSaveError(null)
  }

  const handleRemoveImage = (url) => {
    setEditImages(prev => prev.filter(u => u !== url))
  }

  const handleSave = async () => {
    if (!editText.trim()) return
    if (!user?.scout_id) {
      setSaveError('Your session looks out of date. Please log out and log back in, then try again.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const uploadedUrls = newFiles.length ? await uploadSubmissionImages(newFiles) : []
      const finalImages  = [...editImages, ...uploadedUrls]
      await updateSubmission({
        scout_id:      user.scout_id,
        mission_id:    mission.id,
        text_response: editText,
        images:        finalImages,
      })
      setCurrentText(editText)
      setCurrentImages(finalImages)
      onUpdate?.(mission.id, editText, finalImages)
      setEditing(false)
    } catch (err) {
      setSaveError(err.message || 'Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

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
          <h2 className="text-base font-bold text-scout-text leading-snug">{mission.title}</h2>
          <div className="flex items-center gap-3 text-xs text-scout-text-muted">
            <span className="flex items-center gap-1"><Clock size={11} />{mission.estimatedTime}</span>
            <span className="flex items-center gap-1 font-medium text-emerald-400">
              <Star size={11} />{mission.reward}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-scout-text-muted transition hover:bg-scout-card hover:text-scout-text"
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
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-400">Evidence submitted</p>
            {submittedDate && (
              <p className="text-xs text-emerald-400/70 mt-0.5">{submittedDate}</p>
            )}
          </div>
          {isExpired && (
            <span className="inline-flex items-center gap-1 rounded-full border border-scout-border bg-scout-card px-2 py-0.5 text-[10px] font-medium text-scout-text-muted">
              <Lock size={9} /> Editing closed
            </span>
          )}
        </div>

        {/* Response section */}
        {editing ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-scout-text-muted">Edit your response</p>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Update your response…"
              rows={7}
              autoFocus
              className="w-full resize-none rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm text-scout-text-sub placeholder-scout-text-muted outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-scout-text-muted">Changes save to Supabase immediately</span>
              <span className={`text-xs ${editText.length >= MAX_CHARS ? 'text-rose-400' : 'text-scout-text-muted'}`}>
                {editText.length}/{MAX_CHARS}
              </span>
            </div>
            {saveError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle size={12} /> {saveError}
              </div>
            )}
          </div>
        ) : currentText ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-scout-text-muted">Your response</p>
            <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-3">
              <p className="text-sm leading-relaxed text-scout-text-sub whitespace-pre-wrap">{currentText}</p>
            </div>
          </div>
        ) : null}

        {/* Photos section */}
        {editing ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-scout-text-muted">Your photos</p>
            {editImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {editImages.map((url) => (
                  <div key={url} className="group relative overflow-hidden rounded-xl border border-scout-border bg-scout-surface">
                    <img src={url} alt="Submitted evidence" className="h-24 w-full object-cover" />
                    <button
                      onClick={() => handleRemoveImage(url)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-rose-500"
                      aria-label="Remove photo"
                    >
                      <Trash2 size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <FileUpload onFilesChange={setNewFiles} />
          </div>
        ) : currentImages.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-scout-text-muted">Your photos</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {currentImages.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-scout-border bg-scout-surface transition hover:border-scout-muted">
                  <img src={url} alt="Submitted evidence" className="h-24 w-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* Collapsible mission prompt */}
        {mission.prompt && (
          <div className="rounded-xl border border-scout-border bg-scout-card">
            <button
              onClick={() => setShowPrompt(s => !s)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-scout-text-muted">Mission brief</span>
              <ChevronDown
                size={14}
                className={`text-scout-text-muted transition-transform duration-200 ${showPrompt ? 'rotate-180' : ''}`}
              />
            </button>
            {showPrompt && (
              <p className="px-4 pb-4 text-sm leading-relaxed text-scout-text-sub border-t border-scout-border pt-3">
                {mission.prompt}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-scout-border bg-scout-surface px-5 py-4">
        {editing ? (
          <div className="flex gap-3">
            <button
              onClick={handleCancelEdit}
              className="flex items-center justify-center gap-2 rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm font-semibold text-scout-text-muted transition hover:border-scout-muted hover:text-scout-text"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editText.trim()}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                saving || !editText.trim()
                  ? 'cursor-not-allowed bg-scout-card text-scout-text-muted'
                  : 'bg-scout-accent text-white shadow-lg shadow-scout-accent/25 hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" />Saving…</>
              ) : (
                <><Save size={14} />Save Changes</>
              )}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm font-semibold text-scout-text-muted transition hover:border-scout-muted hover:text-scout-text"
            >
              <ArrowLeft size={14} />
              Back to missions
            </button>
            {!isExpired && (
              <button
                onClick={handleStartEdit}
                className="flex items-center justify-center gap-2 rounded-xl border border-scout-accent/40 bg-scout-accent/10 px-4 py-3 text-sm font-semibold text-scout-accent-light transition hover:bg-scout-accent/20"
              >
                <Edit2 size={14} />
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Expired / locked state for uncompleted missions ───────────────────────────
function ExpiredView({ mission, meta, onClose }) {
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
          <h2 className="text-base font-bold text-scout-text leading-snug">{mission.title}</h2>
          <div className="flex items-center gap-3 text-xs text-scout-text-muted">
            <span className="flex items-center gap-1"><Clock size={11} />{mission.estimatedTime}</span>
            <span className="flex items-center gap-1 font-medium text-scout-accent-light"><Star size={11} />{mission.reward}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-scout-text-muted transition hover:bg-scout-card hover:text-scout-text"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
          <Lock size={20} className="mt-0.5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Mission window closed</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-400/70">
              The 3-day submission window for this wave has ended. Your other completed missions are still saved.
            </p>
          </div>
        </div>

        {mission.prompt && (
          <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-scout-text-muted">Mission brief</p>
            <p className="text-sm leading-relaxed text-scout-text-sub">{mission.prompt}</p>
          </div>
        )}

        <p className="text-center text-xs text-scout-text-muted">
          Contact us at hello@signalscouts.co.za if you need help.
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-scout-border bg-scout-surface px-5 py-4">
        <button
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm font-semibold text-scout-text-muted transition hover:border-scout-muted hover:text-scout-text"
        >
          <ArrowLeft size={14} />
          Back to missions
        </button>
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function MissionModal({ mission, onClose, onSubmit, onUpdate, isExpired, missionDeadline }) {
  const { user } = useAuth()
  const [step, setStep]             = useState('intro')
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

  const overlayClass = "fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 animate-fade-in glass"

  if (isComplete) {
    return (
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        className={overlayClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <CompletedView
          mission={mission}
          meta={meta}
          onClose={onClose}
          onUpdate={onUpdate}
          isExpired={isExpired}
        />
      </div>
    )
  }

  if (isExpired) {
    return (
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        className={overlayClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <ExpiredView mission={mission} meta={meta} onClose={onClose} />
      </div>
    )
  }

  const hasContent = text.trim().length > 0 || files.length > 0
  const canSubmit  = hasContent && submitState === 'idle'

  const handleSubmit = async () => {
    if (!canSubmit) return
    if (!user?.scout_id) {
      setSubmitError('Your session looks out of date. Please log out and log back in, then try again.')
      return
    }
    setSubmit('loading')
    setSubmitError(null)
    try {
      const imageUrls = await submitMission({
        scout_id:      user.scout_id,
        mission_id:    mission.id,
        wave:          'THE 2026 WAVE',
        text_response: text,
        image_files:   files,
      })
      setSubmit('success')
      setTimeout(() => {
        onSubmit?.(mission.id, text, imageUrls)
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
      className={overlayClass}
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
              <h2 id="modal-title" className="text-base font-bold text-scout-text leading-snug">
                {mission.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-scout-text-muted">
                <span className="flex items-center gap-1"><Clock size={11} />{mission.estimatedTime}</span>
                <span className="flex items-center gap-1 font-medium text-scout-accent-light"><Star size={11} />{mission.reward}</span>
                {missionDeadline && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock size={11} />{formatTimeLeft(missionDeadline)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-scout-text-muted transition hover:bg-scout-card hover:text-scout-text"
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
                <span className="text-xs font-semibold uppercase tracking-wider text-scout-text-muted">Mission brief</span>
                <ChevronDown
                  size={14}
                  className={`text-scout-text-muted transition-transform duration-200 ${showPrompt ? 'rotate-180' : ''}`}
                />
              </button>
              {showPrompt && (
                <p className="px-4 pb-4 text-sm leading-relaxed text-scout-text-sub border-t border-scout-border pt-3">
                  {mission.prompt}
                </p>
              )}
            </div>

            {/* Tab selector */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-scout-text-muted">Your evidence</p>
              <div className="grid grid-cols-2 gap-2">
                {TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold transition-all ${
                      activeTab === id
                        ? 'border-scout-accent/50 bg-scout-accent/10 text-scout-accent-light shadow-lg shadow-scout-accent/10'
                        : 'border-scout-border bg-scout-card text-scout-text-muted hover:border-scout-muted hover:text-scout-text'
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
                    className="w-full resize-none rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm text-scout-text-sub placeholder-scout-text-muted outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                  />
                  <div className="flex justify-end">
                    <span className={`text-xs ${text.length >= MAX_CHARS ? 'text-rose-400' : text.length > MAX_CHARS * 0.8 ? 'text-amber-400' : 'text-scout-text-muted'}`}>
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
                  className="flex items-center justify-center gap-2 rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm font-semibold text-scout-text-muted transition hover:border-scout-muted hover:text-scout-text"
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
                      : 'cursor-not-allowed bg-scout-card text-scout-text-muted'
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

function formatTimeLeft(deadline) {
  const ms = deadline.getTime() - Date.now()
  if (ms <= 0) return 'Closed'
  const totalHours = Math.floor(ms / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0) return `${days}d ${hours}h left`
  return `${totalHours}h left`
}
