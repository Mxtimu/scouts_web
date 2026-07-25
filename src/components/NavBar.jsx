import React, { useState } from 'react'
import { Zap, Bell, LogOut, LayoutGrid, Home, UserCog } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationPanel, { useNotifRead } from './NotificationPanel'
import EditProfileModal from './EditProfileModal'

const AVATAR_COLOURS = [
  'from-orange-500 to-red-500',
  'from-amber-400 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-yellow-400 to-amber-500',
  'from-emerald-500 to-teal-500',
]

function getInitials(fullName) {
  if (!fullName) return '?'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

export default function NavBar({ activeView = 'missions', onViewChange, missionsCompleted = 0, totalMissions = 8 }) {
  const { user, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const { isRead, markRead } = useNotifRead()

  const scoutId    = user?.scout_id ?? 'SC---'
  const fullName   = user?.full_name ?? ''
  const numPart    = parseInt(scoutId.replace(/^SC-?/, ''), 10) || 0
  const colourIdx  = numPart % AVATAR_COLOURS.length
  const initials   = getInitials(fullName) || scoutId.replace(/^SC-?/, '#')
  const progress   = totalMissions > 0 ? Math.round((missionsCompleted / totalMissions) * 100) : 0

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b border-scout-border bg-scout-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-scout-accent">
            <Zap size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight text-scout-text">
            Signal<span className="text-scout-accent-light">Scouts</span>
          </span>
        </div>

        {/* Centre: nav tabs */}
        <nav className="flex items-center gap-0.5 rounded-xl border border-scout-border bg-scout-card p-1">
          <button
            onClick={() => onViewChange?.('home')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3 text-xs font-semibold transition-all ${
              activeView === 'home'
                ? 'bg-scout-surface text-scout-text shadow-sm'
                : 'text-scout-text-muted hover:text-scout-text'
            }`}
          >
            <Home size={13} />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            onClick={() => onViewChange?.('missions')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3 text-xs font-semibold transition-all ${
              activeView === 'missions'
                ? 'bg-scout-surface text-scout-text shadow-sm'
                : 'text-scout-text-muted hover:text-scout-text'
            }`}
          >
            <LayoutGrid size={13} />
            <span className="hidden sm:inline">Missions</span>
          </button>
        </nav>

        {/* Right: scout ID + avatar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotif(true)}
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-scout-text-muted transition hover:bg-scout-surface hover:text-scout-text"
          >
            <Bell size={16} />
            {!isRead && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-scout-accent" />
            )}
          </button>

          <div className="relative flex items-center gap-2">
            <span className="hidden text-xs font-medium text-scout-text-muted sm:block">{scoutId}</span>
            <button
              onClick={() => setShowMenu(s => !s)}
              aria-label="Profile"
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLOURS[colourIdx]} text-xs font-bold text-white shadow-lg ring-2 ring-scout-border transition hover:ring-scout-accent`}
            >
              {initials}
            </button>

            {/* Dropdown */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-20 min-w-[180px] rounded-xl border border-scout-border bg-scout-card p-1 shadow-xl">
                  <div className="border-b border-scout-border px-3 py-2 mb-1">
                    <p className="text-xs font-semibold text-scout-text">{fullName || scoutId}</p>
                    <p className="text-[10px] text-scout-text-muted">{user?.email}</p>
                    <p className="mt-1 text-[10px] font-semibold text-scout-accent-light">{scoutId}</p>
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); setShowEditProfile(true) }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-scout-text-muted transition hover:bg-scout-surface hover:text-scout-text"
                  >
                    <UserCog size={12} />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); logout() }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-scout-text-muted transition hover:bg-scout-surface hover:text-scout-text"
                  >
                    <LogOut size={12} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>

    <NotificationPanel
      open={showNotif}
      onClose={() => setShowNotif(false)}
      onRead={markRead}
    />

    {showEditProfile && (
      <EditProfileModal onClose={() => setShowEditProfile(false)} />
    )}
    </>
  )
}
