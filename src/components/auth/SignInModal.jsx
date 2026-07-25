import React, { useState } from 'react'
import { X, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { findScoutByEmail, getPasswordSalt, verifyScoutPassword, recordLogin } from '../../services/supabase'
import { computeHash } from '../../services/crypto'
import { useAuth } from '../../context/AuthContext'
import ForgotPasswordModal from './ForgotPasswordModal'

const GOOGLE_ENABLED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

function parseGoogleJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export default function SignInModal({ onClose, onSwitchToSignUp }) {
  const { login } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [showForgot, setShowForgot] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const trimmedEmail = email.trim().toLowerCase()
      const scout = await findScoutByEmail(trimmedEmail)
      if (!scout) {
        setError("No account found with that email. Create one below.")
        return
      }
      if (!scout.has_password) {
        setError("This account uses Google Sign-In. Please sign in with Google.")
        return
      }
      const salt = await getPasswordSalt(trimmedEmail)
      const hash = await computeHash(password, salt)
      const verified = await verifyScoutPassword(trimmedEmail, hash)
      if (!verified) {
        setError("Incorrect password. Please try again.")
        return
      }
      const first_login_at = await recordLogin(verified.scout_id)
      login({ ...verified, first_login_at })
      onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    const payload = parseGoogleJwt(credentialResponse.credential)
    if (!payload) { setError('Google sign-in failed. Please try again.'); return }

    setError(null)
    setLoading(true)
    try {
      const scout = await findScoutByEmail(payload.email)
      if (!scout) {
        setError("No account found for this Google account. Create one first.")
        return
      }
      const first_login_at = await recordLogin(scout.scout_id)
      login({ ...scout, first_login_at })
      onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (showForgot) {
    return <ForgotPasswordModal onClose={onClose} onBackToSignIn={() => setShowForgot(false)} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center sm:p-4">
      <div className="relative w-full max-w-md rounded-t-3xl border border-scout-border bg-scout-surface sm:rounded-2xl">

        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-scout-muted" />
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-400">Sign in to your scout account.</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-scout-card hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {GOOGLE_ENABLED && (
            <>
              <div className="mb-4 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed. Please try again.')}
                  theme="filled_black"
                  shape="pill"
                  text="signin_with"
                />
              </div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-scout-border" />
                <span className="text-xs text-slate-500">or sign in with email</span>
                <div className="h-px flex-1 bg-scout-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-400">Password</label>
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs font-semibold text-scout-accent-light hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-10 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <button onClick={onSwitchToSignUp} className="font-semibold text-scout-accent-light hover:underline">
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
