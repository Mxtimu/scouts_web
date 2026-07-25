import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'signal_scouts_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })

  const login = (userData) => {
    const safe = {
      scout_id:      userData.scout_id,
      full_name:     userData.full_name,
      email:         userData.email,
      phone:         userData.phone,
      date_of_birth: userData.date_of_birth,
      location:      userData.location,
      onboarded:     userData.onboarded ?? false,
      first_login_at: userData.first_login_at ?? null,
      id_number:     userData.id_number ?? null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
    setUser(safe)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  // Merges a partial update (e.g. { onboarded: true }) into the stored user.
  const updateUser = (patch) => {
    setUser(prev => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
