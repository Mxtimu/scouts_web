// Read-only analytics data for the admin Insights dashboard. Kept separate
// from supabase.js since it's a distinct concern (analytics reads via the
// authenticated/admin role, not the scouts' own custom-auth RPCs) — same
// file-per-concern pattern as email.js/cloudinary.js/crypto.js.
//
// Requires add-insights-dashboard-access.sql to have been run — without it
// every query below fails with permission-denied (see that file's comments).
import { supabase } from './supabase'

// Every coded submission, joined with its mission/scout context. Backs every
// segmentation chart, the data-quality panel, and the evidence explorer.
export async function getCodingEvidence() {
  const { data, error } = await supabase
    .from('coding_evidence_view')
    .select('*')
    .order('coded_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// One row per scout plus how many distinct missions they've submitted, the
// total raw submission count (coded or not), and how many missions are
// currently published (the denominator for "completed everything live").
export async function getScoutRoster() {
  const [{ data: scouts, error: scoutsErr }, { data: submissions, error: subsErr }, { data: missions, error: missionsErr }] =
    await Promise.all([
      supabase.from('scouts').select('scout_id, full_name, phone_number, location, created_at, onboarded'),
      supabase.from('submissions').select('scout_id, mission_id'),
      supabase.from('missions').select('mission_id, status'),
    ])

  if (scoutsErr)    throw new Error(scoutsErr.message)
  if (subsErr)      throw new Error(subsErr.message)
  if (missionsErr)  throw new Error(missionsErr.message)

  const publishedMissionCount = (missions || []).filter(m => m.status === 'current').length

  const doneByScout = new Map()
  for (const s of submissions || []) {
    if (!doneByScout.has(s.scout_id)) doneByScout.set(s.scout_id, new Set())
    doneByScout.get(s.scout_id).add(s.mission_id)
  }

  const roster = (scouts || []).map(s => {
    const missionsDone = doneByScout.get(s.scout_id)?.size || 0
    return {
      scout_id:      s.scout_id,
      full_name:     s.full_name,
      phone_number:  s.phone_number,
      location:      s.location,
      created_at:    s.created_at,
      onboarded:     s.onboarded,
      missions_done: missionsDone,
      completed_all: publishedMissionCount > 0 && missionsDone >= publishedMissionCount,
    }
  })

  return { roster, totalSubmissions: (submissions || []).length, publishedMissionCount }
}

// A single scout's full profile + every mission response + its coding —
// reuses the same combined view built earlier for Zuki's manual review.
export async function getScoutDetail(scoutId) {
  const { data, error } = await supabase
    .from('scout_mission_evidence_view')
    .select('*')
    .eq('scout_id', scoutId)
    .order('mission_id')

  if (error) throw new Error(error.message)
  return data || []
}
