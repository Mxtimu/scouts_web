#!/usr/bin/env node
/**
 * code-submissions.js
 *
 * Reads uncoded text submissions from Supabase, sends each to Gemini
 * for qualitative coding against the Analyst Team Operating Manual,
 * and writes structured results to the coding_evidence table.
 *
 * Usage:
 *   node code-submissions.js
 *
 * Required env vars in .env:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GEMINI_API_KEY
 */

import { createClient }        from '@supabase/supabase-js'
import { GoogleGenerativeAI }  from '@google/generative-ai'
import { readFileSync }        from 'fs'
import { resolve, dirname }    from 'path'
import { fileURLToPath }       from 'url'

// ── Load .env ────────────────────────────────────────────────────────────────

const __dir   = dirname(fileURLToPath(import.meta.url))
const envText = readFileSync(resolve(__dir, '.env'), 'utf8')
const env     = {}
for (const line of envText.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq  = t.indexOf('=')
  if (eq === -1) continue
  const key = t.slice(0, eq).trim()
  const val = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
  env[key]  = val
}

const SUPABASE_URL         = env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const GEMINI_API_KEY       = env.GEMINI_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
  process.exit(1)
}
if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY must be set in .env')
  process.exit(1)
}

// ── Clients ──────────────────────────────────────────────────────────────────

// Server-side only — the service role key bypasses RLS, which is required
// now that anon access to coding_evidence/submissions is locked down.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const genai = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genai.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
})

// ── Analyst Team Operating Manual ────────────────────────────────────────────

