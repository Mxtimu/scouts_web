import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ChevronRight, ArrowLeft, Zap, Users, Target, Shield,
  CheckCircle2, FileText, ClipboardList, AlertCircle,
} from 'lucide-react'

export const ONBOARDED_KEY  = 'signal_scouts_onboarded_v2'
export const NOTIF_READ_KEY = 'signal_scouts_notif_read_v2'
export const CONSENT_KEY    = 'signal_scouts_consent_v2'
const CONSENT_VERSION       = '1.0'

export function isOnboarded() {
  return localStorage.getItem(ONBOARDED_KEY) === '1'
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ProgressDots({ current, total }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current ? 'w-6 bg-scout-accent' : i === current - 1 ? 'w-6 bg-scout-accent' : 'w-4 bg-scout-muted'
          }`}
        />
      ))}
    </div>
  )
}

function Checkbox({ id, checked, onChange, label, sublabel, required }) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
        checked
          ? 'border-scout-accent/30 bg-scout-accent/5'
          : 'border-scout-border bg-scout-card hover:border-scout-muted'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-orange-500"
      />
      <div>
        <p className={`text-xs leading-relaxed ${checked ? 'text-slate-200' : 'text-slate-400'}`}>{label}</p>
        {sublabel && <p className="mt-0.5 text-[11px] text-slate-600">{sublabel}</p>}
      </div>
    </label>
  )
}

function SectionCard({ title, badge, badgeColor, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-white">{title}</p>
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

// ── Privacy Policy sections ───────────────────────────────────────────────────
const POLICY_SECTIONS = [
  {
    title: '1. Introduction',
    body: `Young Narratives operates a community platform where individuals ("members") may choose to participate in research missions as Signal Scouts.\n\nThis policy explains how we process personal information in accordance with South Africa's Protection of Personal Information Act, 2013 (POPIA).\n\nSome individuals may join the Young Narratives community but decide not to join missions as Signal Scouts. This policy applies to all community members, but only Signal Scouts who complete missions have their mission responses processed as described in Section 4.`,
  },
  {
    title: '2. What personal information we collect',
    body: `From all community members we collect: first name, last name, email address, phone number (for WhatsApp communication), domicile address, and documentation of your consent to join the network.\n\nIf you accept missions as a Signal Scout, we additionally collect: a unique Scout ID assigned to you, your mission responses (text, audio, or visual insights), and reward delivery data needed to send airtime, data, or Uber vouchers.\n\nWe do NOT collect banking passwords, card numbers, account balances, or any information required to access your financial accounts.`,
  },
  {
    title: '3. How we use your personal information',
    body: `We process your personal information only on lawful grounds under POPIA.\n\n• Identity + contact data — to communicate with you about the network and send mission invitations via WhatsApp and email.\n• Consent records — to demonstrate compliance with POPIA if audited.\n• Scout ID — to attribute mission responses anonymously without identifying you to brands.\n• Mission responses — de-identified and aggregated for delivery to brands as research intelligence.\n• Reward delivery data — to fulfil airtime, data, or Uber voucher payments.`,
  },
  {
    title: '4. Disclosure to third parties',
    body: `We share personal information only as follows:\n\n• Brands (corporate clients): De-identified, aggregated mission responses only. No identity data, no contact data, no Scout ID is ever shared with brands.\n• Reward providers: Limited information necessary to deliver the reward (e.g., phone number for airtime).\n\nWe never share your name, email address, phone number, or Scout ID with brands.`,
  },
  {
    title: '5. Cross-border transfer',
    body: `If we use cloud service providers located outside South Africa (such as email or data storage services), personal information may be transferred across borders. POPIA permits such transfers under certain conditions.\n\nWe ensure compliance by using providers subject to adequate data protection laws, or binding them by contract to standards substantially similar to POPIA.`,
  },
  {
    title: '6. Data retention and deletion',
    body: `We retain personal information only as long as necessary:\n\n• Identity + contact data: For the duration of your active membership plus 12 months.\n• Consent records: For the duration of processing plus the proof period required by POPIA.\n• Mission responses: De-identified immediately upon collection; original identifiable data deleted after 30 days.\n• Reward delivery data: 6 months (for financial record-keeping).\n\nYou may request deletion of your personal information at any time.`,
  },
  {
    title: '7. Security safeguards',
    body: `We implement appropriate, reasonable technical and organisational measures to secure personal information as required by POPIA Section 19.\n\nThese measures include access controls limiting who can view identifiable personal information, encryption of data in transit, and de-identification of mission responses before sharing with brands.`,
  },
  {
    title: '8. Your rights under POPIA',
    body: `As a data subject you have the right to:\n\n• Be notified that your personal information is being collected and for what purpose.\n• Access a copy of the personal information we hold about you.\n• Request correction of inaccurate or misleading information.\n• Object to the processing of your personal information.\n• Request deletion or destruction of your personal information.\n• Withdraw your consent at any time (without affecting prior processing).\n• Lodge a complaint with the Information Regulator (South Africa): inforeg@justice.gov.za`,
  },
  {
    title: '9. How to exercise your rights',
    body: `To exercise any right under Section 8, contact us free of charge:\n\n• Email: scouts@youngnarratives.com\n• WhatsApp: 076 639 6789\n• Post: Lavender Lane, Evans Road, Olivedale\n\nWe will respond within 30 days as required by POPIA Regulations.`,
  },
  {
    title: '10. Personal information of minors',
    body: `If a person under 18 years of age joins Young Narratives, we require consent from a parent or legal guardian before processing any personal information, as required by POPIA Section 35.`,
  },
  {
    title: '11. Direct marketing',
    body: `We will only send you direct marketing communications (such as mission invitations) if you have provided consent. You may object to direct marketing at any time.`,
  },
  {
    title: '12. De-identification of mission responses',
    body: `Mission responses you submit as a Signal Scout are de-identified before any brand sees them. We remove your name, Scout ID, and contact details; remove any indirect identifiers in open-text responses; and do not retain a key that would allow re-identification.\n\nDe-identified information falls outside the scope of POPIA.`,
  },
  {
    title: '13. Changes to this policy',
    body: `We may update this policy from time to time. If we make material changes, we will notify you by email or WhatsApp.`,
  },
  {
    title: '14. Contact information',
    body: `Young Narratives\nAttention: Information Officer — Zukiswa Masote (Founder/Director)\nEmail: scouts@youngnarratives.com\nWhatsApp: 076 639 6789\nPhysical address: Lavender Lane, Evans Road, Olivedale`,
  },
]

