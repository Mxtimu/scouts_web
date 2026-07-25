import React, { useState } from 'react'
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Shield } from 'lucide-react'
import { resetScoutPassword } from '../services/supabase'
import { hashPassword } from '../services/crypto'

function goToSite() {
  window.location.href = window.location.origin + window.location.pathname
}

export default function ResetPasswordView({ token }) {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [success, setSuccess]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8)      { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)     { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const newHash = await hashPassword(password)
      const scoutId = await resetScoutPassword(token, newHash)
      if (!scoutId) {
        setError('This link is invalid or has expired. Please request a new one.')
        return
      }
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-scout-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-scout-border bg-scout-surface p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-scout-accent/20 bg-scout-accent/10">
            <Shield size={16} className="text-scout-accent" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Reset your password</h1>
            <p className="text-xs text-slate-500">Signal Scouts</p>
          </div>
        </div>

        {!token ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            No reset link found. Please use the link from your email.
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">
              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
              Password reset! You can now sign in with your new password.
            </div>
            <button
              onClick={goToSite}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90"
            >
              Go to Signal Scouts
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'} required autoFocus
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-10 py-3 text-sm text-slate-200 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'} required
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-4 py-3 text-sm text-slate-200 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Set New Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