const CODING_FRAMEWORK = `
You are a qualitative research analyst for Signal Scouts, a South African youth intelligence platform.
You code text submissions from young people (aged 18–30) about their lived experiences with money,
financial access, brands, and daily life.

Apply the following Analyst Team Operating Manual to every submission.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANALYST TEAM OPERATING MANUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MONEY UTILITIES (Core Motivations)
Rule: Multi-select — identify ALL underlying psychological or functional reasons the scout
is spending or needing money. Include every value that clearly applies.

Values:
  Access       — Paying to bypass barriers, gain entry to exclusive spaces, or unlock platforms.
  Identity     — Spending to express self-image, personal brand, or individuality.
  Belonging    — Spending to fit in, participate in group activities, or maintain social ties.
  Progress     — Investing in the future, building assets, or moving a goal forward.
  Independence — Spending to gain freedom, autonomy, or escape reliance on others.
  Relief       — Spending to reduce stress, offload pressure, or solve an immediate crisis.
  Status       — Spending to look successful, project wealth, or gain admiration.
  Care         — Spending to help, support, or provide for family, friends, or community.
  Convenience  — Spending specifically to save time or effort.
  Opportunity  — Spending to open doors, network, or create future earning potential.

2. DECISION CONTROL (Autonomy Level)
Rule: Single-select ONLY. Determine the scout's level of agency in the purchase/action.

Values:
  Full_Control     — The scout made the decision entirely on their own.
  Strong_Influence — The scout did not make the final call, but successfully convinced the decision-maker.
  Negotiated       — The decision was a compromise or back-and-forth between the scout and others.
  Weak_Influence   — The scout voiced an opinion, but it was largely ignored by the decision-maker.
  Dependent        — The scout had zero input; someone else made the decision for them.

3. PASSION CATEGORIES (Domain Context)
Rule: Multi-select, max 2. Identify the primary industry or interest area discussed.

Values: Fashion_Sneakers, Beauty_Grooming, Music_Events, Gaming_Digital, Food_Social,
        Transport_Mobility, Education_Skills, SideHustle_Creator, Sport_Wellness, Data_Connectivity.

4. ACCESS BARRIERS (Friction Points)
Rule: Multi-select. Identify ALL obstacles stopping the scout from achieving their goal.
If no barrier is mentioned, return an empty array [].

Values:
  Price        — Explicitly stated as too expensive or unaffordable.
  Availability — Out of stock, not sold locally, or limited edition.
  Location     — Physical distance is the main obstacle.
  Knowledge    — The scout lacks the skills, information, or instructions to proceed.
  Time         — The scout is too busy or the process takes too long.
  Trust        — The scout fears being scammed, dislikes the brand, or doubts the quality.

After selecting the values, write an ACCESS BARRIERS REASON for each identified barrier using
this exact 3-part structure (write all barriers together in one flowing paragraph per barrier):

  EVIDENCE: Quote the exact phrase or describe the specific situation from the scout's text
  that shows this barrier exists.
  SIGNAL: Explain what this barrier reveals about the scout's lived experience or structural
  circumstance — go beyond the surface; what is really blocking them?
  IMPLICATION: State one concrete action a financial brand or bank could take to remove or
  reduce this barrier for this type of scout.

Write 2–3 sentences per barrier. Be specific and actionable — a bank product team should be
able to read this and know what to build or change. If no barriers, write
"No access barriers identified in this submission."

5. BANK PERMISSION (Institutional Receptiveness)
Rule: Single-select ONLY. Assess how the scout would feel if a formal bank or financial
institution offered a solution in this context.

Values:
  Welcome  — Scout explicitly wants or expects bank involvement.
  Neutral  — Scout is indifferent; depends on the execution.
  Risky    — Scout is hesitant and might view bank involvement as invasive or uncool.
  Rejected — Scout explicitly pushes back; bank involvement would feel fake, out of touch, or entirely rejected.

After selecting the value, write a BANK PERMISSION REASON using this exact 3-part structure:

  EVIDENCE: Quote the exact phrase or describe the specific situation from the scout's text
  that determined this rating.
  SIGNAL: Explain what this reveals about the scout's underlying attitude toward formal
  financial institutions — their trust level, expectations, past experience, or emotional
  relationship with banks. Go deeper than the quote alone.
  IMPLICATION: State one concrete recommendation for how a bank should position itself,
  design a product, or communicate to match this scout's permission level. Make it specific
  enough that a bank strategist can act on it.

Write 3–4 sentences total. This must be genuinely useful to a client presenting findings —
not just a citation, but an insight they can take into a boardroom.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIONAL QA FIELDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. VERBATIM QUOTE (Evidence Anchoring)
Rule: Text extraction ONLY. Do not paraphrase.
Action: Extract the single most compelling, exact sentence or phrase directly from the scout's
raw text that justifies the chosen codes. This anchors the AI's reasoning.

7. ANALYST NOTE
Write 1–2 sentences explaining your primary interpretation and any ambiguity in the coding.

8. QUALITY FLAG (Data Viability)
Rule: Single-select ONLY. Evaluate the depth and usefulness of the scout's submission before
it reaches the analysis dashboard. This is for internal analyst use only.
  Good    — The response has clear context, detail, and meaningfully addresses the core themes.
  Thin    — The response is too brief, vague, or lacks the necessary depth to extract solid insights.
  Problem — The response is gibberish, completely off-topic, or suspicious.

9. SCOUT SCORE (Feedback to the Scout)
Rule: Single-select ONLY. This is separate from the internal Quality Flag above — it will
eventually be shown directly to the scout so they understand how to make their next
submission stronger. The better and more useful the information, the higher the score. Thin,
vague answers get a medium score. Gibberish, off-topic, or effectively-blank answers get a
low score. (In practice this tracks closely with the Quality Flag: Good→High, Thin→Medium,
Problem→Low — but write it as its own judgment.)

Values:
  High   — Specific, detailed, real examples. Clearly answers the mission with lived detail.
  Medium — Some useful content, but generic, brief, or missing the detail/examples that would
           make it richer.
  Low    — Gibberish, off-topic, far too short, or doesn't actually answer the mission.

After selecting the score, write SCOUT FEEDBACK — a short message written DIRECTLY TO THE
SCOUT in second person ("you"), not to the analyst. Rules:
  • Plain, friendly, everyday language — never mention "coding", "themes", "quality flag",
    "confidence", or any other internal analyst terminology.
  • If High: say specifically what made their answer strong, so they know to keep doing it.
  • If Medium or Low: say specifically what to add next time — e.g. a real example, a specific
    moment or story instead of a general statement, more detail on why something mattered.
  • 1–2 sentences only.

10. CONFIDENCE
Assess how confidently the full framework applies to this submission.
  Strong   — Clear, direct fit across most dimensions. Little ambiguity.
  Moderate — Reasonable fit but one or more dimensions are ambiguous or inferred.
  Weak     — Heavily inferred. The submission gives very little to code against.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY a JSON object with these exact keys — no markdown, no extra text:
{
  "money_utilities":         ["<value>", ...],
  "decision_control":        "<value>",
  "passion_categories":      ["<value>"],
  "access_barriers":         ["<value>", ...],
  "access_barriers_reason":  "<per barrier: EVIDENCE (quote) → SIGNAL (what it reveals) → IMPLICATION (what a bank should do). 2–3 sentences per barrier. Or 'No access barriers identified in this submission.'>",
  "bank_permission":         "<value>",
  "bank_permission_reason":  "<EVIDENCE (quote) → SIGNAL (attitude toward banks, trust, expectations) → IMPLICATION (concrete recommendation for a bank). 3–4 sentences total. Must be boardroom-ready insight.>",
  "verbatim_quote":          "<exact quote from the submission, max 50 words>",
  "analyst_note":            "<1–2 sentence interpretation>",
  "quality":                 "<Good | Thin | Problem>",
  "scout_score":             "<High | Medium | Low>",
  "scout_feedback":          "<1–2 sentence message written directly to the scout, in plain friendly language, telling them what made their answer strong or what to add next time>",
  "confidence":              "<Strong | Moderate | Weak>"
}
`

