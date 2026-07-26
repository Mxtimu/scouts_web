import React, { useState, useEffect } from 'react'
import { LogOut, Plus, Pencil, Trash2, Loader2, AlertCircle, ArrowLeft, Save, LayoutGrid, BarChart3 } from 'lucide-react'
import { TOPIC_META } from '../../data/missions'
import { getMissions, createMission, updateMission, deleteMission, adminSignOut, activateScheduledMissions } from '../../services/supabase'
import InsightsPanel from './InsightsPanel'

const BLANK_FORM = {
  id: '', title: '', teaser: '', topic: 'Culture', status: 'upcoming',
  estimatedTime: '', reward: '', prompt: '', scheduledOpenAt: '',
}

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time —
// neither the raw ISO string from the DB nor Date's default formats match.
function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function MissionForm({ mission, onSaved, onCancel }) {
  const isNew = !mission
  const [form, setForm] = useState(() =>
    mission ? { ...mission, scheduledOpenAt: toDatetimeLocal(mission.scheduledOpenAt) } : BLANK_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.id.trim() || !form.title.trim()) {
      setError('Mission ID and title are required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        scheduledOpenAt: form.scheduledOpenAt ? new Date(form.scheduledOpenAt).toISOString() : null,
      }
      if (isNew) {
        await createMission(payload)
      } else {
        await updateMission(payload.id, payload)
      }
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Could not save mission.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-scout-border bg-scout-card px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button type="button" onClick={onCancel} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
        <ArrowLeft size={14} /> Back to missions
      </button>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Mission ID</label>
          <input value={form.id} onChange={set('id')} disabled={!isNew} placeholder="m-6" className={`${inputClass} disabled:opacity-50`} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Title</label>
          <input value={form.title} onChange={set('title')} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Teaser (shown on the mission card)</label>
        <input value={form.teaser} onChange={set('teaser')} className={inputClass} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Topic</label>
          <select value={form.topic} onChange={set('topic')} className={inputClass}>
            {Object.keys(TOPIC_META).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Status</label>
          <select value={form.status} onChange={set('status')} className={inputClass}>
            <option value="upcoming">Upcoming</option>
            <option value="current">Current</option>
          </select>
          <p className="mt-1 text-[11px] text-slate-500">Switching to Current starts this mission's 72h submission window — it can't be paused once started.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Estimated time</label>
          <input value={form.estimatedTime} onChange={set('estimatedTime')} placeholder="8–15 mins" className={inputClass} />
        </div>
      </div>

      {form.status === 'upcoming' && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Scheduled to go live (optional)</label>
          <input type="datetime-local" value={form.scheduledOpenAt} onChange={set('scheduledOpenAt')} className={inputClass} />
          <p className="mt-1 text-[11px] text-slate-500">Leave blank to only publish by switching Status to Current yourself. If set, it goes live automatically at that time — no need to come back and flip it.</p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Reward</label>
        <input value={form.reward} onChange={set('reward')} placeholder="R50 airtime" className={inputClass} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Mission brief / prompt</label>
        <textarea value={form.prompt} onChange={set('prompt')} rows={10} className={`${inputClass} resize-none`} />
      </div>

      <button
        type="submit" disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl bg-scout-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={14} />}
        {saving ? 'Saving…' : 'Save Mission'}
      </button>
    </form>
  )
}

export default function AdminPanel({ onSignedOut }) {
  const [section, setSection] = useState('missions') // 'missions' | 'insights'
  const [missions, setMissions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [editing, setEditing]   = useState(null) // null | 'new' | mission object
  const [deletingId, setDeletingId] = useState(null)

  const loadMissions = () => {
    setLoading(true)
    activateScheduledMissions()
      .catch(() => {/* best-effort */})
      .finally(() => {
        getMissions()
          .then(setMissions)
          .catch(err => setLoadError(err.message || 'Could not load missions.'))
          .finally(() => setLoading(false))
      })
  }

  useEffect(loadMissions, [])

  const handleSaved = () => {
    setEditing(null)
    loadMissions()
  }

  const handleSignOut = async () => {
    await adminSignOut()
    onSignedOut?.()
  }

  const handleDelete = async (mission) => {
    const confirmed = window.confirm(
      `Delete "${mission.title}" permanently?\n\nThis will also permanently delete any scout submissions already made for this mission — that data cannot be recovered. This cannot be undone.`
    )
    if (!confirmed) return

    setDeletingId(mission.id)
    try {
      await deleteMission(mission.id)
      loadMissions()
    } catch (err) {
      alert(err.message || 'Could not delete mission.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-scout-bg px-4 py-8 sm:px-6">
      <div className={`mx-auto ${section === 'insights' ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Mission control</h1>
          <button onClick={handleSignOut} className="flex items-center gap-2 rounded-xl border border-scout-border bg-scout-card px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white">
            <LogOut size={13} /> Sign out
          </button>
        </div>

        <div className="mb-5 flex items-center gap-1 rounded-xl border border-scout-border bg-scout-card p-1 w-fit">
          <button
            onClick={() => setSection('missions')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              section === 'missions' ? 'bg-scout-surface text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={13} /> Missions
          </button>
          <button
            onClick={() => setSection('insights')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              section === 'insights' ? 'bg-scout-surface text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={13} /> Insights
          </button>
        </div>

        {section === 'insights' && <InsightsPanel />}

        {section === 'missions' && (
        <div className="rounded-2xl border border-scout-border bg-scout-surface p-5">
          {editing ? (
            <MissionForm
              mission={editing === 'new' ? null : editing}
              onSaved={handleSaved}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <>
              <button
                onClick={() => setEditing('new')}
                className="mb-4 flex items-center gap-2 rounded-xl bg-scout-accent px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90"
              >
                <Plus size={14} /> New Mission
              </button>

              {loading && (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" /> Loading missions…
                </div>
              )}

              {loadError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {loadError}
                </div>
              )}

              <div className="space-y-2">
                {missions.map(m => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-scout-border bg-scout-card px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{m.title}</p>
                      <p className="text-xs text-slate-500">
                        {m.id} · {m.topic} · {m.status === 'current' ? 'Current' : 'Upcoming'}
                        {m.status === 'upcoming' && m.scheduledOpenAt && ` · goes live ${new Date(m.scheduledOpenAt).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button onClick={() => setEditing(m)} className="flex items-center gap-1.5 rounded-lg border border-scout-border px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white">
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        disabled={deletingId === m.id}
                        className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        {deletingId === m.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
