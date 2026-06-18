import React, { useState, useEffect } from 'react'
import NavBar from './components/NavBar'
import KanbanBoard from './components/KanbanBoard'
import MissionModal from './components/MissionModal'
import LandingPage from './pages/LandingPage'
import InfoSection from './pages/InfoSection'
import OnboardingGate, { isOnboarded } from './components/OnboardingGate'
import { INITIAL_MISSIONS } from './data/missions'
import { getScoutSubmissions } from './services/supabase'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { isAuthenticated, user } = useAuth()
  const [missions, setMissions] = useState(INITIAL_MISSIONS)
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('missions')
  const [onboarded, setOnboarded] = useState(isOnboarded)
  const [syncing, setSyncing] = useState(true)

  // Hydrate completed missions from Airtable on every login
  useEffect(() => {
    if (!isAuthenticated || !user?.scout_id) { setSyncing(false); return }
    getScoutSubmissions(user.scout_id)
      .then(submissions => {
        if (submissions.length === 0) return
        const doneMap = new Map(submissions.map(s => [s.mission_id, s.submitted_at]))
        setMissions(INITIAL_MISSIONS.map(m =>
          doneMap.has(m.id)
            ? { ...m, status: 'completed', submittedAt: doneMap.get(m.id) }
            : m
        ))
      })
      .catch(() => {/* silently fall back to default state */})
      .finally(() => setSyncing(false))
  }, [user?.scout_id, isAuthenticated])

  if (!isAuthenticated) return <LandingPage />

  const completedCount = missions.filter(m => m.status === 'completed').length

  const handleSubmit = (missionId) => {
    setMissions(prev =>
      prev.map(m =>
        m.id === missionId
          ? { ...m, status: 'completed', submittedAt: new Date().toISOString() }
          : m
      )
    )
  }

  return (
    <div className="min-h-screen bg-scout-bg">
      {!onboarded && (
        <OnboardingGate user={user} onComplete={() => setOnboarded(true)} />
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
                  <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    Mission Board
                  </h1>
                  <p className="text-sm text-slate-400">
                    Pick up a mission, share your take, and earn rewards.
                  </p>
                </div>
                {/* Progress — moved here from NavBar */}
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-scout-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-scout-accent to-amber-400 transition-all duration-700"
                      style={{ width: `${missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    <span className="font-semibold text-white">{completedCount}</span>/{missions.length} completed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {syncing && (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
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
            />
          )}
        </>
      )}
    </div>
  )
}
