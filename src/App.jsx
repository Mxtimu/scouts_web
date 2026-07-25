import React, { useState, useEffect } from 'react'
import { Clock, Lock } from 'lucide-react'
import NavBar from './components/NavBar'
import KanbanBoard from './components/KanbanBoard'
import MissionModal from './components/MissionModal'
import LandingPage from './pages/LandingPage'
import InfoSection from './pages/InfoSection'
import OnboardingGate from './components/OnboardingGate'
import { INITIAL_MISSIONS } from './data/missions'
import { getScoutSubmissions, markScoutOnboarded, getMissions, activateScheduledMissions } from './services/supabase'
import { useAuth } from './context/AuthContext'

function formatDeadline(deadline) {
  const ms = deadline.getTime() - Date.now()
  if (ms <= 0) return 'Closed'
  const totalHours = Math.floor(ms / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h left`
  const mins = Math.floor(ms / (1000 * 60))
  return `${mins}m left`
}

export default function App() {
  const { isAuthenticated, user, updateUser } = useAuth()
  const [baseMissions, setBaseMissions] = useState(null) // null = still loading from Supabase
  const [missions, setMissions] = useState(INITIAL_MISSIONS)
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('missions')
  const [syncing, setSyncing] = useState(true)

  const onboarded = user?.onboarded ?? false

  // Persists on the scout's account so the gate never shows again on any
  // device — previously this only lived in browser localStorage.
  const handleOnboardingComplete = () => {
    updateUser({ onboarded: true })
    if (user?.scout_id) {
      markScoutOnboarded(user.scout_id).catch(() => {/* best-effort */})
    }
  }

  const MISSION_WINDOW_MS = 3 * 24 * 60 * 60 * 1000 // 72h

  const accountWindowStart = user?.first_login_at || user?.created_at

  // A mission's window for THIS scout starts at whichever is later: when
  // the mission was published, or when this scout first logged in. This
  // keeps both cases fair — a mission Zuki publishes later still gives a
  // scout their full 72h even if their account is older (the original
  // problem this was built for), AND a brand-new scout still gets their
  // full 72h on a mission that was actually published weeks ago (today's
  // bug — using opens_at alone made already-published missions look
  // permanently "missed" for anyone who joins after the window would have
  // closed for the very first scout).
  const missionCloseTime = (mission) => {
    const starts = [mission?.opensAt, accountWindowStart]
      .filter(Boolean)
      .map(t => new Date(t).getTime())
    if (starts.length === 0) return null
    return new Date(Math.max(...starts) + MISSION_WINDOW_MS)
  }

  // Hero banner shows whichever open mission is closing soonest.
  const openCloseTimes = missions
    .filter(m => m.status === 'current')
    .map(missionCloseTime)
    .filter(Boolean)
  const missionDeadline = openCloseTimes.length
    ? new Date(Math.min(...openCloseTimes.map(d => d.getTime())))
    : missionCloseTime(null)
  const isExpired = missionDeadline ? Date.now() > missionDeadline.getTime() : false

  // The specific mission open in the modal has its own deadline, which can
  // differ from the hero banner's (e.g. an older mission closing sooner, or
  // a brand-new one that's still well within its own window).
  const selectedDeadline = selected ? missionCloseTime(selected) : null
  const selectedExpired  = selectedDeadline ? Date.now() > selectedDeadline.getTime() : false

  // Load mission definitions from Supabase (admin-managed) — falls back to
  // the hardcoded seed list if the fetch fails or the table is ever empty,
  // so a DB hiccup never shows a blank board. Activates any scheduled
  // missions whose publish time has passed first (trigger-on-load — this
  // app has no cron), so the fetch right after sees up-to-date statuses.
  useEffect(() => {
    activateScheduledMissions()
      .catch(() => {/* best-effort — a missed activation just tries again next load */})
      .finally(() => {
        getMissions()
          .then(fetched => setBaseMissions(fetched.length ? fetched : INITIAL_MISSIONS))
          .catch(() => setBaseMissions(INITIAL_MISSIONS))
      })
  }, [])

  // Hydrate completed missions from Supabase on every login, merged onto
  // whichever mission list just loaded above. Missions that closed with no
  // submission get reclassified as 'missed' so they show in their own
  // Kanban tab instead of sitting in "Current" looking still-open.
  useEffect(() => {
    if (!baseMissions) return
    if (!isAuthenticated || !user?.scout_id) { setMissions(baseMissions); setSyncing(false); return }
    getScoutSubmissions(user.scout_id)
      .then(submissions => {
        const doneMap = new Map(submissions.map(s => [s.mission_id, s]))
        setMissions(baseMissions.map(m => {
          if (doneMap.has(m.id)) {
            return {
              ...m,
              status:          'completed',
              submittedAt:     doneMap.get(m.id).submitted_at,
              submittedText:   doneMap.get(m.id).text_response || '',
              submittedImages: doneMap.get(m.id).images || [],
            }
          }
          const closeTime = missionCloseTime(m)
          if (m.status === 'current' && closeTime && Date.now() > closeTime.getTime()) {
            return { ...m, status: 'missed' }
          }
          return m
        }))
      })
      .catch(() => setMissions(baseMissions))
      .finally(() => setSyncing(false))
  }, [baseMissions, user?.scout_id, isAuthenticated])

  if (!isAuthenticated) return <LandingPage />

  const completedCount = missions.filter(m => m.status === 'completed').length

  const handleSubmit = (missionId, text = '', images = []) => {
    setMissions(prev =>
      prev.map(m =>
        m.id === missionId
          ? { ...m, status: 'completed', submittedAt: new Date().toISOString(), submittedText: text, submittedImages: images }
          : m
      )
    )
    // Update selected so CompletedView shows current data
    setSelected(prev =>
      prev?.id === missionId
        ? { ...prev, status: 'completed', submittedAt: new Date().toISOString(), submittedText: text, submittedImages: images }
        : prev
    )
  }

  const handleUpdate = (missionId, newText, newImages) => {
    setMissions(prev =>
      prev.map(m =>
        m.id === missionId ? { ...m, submittedText: newText, submittedImages: newImages ?? m.submittedImages } : m
      )
    )
  }

  return (
    <div className="min-h-screen bg-scout-bg">
      {!onboarded && (
        <OnboardingGate user={user} onComplete={handleOnboardingComplete} />
      )}
      <NavBar
        activeView={view}
        onViewChange={setView}
        missionsCompleted={completedCount}
        totalMissions={missions.length}
      />

      {view === 'home' && (
        <InfoSection onGoToMissions={() => setView('missions')} />
      )}

      {view === 'missions' && (
        <>
          {/* Hero strip */}
          <div className="border-b border-scout-border bg-gradient-to-b from-scout-surface to-scout-bg">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-scout-accent">
                    THE 2026 WAVE
                  </p>
                  <h1 className="text-2xl font-extrabold tracking-tight text-scout-text sm:text-3xl">
                    Mission Board
                  </h1>
                  <p className="text-sm text-scout-text-muted">
                    Pick up a mission, share your take, and earn rewards.
                  </p>
                </div>

                {/* Progress + deadline */}
                <div className="hidden flex-col items-end gap-1.5 sm:flex">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-scout-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-scout-accent to-amber-400 transition-all duration-700"
                      style={{ width: `${missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-scout-text-muted">
                    <span className="font-semibold text-scout-text">{completedCount}</span>/{missions.length} completed
                  </span>
                  {missionDeadline && (
                    <span className={`flex items-center gap-1 text-xs ${isExpired ? 'text-rose-400' : 'text-scout-text-muted'}`}>
                      {isExpired
                        ? <><Lock size={10} /> Window closed</>
                        : <><Clock size={10} /> {formatDeadline(missionDeadline)}</>
                      }
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile deadline banner */}
              {missionDeadline && isExpired && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs font-medium text-amber-400 sm:hidden">
                  <Lock size={12} />
                  Mission window closed — submissions are no longer accepted
                </div>
              )}
              {missionDeadline && !isExpired && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-scout-text-muted sm:hidden">
                  <Clock size={11} />
                  {formatDeadline(missionDeadline)} to submit
                </div>
              )}
            </div>
          </div>

          {syncing && (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-scout-text-muted">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Syncing your progress…
            </div>
          )}
          <KanbanBoard missions={missions} onCardClick={setSelected} />

          {selected && (
            <MissionModal
              mission={selected}
              onClose={() => setSelected(null)}
              onSubmit={handleSubmit}
              onUpdate={handleUpdate}
              isExpired={selectedExpired}
              missionDeadline={selectedDeadline}
            />
          )}
        </>
      )}
    </div>
  )
}
