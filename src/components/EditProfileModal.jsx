import React, { useState } from 'react'
import { X, User, Phone, MapPin, CreditCard, Lock, Eye, EyeOff, Loader2, AlertCircle, Save } from 'lucide-react'
import { getPasswordSalt, updateScoutProfile } from '../services/supabase'
import { computeHash } from '../services/crypto'
import { useAuth } from '../context/AuthContext'

export default function EditProfileModal({ onClose }) {
  const { user, updateUser } = useAuth()

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone]       = useState(user?.phone || '')
  const [location, setLocation] = useState(user?.location || '')
  const [idNumber, setIdNumber] = useState(user?.id_number || '')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const inputClass = 'w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const trimmedName = fullName.trim()
    const trimmedId    = idNumber.trim()

    if (!trimmedName) {
      setError('Full name is required.')
      return
    }
    if (!/^\d{13}$/.test(trimmedId)) {
      setError('ID number is required and must be exactly 13 digits.')
      return
    }

    setLoading(true)
    try {
      let passwordHash = null
      if (password) {
        const salt = await getPasswordSalt(user.email)
        passwordHash = salt ? await computeHash(password, salt) : null
      }

      const updated = await updateScoutProfile(user.scout_id, passwordHash, {
        full_name: trimmedName,
        phone:     phone.trim(),
        location:  location.trim(),
        id_number: trimmedId,
      })

      if (!updated) {
        setError('Incorrect password. Please try again.')
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

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+27 82 123 4567"
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

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Confirm with your password"
                  className="w-full rounded-xl border border-scout-border bg-scout-card pl-9 pr-10 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Leave blank if you signed up with Google.</p>
            </div>

            <button
              type="submit" disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
