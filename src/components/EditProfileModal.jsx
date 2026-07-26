import React, { useState } from 'react'
import { X, User, Phone, MapPin, CreditCard, KeyRound, Loader2, AlertCircle, CheckCircle2, Save } from 'lucide-react'
import { updateScoutProfile, requestPasswordReset } from '../services/supabase'
import { sendPasswordResetEmail } from '../services/email'
import { useAuth } from '../context/AuthContext'
import { isValidSaId, isValidSaPhone, formatSaPhone, isValidName } from '../utils/validators'

export default function EditProfileModal({ onClose }) {
  const { user, updateUser } = useAuth()

  const nameParts = (user?.full_name || '').trim().split(/\s+/)
  const [firstName, setFirstName] = useState(nameParts[0] || '')
  const [lastName, setLastName]   = useState(nameParts.slice(1).join(' ') || '')
  const [phone, setPhone]         = useState(user?.phone || '')
  const [location, setLocation]   = useState(user?.location || '')
  const [idNumber, setIdNumber]   = useState(user?.id_number || '')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const [changePassLoading, setChangePassLoading] = useState(false)
  const [changePassSent, setChangePassSent]       = useState(false)

  const inputClass = 'w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const trimmedFirst = firstName.trim()
    const trimmedLast  = lastName.trim()
    const trimmedId    = idNumber.trim()

    if (!isValidName(trimmedFirst) || !isValidName(trimmedLast)) {
      setError('Name and surname are required and must contain letters only.')
      return
    }
    if (!isValidSaPhone(phone)) {
      setError('Enter a valid SA phone number, e.g. 072 333 4356.')
      return
    }
    if (!isValidSaId(trimmedId)) {
      setError('Enter a valid 13-digit SA ID number.')
      return
    }

    setLoading(true)
    try {
      const updated = await updateScoutProfile(user.scout_id, {
        full_name: `${trimmedFirst} ${trimmedLast}`,
        phone:     phone.trim(),
        location:  location.trim(),
        id_number: trimmedId,
      })

      if (!updated) {
        setError('Could not save changes. Please try again.')
        return
      }

      updateUser({ full_name: updated.full_name, phone: updated.phone, location: updated.location, id_number: updated.id_number })
      onClose?.()
    } catch (err) {
      setError(err.message || 'Could not save changes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setChangePassLoading(true)
    try {
      const result = await requestPasswordReset(user.email)
      if (result) {
        const resetLink = `${window.location.origin}${window.location.pathname}#reset-password?token=${result.token}`
        sendPasswordResetEmail({ full_name: result.full_name, email: user.email, reset_link: resetLink }).catch(() => {})
      }
    } catch {
      // Same as ForgotPasswordModal — never surface whether this failed.
    } finally {
      setChangePassLoading(false)
      setChangePassSent(true)
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
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <p className="mt-1 text-sm text-slate-400">Update your details below.</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-scout-card hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Read-only Scout ID */}
          <div className="mb-4 flex items-center justify-between rounded-xl border border-scout-border bg-scout-card px-3 py-2.5">
            <span className="text-xs font-semibold text-slate-400">Scout ID</span>
            <span className="text-sm font-bold text-scout-accent-light">{user?.scout_id}</span>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text" required
                    value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Name"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Surname</label>
                <input
                  type="text" required
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Surname"
                  className="w-full rounded-xl border border-scout-border bg-scout-card px-3 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel"
                  value={phone} onChange={e => setPhone(formatSaPhone(e.target.value))}
                  placeholder="072 333 4356"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Location</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Soweto, Randburg, Sandton…"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">ID Number</label>
              <div className="relative">
                <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text" inputMode="numeric" maxLength={13} required
                  value={idNumber} onChange={e => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 13))}
                  placeholder="13-digit SA ID number"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> Save Changes</>}
            </button>
          </form>

          {/* Change password — separate action, not required to save the form above */}
          <div className="mt-4 border-t border-scout-border pt-4">
            {changePassSent ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
                <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" />
                If your account has a password, we've emailed you a link to change it.
              </div>
            ) : (
              <button
                type="button" onClick={handleChangePassword} disabled={changePassLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-scout-border bg-scout-card py-2.5 text-xs font-semibold text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                {changePassLoading ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                Change Password
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
