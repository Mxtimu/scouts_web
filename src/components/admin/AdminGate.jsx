import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../services/supabase'
import AdminLogin from './AdminLogin'
import AdminPanel from './AdminPanel'

// Gates the #admin view behind a real Supabase Auth session — separate from
// the scouts' custom auth scheme. Only whoever has Zuki's Supabase Auth
// login (created directly in the Supabase Dashboard) can reach AdminPanel;
// everyone else just sees the login form.
export default function AdminGate() {
  const [session, setSession] = useState(undefined) // undefined = still checking

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-scout-bg">
        <Loader2 size={20} className="animate-spin text-scout-accent" />
      </div>
    )
  }

  if (!session) {
    return <AdminLogin onSignedIn={() => {}} />
  }

  return <AdminPanel onSignedOut={() => {}} />
}