// ── Step 1: Welcome ───────────────────────────────────────────────────────────
function WelcomeStep({ firstName, onNext }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-scout-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-scout-accent/20 bg-scout-accent/10">
          <Zap size={16} className="text-scout-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white">Welcome to Young Narratives</h2>
          <p className="text-[11px] text-slate-500">Step 1 of 3 — please read before continuing</p>
        </div>
        <ProgressDots current={1} total={3} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-sm leading-relaxed text-slate-300">
        <h3 className="text-base font-bold text-white">{firstName}, you're in. Welcome to Young Narratives.</h3>
        <p>Have you ever looked at a brand's campaign or product and thought… "That doesn't feel like my life at all"?</p>
        <p className="font-semibold text-white">You are not alone.</p>
        <p>Young Narratives exists because we suspect there is a gap between what brands assume about young South Africans and what we actually live, think, and want. We don't have all the answers yet. That's where you come in.</p>

        <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white">Why does this gap matter?</p>
          <p className="text-xs text-slate-400">Because when brands get us wrong, it's not just annoying ads. It means:</p>
          <ul className="space-y-1.5">
            {["Banking products that don't fit how we actually manage money", "Job platforms that miss how we really look for work", "Campaigns that talk about us but never to us", "Opportunities that never reach our phones"].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-rose-400" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400">And when brands get us right?</p>
          <ul className="space-y-1.5">
            {["Better tools. Better services.", "Better decisions that reflect our lives — not some outdated version of who we are."].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-300">Closing that gap is making sure our generation stops being invisible in rooms where decisions get made about our future.</p>
        </div>

        <p><span className="font-semibold text-white">That's why Young Narratives exists.</span> And you? You are now officially a Signal Scout — the engine that makes this work.</p>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Welcome to the Pilot Phase</p>
          <p className="text-xs text-slate-300">You are part of our very first wave — entering our official pilot and testing phase. While you test missions, we will be testing our tech, delivery systems, decoding for meaning and tracking. We want your honest feedback — not just on mission content, but on how the platform feels to use.</p>
          <p className="text-xs font-semibold text-amber-200">You are not just a Scout. You are a founding builder.</p>
        </div>

        <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-4 space-y-2">
          <div className="flex items-center gap-2"><Users size={12} className="text-scout-accent" /><p className="text-[11px] font-semibold uppercase tracking-wider text-white">What is a Signal Scout?</p></div>
          <p className="text-xs text-slate-300">Signal Scouts are the mechanism. The people on the ground capturing real, everyday lived experiences and turning them into a clean, clear signal about what our generation actually wants. Mission by mission, scout by scout, we are building a new intelligence system.</p>
          <p className="text-xs font-medium text-scout-accent-light">Because they were built from us.</p>
        </div>

        <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-4 space-y-2">
          <div className="flex items-center gap-2"><Target size={12} className="text-scout-accent" /><p className="text-[11px] font-semibold uppercase tracking-wider text-white">Your first missions</p></div>
          <p className="text-xs text-slate-300">5 missions are already live — all built on real questions from brands who want to get it right. You will earn airtime, data, or Uber vouchers. Start whenever you're ready — you have 2 weeks to complete all missions.</p>
        </div>

        <div className="border-t border-scout-border pt-4 space-y-2">
          <p className="font-semibold text-white">Let's close the gap.</p>
          <p className="text-xs text-slate-500">Cheers,<br />The Young Narratives Team</p>
          <p className="text-xs italic text-slate-600 pt-1">P.S. Your identity stays protected. Skip anything. Leave anytime. But stay — because the signal needs more Scouts.</p>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-scout-border px-5 py-4">
        <button onClick={onNext} className="flex w-full items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 active:scale-[0.98]">
          Continue to Privacy Policy <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Privacy Policy ────────────────────────────────────────────────────
function PrivacyStep({ onNext, onBack }) {
  const [scrolled, setScrolled] = useState(false)
  const bodyRef = useRef(null)

  const handleScroll = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) setScrolled(true)
  }, [])

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-scout-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-scout-accent/20 bg-scout-accent/10">
          <FileText size={16} className="text-scout-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white">Privacy Policy</h2>
          <p className="text-[11px] text-slate-500">Step 2 of 3 — scroll to the bottom to continue</p>
        </div>
        <ProgressDots current={2} total={3} />
      </div>

      <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Privacy Policy – Young Narratives & Signal Scouts</h3>
          <p className="text-xs text-slate-500">Effective Date: 1 June 2026 · Responsible Party: Young Narratives</p>
          <p className="text-xs text-slate-500">Information Officer: Zukiswa Masote (Founder/Director)</p>
        </div>

        <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-3 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Key terms (POPIA)</p>
          {[
            ['"Personal Information"', 'Information about an identifiable, living natural person.'],
            ['"Processing"', 'Any operation on personal information — collection, storage, use, sharing, deletion.'],
            ['"Responsible Party"', 'Young Narratives — determining the purpose and means of processing.'],
            ['"Data Subject"', 'You, the individual to whom the personal information relates.'],
          ].map(([term, def], i) => (
            <p key={i} className="text-xs text-slate-300"><span className="font-semibold text-white">{term}</span> — {def}</p>
          ))}
        </div>

        {POLICY_SECTIONS.map(({ title, body }, i) => (
          <div key={i} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-scout-accent-light">{title}</p>
            {body.split('\n\n').map((para, j) => (
              <p key={j} className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">{para}</p>
            ))}
          </div>
        ))}

        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <CheckCircle2 size={14} className={scrolled ? 'text-emerald-400' : 'text-slate-600'} />
          <p className={`text-xs font-medium ${scrolled ? 'text-emerald-300' : 'text-slate-500'}`}>
            {scrolled ? 'You have read the full policy.' : 'Keep scrolling to read the full policy.'}
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-scout-border px-5 py-4 space-y-2">
        {!scrolled && <p className="text-center text-[11px] text-slate-500">Scroll to the bottom to continue.</p>}
        <button onClick={onNext} disabled={!scrolled} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${scrolled ? 'bg-scout-accent text-white shadow-lg shadow-scout-accent/25 hover:opacity-90 active:scale-[0.98]' : 'cursor-not-allowed bg-scout-card text-slate-600'}`}>
          Continue to Consent Form <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Consent Form ──────────────────────────────────────────────────────
const BLANK_CHECKS = {
  age_18_plus:            false,
  data_collection:        false,
  consent_records:        false,
  withdrawal_understanding: false,
  scout_id:               false,
  mission_responses:      false,
  reward_sharing:         false,
  mission_skip:           false,
  direct_marketing:       false,
  final_confirmation:     false,
}

const SECTION2_REQUIRED = ['age_18_plus', 'data_collection', 'consent_records', 'withdrawal_understanding']

function ConsentStep({ user, onComplete, onBack }) {
  const [subStep, setSubStep]   = useState('form')   // 'form' | 'summary'
  const [checks, setChecks]     = useState(BLANK_CHECKS)
  const [name, setName]         = useState(user?.full_name || '')
  const [errors, setErrors]     = useState({})

  const toggle = (key) => (val) => {
    setChecks(c => ({ ...c, [key]: val }))
    if (val) setErrors(e => { const n = { ...e }; delete n[key]; return n })
  }

  const todayStr = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  const isSection2Complete = SECTION2_REQUIRED.every(k => checks[k])

  const handleReview = () => {
    const newErrors = {}
    if (!checks.age_18_plus) newErrors.age_18_plus = true

    if (!checks.age_18_plus) {
      setErrors(newErrors)
      return
    }
    const missing = SECTION2_REQUIRED.filter(k => !checks[k])
    missing.forEach(k => { newErrors[k] = true })
    if (missing.length) { setErrors(newErrors); return }
    setSubStep('summary')
  }

  const handleSubmit = () => {
    if (!checks.final_confirmation) {
      setErrors({ final_confirmation: true })
      return
    }
    const consentRecord = {
      version:   CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      scout_id:  user?.scout_id || null,
      email:     user?.email || null,
      name:      name.trim(),
      checkboxes: { ...checks },
    }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentRecord))
    onComplete(consentRecord)
  }

  if (subStep === 'summary') {
    const isScout = SECTION2_REQUIRED.every(k => checks[k])
    const hasScoutConsent = ['scout_id', 'mission_responses', 'reward_sharing', 'mission_skip'].some(k => checks[k])

    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-scout-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-scout-accent/20 bg-scout-accent/10">
            <ClipboardList size={16} className="text-scout-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white">Review & Confirm</h2>
            <p className="text-[11px] text-slate-500">Step 3 of 3 — your consent summary</p>
          </div>
          <ProgressDots current={3} total={3} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <p className="text-xs text-slate-400">Please review your selections before confirming. You can go back to make changes.</p>

          {/* Summary table */}
          <div className="rounded-xl border border-scout-border bg-scout-card overflow-hidden">
            {[
              { label: 'Community membership', sub: 'Required', status: isSection2Complete },
              { label: 'Signal Scout mission participation', sub: 'Optional', status: hasScoutConsent },
              { label: 'Direct marketing & notifications', sub: 'Optional', status: checks.direct_marketing },
            ].map(({ label, sub, status }, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-scout-border' : ''}`}>
                <div>
                  <p className="text-xs font-medium text-white">{label}</p>
                  <p className="text-[10px] text-slate-600">{sub}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-500'}`}>
                  {status ? <><CheckCircle2 size={9} /> Consented</> : '— Not given'}
                </span>
              </div>
            ))}
          </div>

          {/* Name + date */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your signature</p>
            <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-3 space-y-3">
              <div>
                <label className="text-[11px] text-slate-500">Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-scout-border bg-scout-surface px-3 py-2 text-sm text-white outline-none focus:border-scout-accent/50 focus:ring-1 focus:ring-scout-accent/30"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">Date</label>
                <p className="mt-1 text-sm text-white">{todayStr}</p>
              </div>
            </div>
          </div>

          {/* Final confirmation */}
          <div className="space-y-2">
            <Checkbox
              id="final_confirmation"
              checked={checks.final_confirmation}
              onChange={toggle('final_confirmation')}
              label="I agree to the terms above and give my consent as indicated. I confirm that the consents I have selected are given freely and voluntarily, and I understand I can withdraw any consent at any time by contacting Young Narratives."
            />
            {errors.final_confirmation && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle size={11} /> Please confirm to continue.
              </p>
            )}
          </div>

          {/* What happens next */}
          {isSection2Complete && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">What happens next</p>
              <p className="text-xs text-slate-300">Your community membership consents have been recorded. You are now part of Young Narratives.</p>
              {hasScoutConsent
                ? <p className="text-xs text-slate-300">Your Scout ID is active and your 5 missions are ready.</p>
                : <p className="text-xs text-slate-300">You joined as a community member. You can enable mission participation anytime from your settings.</p>
              }
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-scout-border px-5 py-4 flex gap-3">
          <button onClick={() => setSubStep('form')} className="flex items-center justify-center gap-2 rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm font-semibold text-slate-400 transition hover:text-white">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <button onClick={handleSubmit} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 active:scale-[0.98]">
            <Shield size={15} /> Complete Sign-Up
          </button>
        </div>
      </div>
    )
  }

  // ── sub-step: form ──
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-scout-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-scout-accent/20 bg-scout-accent/10">
          <ClipboardList size={16} className="text-scout-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white">Consent Form</h2>
          <p className="text-[11px] text-slate-500">Step 3 of 3 — your data, your choice</p>
        </div>
        <ProgressDots current={3} total={3} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Intro */}
        <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-3">
          <p className="text-xs text-slate-300">Before you join Young Narratives, we need your consent for how we handle your information. Please read each section below. You are not required to consent to everything — but without certain consents, you may not be able to participate as a Signal Scout.</p>
        </div>

        {/* Section 2: Required */}
        <SectionCard
          title="Community Membership"
          badge="Required to join"
          badgeColor="bg-rose-500/10 text-rose-400"
        >
          {errors.age_18_plus && !checks.age_18_plus && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0 text-amber-400" />
              <p className="text-xs text-amber-300">
                You must be 18 or older to join Young Narratives. If you are under 18, please ask a parent or legal guardian to complete sign-up on your behalf.
              </p>
            </div>
          )}
          <Checkbox id="age_18_plus" checked={checks.age_18_plus} onChange={toggle('age_18_plus')}
            label="I confirm that I am 18 years or older."
            sublabel="If under 18, a parent or legal guardian must complete this form on your behalf."
          />
          <Checkbox id="data_collection" checked={checks.data_collection} onChange={toggle('data_collection')}
            label="I agree that Young Narratives may collect and store my name, email address, and phone number for the purpose of communicating with me about the network, including mission invitations via WhatsApp and email."
          />
          <Checkbox id="consent_records" checked={checks.consent_records} onChange={toggle('consent_records')}
            label="I agree that Young Narratives may retain a record of my consent to demonstrate compliance with POPIA if audited."
          />
          <Checkbox id="withdrawal_understanding" checked={checks.withdrawal_understanding} onChange={toggle('withdrawal_understanding')}
            label="I understand that I can withdraw my consent at any time by contacting Young Narratives, and that withdrawal does not affect processing that happened before I withdrew."
          />
          {Object.keys(errors).some(k => SECTION2_REQUIRED.includes(k) && k !== 'age_18_plus') && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle size={11} /> All four items above are required to join.
            </p>
          )}
        </SectionCard>

        {/* Section 3: Optional */}
        <SectionCard
          title="Signal Scout Mission Participation"
          badge="Optional"
          badgeColor="bg-scout-accent/10 text-scout-accent-light"
        >
          <p className="text-[11px] text-slate-500">Only select these if you want to participate in missions and earn rewards. Without these, you can still be a community member.</p>
          <Checkbox id="scout_id" checked={checks.scout_id} onChange={toggle('scout_id')}
            label="I agree to receive a unique Scout ID that will be used to attribute my mission responses anonymously."
          />
          <Checkbox id="mission_responses" checked={checks.mission_responses} onChange={toggle('mission_responses')}
            label="I agree that my mission responses (text, audio, or visual insights) will be de-identified — meaning my name, Scout ID, and contact details are removed — and shared with brands as part of aggregated research intelligence."
          />
          <Checkbox id="reward_sharing" checked={checks.reward_sharing} onChange={toggle('reward_sharing')}
            label="I agree that Young Narratives may share limited information (such as my phone number) with reward providers (airtime, data, Uber) for the sole purpose of delivering rewards I have earned."
          />
          <Checkbox id="mission_skip" checked={checks.mission_skip} onChange={toggle('mission_skip')}
            label="I understand that I can skip any mission question that feels uncomfortable and that I can stop participating as a Signal Scout at any time without penalty."
          />
        </SectionCard>

        {/* Section 4: Marketing */}
        <SectionCard
          title="Direct Marketing & Notifications"
          badge="Optional"
          badgeColor="bg-scout-accent/10 text-scout-accent-light"
        >
          <Checkbox id="direct_marketing" checked={checks.direct_marketing} onChange={toggle('direct_marketing')}
            label="I agree to receive mission invitations and network updates via WhatsApp and email."
            sublabel="You can opt out of marketing messages at any time. Mission-specific messages may continue as they are not marketing."
          />
        </SectionCard>
      </div>

      <div className="flex-shrink-0 border-t border-scout-border px-5 py-4 flex gap-3">
        <button onClick={onBack} className="flex items-center justify-center gap-2 rounded-xl border border-scout-border bg-scout-card px-4 py-3 text-sm font-semibold text-slate-400 transition hover:text-white">
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Back</span>
        </button>
        <button onClick={handleReview} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-scout-accent py-3 text-sm font-bold text-white shadow-lg shadow-scout-accent/25 transition hover:opacity-90 active:scale-[0.98]">
          Review & Confirm <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Gate wrapper ──────────────────────────────────────────────────────────────
export default function OnboardingGate({ user, onComplete }) {
  const [step, setStep] = useState(1)
  const firstName = (user?.full_name || '').trim().split(/\s+/)[0] || 'Scout'

  const handleConsentComplete = (consentRecord) => {
    localStorage.setItem(ONBOARDED_KEY, '1')
    localStorage.setItem(NOTIF_READ_KEY, '1')
    onComplete(consentRecord)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 sm:items-center sm:p-4">
      <div className="relative flex h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-scout-border bg-scout-surface sm:h-[88vh] sm:rounded-2xl animate-slide-up">
        {step === 1 && <WelcomeStep firstName={firstName} onNext={() => setStep(2)} />}
        {step === 2 && <PrivacyStep onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <ConsentStep user={user} onComplete={handleConsentComplete} onBack={() => setStep(2)} />}
      </div>
    </div>
  )
}