// ── Valid values (must match Supabase schema and Operating Manual) ────────────

const VALID_MONEY_UTILITIES    = new Set(['Access','Identity','Belonging','Progress','Independence','Relief','Status','Care','Convenience','Opportunity'])
const VALID_DECISION_CONTROL   = new Set(['Full_Control','Strong_Influence','Negotiated','Weak_Influence','Dependent'])
const VALID_PASSION_CATEGORIES = new Set(['Fashion_Sneakers','Beauty_Grooming','Music_Events','Gaming_Digital','Food_Social','Transport_Mobility','Education_Skills','SideHustle_Creator','Sport_Wellness','Data_Connectivity'])
const VALID_ACCESS_BARRIERS    = new Set(['Price','Availability','Location','Knowledge','Time','Trust'])
const VALID_BANK_PERMISSION    = new Set(['Welcome','Neutral','Risky','Rejected'])
const VALID_QUALITY            = new Set(['Good','Thin','Problem'])
const VALID_SCOUT_SCORE        = new Set(['High','Medium','Low'])
const VALID_CONFIDENCE         = new Set(['Strong','Moderate','Weak'])

// ── Core coding function ─────────────────────────────────────────────────────

async function codeSubmission(sub) {
  const prompt = `MISSION: ${sub.mission_id}
WAVE: ${sub.wave}

SUBMISSION:
"""
${sub.text_response.trim()}
"""

Apply the Analyst Team Operating Manual and return the JSON object.`

  const result = await model.generateContent([CODING_FRAMEWORK, prompt])
  const raw    = result.response.text().trim()
  const parsed = JSON.parse(raw)

  // Validate required fields exist
  const required = ['money_utilities','decision_control','passion_categories','access_barriers','access_barriers_reason','bank_permission','bank_permission_reason','verbatim_quote','quality','scout_score','scout_feedback','confidence']
  for (const f of required) {
    if (parsed[f] === undefined) throw new Error(`Missing field: ${f}`)
  }

  // Validate array fields
  if (!Array.isArray(parsed.money_utilities))    throw new Error('money_utilities must be an array')
  if (!Array.isArray(parsed.passion_categories)) throw new Error('passion_categories must be an array')
  if (!Array.isArray(parsed.access_barriers))    throw new Error('access_barriers must be an array')

  for (const v of parsed.money_utilities) {
    if (!VALID_MONEY_UTILITIES.has(v)) throw new Error(`Invalid money_utility: "${v}"`)
  }
  for (const v of parsed.passion_categories) {
    if (!VALID_PASSION_CATEGORIES.has(v)) throw new Error(`Invalid passion_category: "${v}"`)
  }
  if (parsed.passion_categories.length > 2) throw new Error('passion_categories: max 2 values')
  for (const v of parsed.access_barriers) {
    if (!VALID_ACCESS_BARRIERS.has(v)) throw new Error(`Invalid access_barrier: "${v}"`)
  }

  // Validate single-select fields
  if (!VALID_DECISION_CONTROL.has(parsed.decision_control))   throw new Error(`Invalid decision_control: "${parsed.decision_control}"`)
  if (!VALID_BANK_PERMISSION.has(parsed.bank_permission))     throw new Error(`Invalid bank_permission: "${parsed.bank_permission}"`)
  if (!VALID_QUALITY.has(parsed.quality))                     throw new Error(`Invalid quality: "${parsed.quality}"`)
  if (!VALID_SCOUT_SCORE.has(parsed.scout_score))             throw new Error(`Invalid scout_score: "${parsed.scout_score}"`)
  if (!VALID_CONFIDENCE.has(parsed.confidence))               throw new Error(`Invalid confidence: "${parsed.confidence}"`)

  return parsed
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function codeWithRetry(sub, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await codeSubmission(sub)
    } catch (err) {
      const msg = err.message || ''

      // Quota limit is 0 — billing not enabled, no point retrying
      if (msg.includes('limit: 0')) {
        throw new Error('Gemini quota limit is 0. Enable billing on your Google AI Studio project at aistudio.google.com')
      }

      // Rate limited — extract the suggested retry delay from the error body
      if ((msg.includes('429') || msg.includes('Too Many Requests')) && attempt < maxRetries) {
        const match   = msg.match(/"retryDelay":"(\d+)s"/)
        const seconds = match ? parseInt(match[1]) + 3 : 30
        process.stdout.write(`\n   Rate limited — waiting ${seconds}s (retry ${attempt}/${maxRetries - 1})… `)
        await sleep(seconds * 1000)
        continue
      }

      throw err
    }
  }
}

