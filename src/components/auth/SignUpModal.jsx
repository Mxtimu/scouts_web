import React, { useState } from 'react'
import { X, User, Mail, Phone, MapPin, Calendar, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { createScout, findScoutByEmail } from '../../services/supabase'
import { hashPassword } from '../../services/crypto'
import { sendWelcomeEmail } from '../../services/email'
import { useAuth } from '../../context/AuthContext'

const GOOGLE_ENABLED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

// Minimum age: 13. Returns true if DOB string is at least 13 years ago.
function isOldEnough(dob) {
  if (!dob) return false
  const birthDate = new Date(dob)
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 13)
  return birthDate <= cutoff
}

// Latest allowed date of birth (must be at least 13)
function maxDob() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 13)
  return d.toISOString().split('T')[0]
}

// Earliest allowed date of birth (100 years ago)
function minDob() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 100)
  return d.toISOString().split('T')[0]
}

function parseGoogleJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export default function SignUpModal({ onClose, onSwitchToSignIn }) {
  const { login } = useAuth()

  const [step, setStep]               = useState('form')   // form | google-extra
  const [googleUser, setGoogleUser]   = useState(null)

  const [fullName, setFullName]       = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [dob, setDob]                 = useState('')
  const [location, setLocation]       = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPassword, setConfirm] = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirmP]= useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8)          { setError('Password must be at least 8 characters.'); return }
    if (!isOldEnough(dob))            { setError('You must be at least 13 years old to join.'); return }

    setLoading(true)
    try {
      const existing = await findScoutByEmail(email.trim().toLowerCase())
      if (existing) { setError('An account with this email already exists. Sign in instead.'); return }

      const password_hash = await hashPassword(password)
      const scout = await createScout({
        full_name:     fullName.trim(),
        email:         email.trim().toLowerCase(),
        phone:         phone.trim(),
        date_of_birth: dob,
        location:      location.trim(),
        password_hash,
      })
      login(scout)
      onClose()
      // Fire-and-forget — email failure must never block the user
      sendWelcomeEmail({ full_name: fullName.trim(), email: email.trim().toLowerCase() }).catch(() => {})
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
      const existing = await findScoutByEmail(payload.email)
      if (existing) {
        login(existing)
        onClose()
        return
      }
      setGoogleUser({ full_name: payload.name, email: payload.email })
      setFullName(payload.name)
      setEmail(payload.email)
      setStep('google-extra')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleExtraSubmit = async (e) => {
    e.preventDefault()
    if (!isOldEnough(dob)) { setError('You must be at least 13 years old to join.'); return }

    setLoading(true)
    setError(null)
    try {
      const scout = await createScout({
        full_name:     googleUser.full_name,
        email:         googleUser.email,
        phone:         phone.trim(),
        date_of_birth: dob,
        location:      location.trim(),
        password_hash: '',
      })
      login(scout)
      onClose()
      sendWelcomeEmail({ full_name: googleUser.full_name, email: googleUser.email }).catch(() => {})
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center sm:p-4">
      <div className="relative w-full max-w-md rounded-t-3xl border border-scout-border bg-scout-surface sm:rounded-2xl">

        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-scout-muted" />
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {step === 'google-extra' ? 'One last thing' : 'Join Signal Scouts'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {step === 'google-extra'
                  ? 'A few quick details to complete your profile.'
                  : 'Create your free scout account.'}
              </p>
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

          {/* Google extra-details step */}
          {step === 'google-extra' && (
            <form onSubmit={handleGoogleExtraSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Phone Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel" required
                    value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+27 82 123 4567"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Date of Birth</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date" required
                    min={minDob()} max={maxDob()}
                    value={dob} onChange={e => setDob(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Location</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text" required
                    value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Soweto, Randburg, Sandton…"
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Complete Sign Up'}
              </button>
            </form>
          )}

          {/* Main sign-up form */}
          {step === 'form' && (
            <>
              {GOOGLE_ENABLED && (
                <>
                  <div className="mb-4 flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google sign-in failed. Please try again.')}
                      theme="filled_black"
                      shape="pill"
                      text="signup_with"
                    />
                  </div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-scout-border" />
                    <span className="text-xs text-slate-500">or sign up with email</span>
                    <div className="h-px flex-1 bg-scout-border" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text" required
                      value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="Name Surname"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400">Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel" required
                      value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+27 82 123 4567"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400">Date of Birth</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="date" required
                      min={minDob()} max={maxDob()}
                      value={dob} onChange={e => setDob(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400">Location</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text" required
                      value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Soweto, Randburg, Sandton…"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPass ? 'text' : 'password'} required
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-10 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showConfirm ? 'text' : 'password'} required
                      value={confirmPassword} onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-10 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                    />
                    <button type="button" onClick={() => setShowConfirmP(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-500">
                Already have an account?{' '}
                <button onClick={onSwitchToSignIn} className="font-semibold text-scout-accent-light hover:underline">
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
