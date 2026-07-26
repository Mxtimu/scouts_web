import React, { useEffect, useState } from 'react'
import { X, Bell, Zap, Users, Target, Star, Clock, AlertTriangle, ShieldCheck, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { NOTIF_READ_KEY } from './OnboardingGate'

export function useNotifRead() {
  const [isRead, setIsRead] = React.useState(() => localStorage.getItem(NOTIF_READ_KEY) === '1')
  const markRead = React.useCallback(() => {
    localStorage.setItem(NOTIF_READ_KEY, '1')
    setIsRead(true)
  }, [])
  return { isRead, markRead }
}

const SCOUT_CODE_SECTIONS = [
  {
    title: '1. Identity and registration',
    points: [
      'You must register on the Young Narratives platform using your full, correct personal details (name, surname and ID number).',
      'The details you provide when you register must match the details you use when you claim rewards. Using different details will delay or block your rewards.',
      'You must use the same cellphone number for registration and reward redemption. This should be the number you use most frequently and have access to.',
      'At this stage you cannot use different numbers for registration and rewards. If you change your number, you must update it on the platform before completing new missions.',
      'Missing or incorrect information (names, numbers or ID details) may mean we cannot verify you and therefore cannot process your reward.',
      'If you notice that your name or number looks different on your side compared to what you submitted, you must contact the Young Narratives team immediately to correct it.',
    ],
  },
  {
    title: '2. Verification and protection',
    points: [
      'Young Narratives must be able to verify that you are who you say you are before any reward is processed.',
      'ID numbers help us keep the community protected, ensure that Scouts are real people and make sure rewards go to the right person.',
      'We will never share your personal information publicly; it is used only for verification, reward processing and keeping the community safe.',
      'You may not register using someone else’s details or share your profile for another person to complete missions.',
    ],
  },
  {
    title: '3. Reward eligibility',
    points: [
      'To receive rewards, you must complete missions honestly and follow all instructions for each Signal Mission.',
      'Rewards can only be sent to the number linked to your verified Scout profile.',
      'If we cannot match your mission responses, registration details and reward request, we may not be able to issue the reward.',
      'Any attempt to misuse the reward system (e.g. multiple profiles, false information) may lead to removal from the Scouts community.',
    ],
  },
  {
    title: '4. Honest participation',
    points: [
      'Scouts are expected to tell the truth about their experiences and opinions in missions.',
      'You may not submit fabricated stories, copy other people’s responses or use AI tools to generate your answers.',
      'If you don’t feel comfortable with a mission, you may skip it; however, incomplete missions may affect your eligibility for certain rewards.',
    ],
  },
  {
    title: '5. Respectful behaviour',
    points: [
      'Treat other Scouts and the Young Narratives team with respect at all times on WhatsApp, email, social media and any YN channels.',
      'No bullying, harassment, hate speech, discrimination, or sharing of harmful or abusive content is allowed.',
      'Do not share other people’s personal information or private stories without their permission.',
      'Any disrespectful or harmful behaviour can lead to removal from the community.',
    ],
  },
  {
    title: '6. Privacy and safety',
    points: [
      'Keep your login and profile details safe. Do not share your password or verification codes with anyone.',
      'Report any suspicious messages or behaviour to the Young Narratives team so we can investigate and protect the community.',
      'Only share personal information with Young Narratives through official channels (platform, WhatsApp number or email provided in the Scouts materials).',
    ],
  },
  {
    title: '7. Use of the platform',
    points: [
      'The Young Narratives platform and missions are for your personal use as a Scout; you may not sell access or use your account for others.',
      'You must follow the instructions for each mission carefully and submit your responses within the timelines given.',
      'Do not attempt to interfere with the platform, technology or data (for example, hacking, spam or automated submissions).',
    ],
  },
  {
    title: '8. Leaving or changing your status',
    points: [
      'Participation in Young Narratives is voluntary; you can leave the community at any time.',
      'If you choose to leave, any pending rewards may be processed only if your missions and details have already been verified.',
      'If your circumstances change (e.g. you move, change number, or stop using your current device), you should update your profile so your information stays correct.',
    ],
  },
]

function ScoutCodeDropdown() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-scout-border bg-scout-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={14} className="flex-shrink-0 text-scout-accent" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-scout-text">Young Narratives Scout Code</p>
            <p className="text-[10px] italic text-scout-text-muted">"Be Curious. Be Honest. Protect the Community."</p>
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-scout-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="space-y-4 border-t border-scout-border px-4 py-4">
          {SCOUT_CODE_SECTIONS.map((section, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-scout-accent-light">{section.title}</p>
              <ul className="space-y-1">
                {section.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs leading-relaxed text-scout-text-sub">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-scout-muted" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NotificationPanel({ open, onClose, onRead }) {
  const { user } = useAuth()
  const firstName = (user?.full_name || '').trim().split(/\s+/)[0] || 'Scout'

  useEffect(() => {
    if (open) onRead?.()
  }, [open, onRead])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Drawer */}
      <div className="relative flex h-full w-full max-w-sm flex-col border-l border-scout-border bg-scout-surface shadow-2xl animate-slide-in-right sm:max-w-md">

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-scout-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-scout-accent/20 bg-scout-accent/10">
              <Bell size={14} className="text-scout-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-scout-text">Notifications</h2>
              <p className="text-[11px] text-scout-text-muted">From Young Narratives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="flex h-8 w-8 items-center justify-center rounded-full text-scout-text-muted transition hover:bg-scout-card hover:text-scout-text"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Message header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-scout-accent/20 bg-scout-accent/10 px-2.5 py-1 text-[11px] font-semibold text-scout-accent-light">
                <Zap size={10} />
                Young Narratives
              </span>
            </div>
            <span className="text-[10px] text-scout-text-muted pt-1 flex-shrink-0">Jun 2026</span>
          </div>

          <h3 className="text-base font-bold leading-snug text-scout-text">
            {firstName}, you're in. Welcome to Young Narratives.
          </h3>

          {/* ── Rewards & timing — important banner ── */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Rewards — Read This First
              </p>
            </div>
            <p className="text-xs leading-relaxed text-scout-text-sub">
              You have <span className="font-semibold text-amber-400">3 days from the moment you sign up</span> to submit your missions. Your personal countdown starts the second your account is created.
            </p>
            <p className="text-xs leading-relaxed text-scout-text-sub">
              <span className="font-semibold text-rose-400">Rewards are only paid for missions you submit before your window closes.</span> If the time runs out, submissions lock permanently and no reward is issued for that wave — even if you started a mission.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Clock size={11} className="text-scout-accent flex-shrink-0" />
              <p className="text-xs font-semibold text-scout-accent-light">
                Submit on time. Get rewarded. Miss the window, miss the reward.
              </p>
            </div>
          </div>

          <ScoutCodeDropdown />

          <div className="space-y-4 text-sm leading-relaxed text-scout-text-sub">
            <p>
              Have you ever looked at a brand's campaign or product and thought… "That doesn't feel like my life at all"?
            </p>

            <p className="font-semibold text-scout-text">You are not alone.</p>

            <p>
              Young Narratives exists because we suspect there is a gap between what brands assume about young South Africans and what we actually live, think, and want.
            </p>

            <p>We don't have all the answers yet. That's where you come in.</p>

            {/* Why the gap matters */}
            <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-scout-text">Why does this gap matter?</p>
              <p className="text-xs text-scout-text-muted">Because when brands get us wrong, it's not just annoying ads. It means:</p>
              <ul className="space-y-1.5">
                {[
                  "Banking products that don't fit how we actually manage money",
                  "Job platforms that miss how we really look for work",
                  "Campaigns that talk about us but never to us",
                  "Opportunities that never reach our phones",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-scout-text-sub">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-rose-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-scout-text-muted">And when brands get us right?</p>
              <ul className="space-y-1.5">
                {[
                  "Better tools. Better services.",
                  "Better decisions that actually reflect our lives — not some outdated version of who we are.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-scout-text-sub">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-scout-text-sub">
                Closing that gap isn't helping brands sell more stuff. It is making sure our generation stops being invisible in rooms where decisions get made about our future.
              </p>
            </div>

            <p>
              <span className="font-semibold text-scout-text">That's why Young Narratives exists.</span> And you? You are now officially a Signal Scout — the engine that makes this work.
            </p>

            {/* Pilot phase */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Welcome to the Pilot Phase — You Are Helping Build This
              </p>
              <p className="text-xs text-scout-text-sub">
                Because you are part of our very first wave, you are entering our official pilot and testing phase. While you test missions and the web interface, we will be testing our tech, delivery systems, decoding for meaning and tracking. We want your honest feedback — not just on mission content, but on how the platform feels to use.
              </p>
              <p className="text-xs font-semibold text-amber-400">You are not just a Scout. You are a founding builder.</p>
            </div>

            {/* What is a Signal Scout */}
            <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users size={12} className="text-scout-accent" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-scout-text">What is a Signal Scout?</p>
              </div>
              <p className="text-xs text-scout-text-sub">
                Signal Scouts are the mechanism. The people on the ground capturing real, everyday lived experiences and turning them into a clean, clear signal about what our generation actually wants.
              </p>
              <p className="text-xs text-scout-text-sub">
                Mission by mission, scout by scout, we are building a new intelligence system — one that helps brands design products, services, and experiences that actually reflect today's youth.
              </p>
              <p className="text-xs font-medium text-scout-accent-light">Because they were built from us.</p>
            </div>

            {/* First missions */}
            <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <Target size={12} className="text-scout-accent" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-scout-text">Your first missions: The Bank Sprint + more</p>
              </div>
              <p className="text-xs text-scout-text-sub">
                A major bank wants to understand how young people think about money — really understand, not assume. But that's just the start. Right now, 5 missions are already live — all built on real questions from brands who want to get it right.
              </p>
              <p className="text-xs text-scout-text-sub">
                These are practice sprints designed to mimic exactly how real client missions will operate. Your honest insights could shape how brands design for our generation.
              </p>
              <p className="text-xs text-scout-text-sub">
                You will earn airtime, data, or Uber vouchers. But the real reward? Knowing a major brand moved differently because of what you — a Signal Scout — lived and shared.
              </p>
            </div>

            {/* Rewards recap */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Star size={11} className="text-emerald-400" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Earning your reward</p>
              </div>
              <p className="text-xs text-scout-text-sub">
                Submit all 5 missions within your 3-day window. Rewards are processed after the wave closes and missions are reviewed by the analyst team.
              </p>
            </div>

            {/* What now */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">What now?</p>
              <p className="text-xs text-scout-text-sub">
                Head to your mission board — 5 missions are already live and waiting. You have 3 days from sign-up to complete all missions. Start now to make sure you don't miss the window.
              </p>
            </div>

            {/* Closing */}
            <div className="border-t border-scout-border pt-4 space-y-2">
              <p>You belong to something bigger now.</p>
              <p className="text-xs text-scout-text-muted">
                <span className="font-medium text-scout-text">Young Narratives</span> is the why.{' '}
                <span className="font-medium text-scout-text">Signal Scouts</span> is the how.
              </p>
              <p className="font-semibold text-scout-text">Let's close the gap.</p>
              <p className="text-xs text-scout-text-muted pt-1">
                Cheers,<br />The Young Narratives Team
              </p>
              <p className="text-xs italic text-scout-text-muted pt-1">
                P.S. Your identity stays protected. Skip anything. Leave anytime. But stay — because the signal needs more Scouts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
