import React, { useState } from 'react'
import { X, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { requestPasswordReset } from '../../services/supabase'
import { sendPasswordResetEmail } from '../../services/email'

export default function ForgotPasswordModal({ onClose, onBackToSignIn }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const trimmedEmail = email.trim().toLowerCase()
      const result = await requestPasswordReset(trimmedEmail)
      if (result) {
        const resetLink = `${window.location.origin}${window.location.pathname}#reset-password?token=${result.token}`
        sendPasswordResetEmail({ full_name: result.full_name, email: trimmedEmail, reset_link: resetLink }).catch(() => {})
      }
    } catch {
      // Deliberately swallowed — never reveal whether the request failed
      // vs. the email simply didn't match an account.
    } finally {
      setLoading(false)
      setSent(true)
    }
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
              <h2 className="text-xl font-bold text-white">Reset your password</h2>
              <p className="mt-1 text-sm text-slate-400">We'll email you a link to set a new one.</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-scout-card hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {sent ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">
              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
              If an account exists for that email, we've sent a link to reset your password.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email" required autoFocus
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-slate-500">
            <button onClick={onBackToSignIn} className="font-semibold text-scout-accent-light hover:underline">
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
