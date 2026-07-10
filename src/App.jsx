import React, { useState, useEffect } from 'react'
import { Clock, Lock } from 'lucide-react'
import NavBar from './components/NavBar'
import KanbanBoard from './components/KanbanBoard'
import MissionModal from './components/MissionModal'
import LandingPage from './pages/LandingPage'
import InfoSection from './pages/InfoSection'
import OnboardingGate from './components/OnboardingGate'
import { INITIAL_MISSIONS } from './data/missions'
import { getScoutSubmissions, markScoutOnboarded, getMissions } from './services/supabase'
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

  // 3-day (72h) mission window from the scout's first login — falls back to
  // created_at for older accounts that logged in before this was tracked.
  const windowStart = user?.first_login_at || user?.created_at
  const missionDeadline = windowStart
    ? new Date(new Date(windowStart).getTime() + 3 * 24 * 60 * 60 * 1000)
    : null
  const isExpired = missionDeadline ? Date.now() > missionDeadline.getTime() : false

  // Load mission definitions from Supabase (admin-managed) — falls back to
  // the hardcoded seed list if the fetch fails or the table is ever empty,
  // so a DB hiccup never shows a blank board.
  useEffect(() => {
    getMissions()
      .then(fetched => setBaseMissions(fetched.length ? fetched : INITIAL_MISSIONS))
      .catch(() => setBaseMissions(INITIAL_MISSIONS))
  }, [])

  // Hydrate completed missions from Supabase on every login, merged onto
  // whichever mission list just loaded above.
  useEffect(() => {
    if (!baseMissions) return
    if (!isAuthenticated || !user?.scout_id) { setMissions(baseMissions); setSyncing(false); return }
    getScoutSubmissions(user.scout_id)
      .then(submissions => {
        const doneMap = new Map(submissions.map(s => [s.mission_id, s]))
        setMissions(baseMissions.map(m =>
          doneMap.has(m.id)
            ? {
                ...m,
                status:          'completed',
                submittedAt:     doneMap.get(m.id).submitted_at,
                submittedText:   doneMap.get(m.id).text_response || '',
                submittedImages: doneMap.get(m.id).images || [],
              }
            : m
        ))
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
                    June 2026 wave
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
              isExpired={isExpired}
              missionDeadline={missionDeadline}
            />
          )}
        </>
      )}
    </div>
  )
}