const BATCH_SIZE = 10  // parallel Gemini requests per batch (paid tier)

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Signal Scouts — AI Coding Pipeline (Gemini 2.5 Flash)')
  console.log('=======================================================\n')

  // Fetch submissions with text content
  const { data: submissions, error: subErr } = await supabase
    .from('submissions')
    .select('id, scout_id, mission_id, text_response, wave')
    .neq('text_response', '')
    .order('id')

  if (subErr) throw new Error(`Failed to fetch submissions: ${subErr.message}`)

  // Find which are already coded
  const { data: coded, error: codedErr } = await supabase
    .from('coding_evidence')
    .select('submission_id')

  if (codedErr) throw new Error(`Failed to fetch existing coding: ${codedErr.message}`)

  const codedIds    = new Set(coded.map(c => c.submission_id))
  const uncoded     = submissions.filter(s => !codedIds.has(s.id) && s.text_response.trim().length > 0)
  const totalBatches = Math.ceil(uncoded.length / BATCH_SIZE)

  console.log(`Total submissions : ${submissions.length}`)
  console.log(`Already coded     : ${codedIds.size}`)
  console.log(`To process        : ${uncoded.length}`)
  console.log(`Batch size        : ${BATCH_SIZE} parallel requests\n`)

  if (uncoded.length === 0) {
    console.log('All submissions already coded. Nothing to do.')
    return
  }

  let success = 0
  let failed  = 0
  const errors = []

  for (let b = 0; b < uncoded.length; b += BATCH_SIZE) {
    const batch    = uncoded.slice(b, b + BATCH_SIZE)
    const batchNum = Math.floor(b / BATCH_SIZE) + 1
    console.log(`── Batch ${batchNum}/${totalBatches} (${batch.length} submissions) ──`)

    // Fire all Gemini requests in this batch simultaneously
    const results = await Promise.allSettled(batch.map(sub => codeWithRetry(sub)))

    // Insert each result into Supabase
    for (let j = 0; j < batch.length; j++) {
      const sub    = batch[j]
      const result = results[j]
      const prefix = `  #${sub.id} (${sub.mission_id})`

      if (result.status === 'fulfilled') {
        const coding = result.value
        const { error: insertErr } = await supabase
          .from('coding_evidence')
          .insert({
            submission_id:           sub.id,
            money_utilities:         coding.money_utilities,
            decision_control:        coding.decision_control,
            passion_categories:      coding.passion_categories,
            access_barriers:         coding.access_barriers,
            access_barriers_reason:  coding.access_barriers_reason || '',
            bank_permission:         coding.bank_permission,
            bank_permission_reason:  coding.bank_permission_reason || '',
            verbatim_quote:          coding.verbatim_quote || '',
            analyst_note:            coding.analyst_note   || '',
            quality:                 coding.quality,
            scout_score:             coding.scout_score,
            scout_feedback:          coding.scout_feedback || '',
            confidence:              coding.confidence,
            coded_by:                'gemini-2.5-flash',
          })

        if (insertErr) {
          console.log(`${prefix} ✗  DB: ${insertErr.message}`)
          errors.push({ id: sub.id, mission: sub.mission_id, error: insertErr.message })
          failed++
        } else {
          console.log(`${prefix} ✓  [${coding.quality}/${coding.confidence}] scout_score=${coding.scout_score} ${coding.money_utilities.join(', ')} | ${coding.bank_permission}`)
          success++
        }
      } else {
        const msg = result.reason?.message || String(result.reason)
        console.log(`${prefix} ✗  ${msg}`)
        errors.push({ id: sub.id, mission: sub.mission_id, error: msg })
        failed++
      }
    }
    console.log('')
  }

  console.log('── Summary ────────────────────────────────────────────')
  console.log(`✓  ${success} submissions coded`)
  if (failed > 0) {
    console.log(`✗  ${failed} failed`)
    console.log('\nFailed submissions:')
    errors.forEach(e => console.log(`   #${e.id} (${e.mission}): ${e.error}`))
    console.log('\nRe-run the script to retry failed submissions.')
  }
  console.log('───────────────────────────────────────────────────────\n')
}

main().catch(err => {
  console.error('\n✗ Pipeline crashed:', err.message)
  process.exit(1)
})
