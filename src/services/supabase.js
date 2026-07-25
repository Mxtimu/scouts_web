import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL?.replace(/^'|'$/g, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.replace(/^'|'$/g, '')

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Scouts ────────────────────────────────────────────────────────────────────

// Profile lookup only — never returns password_hash. Password verification
// happens entirely server-side via getPasswordSalt() + verifyScoutPassword().
export async function findScoutByEmail(email) {
  const { data, error } = await supabase
    .rpc('get_scout_profile', { p_email: email.toLowerCase().trim() })

  if (error) throw new Error(error.message)
  const row = data?.[0]
  if (!row) return null

  return {
    scout_id:      row.scout_id,
    full_name:     row.full_name,
    email:         row.email,
    phone:         row.phone_number,
    date_of_birth: row.birth_date,
    location:      row.location,
    created_at:      row.created_at,
    has_password:    row.has_password,
    onboarded:       row.onboarded,
    first_login_at:  row.first_login_at,
    id_number:       row.id_number,
  }
}

// Returns the salt half of the stored "salt:hash" so the client can compute
// a matching hash — the hash half never leaves the database.
export async function getPasswordSalt(email) {
  const { data, error } = await supabase
    .rpc('get_password_salt', { p_email: email.toLowerCase().trim() })

  if (error) throw new Error(error.message)
  return data || null
}

// Verifies a client-computed hash against the stored one server-side and
// returns the profile only on a match.
export async function verifyScoutPassword(email, hash) {
  const { data, error } = await supabase
    .rpc('verify_scout_password', { p_email: email.toLowerCase().trim(), p_hash: hash })

  if (error) throw new Error(error.message)
  const row = data?.[0]
  if (!row) return null

  return {
    scout_id:      row.scout_id,
    full_name:     row.full_name,
    email:         row.email,
    phone:         row.phone_number,
    date_of_birth: row.birth_date,
    location:        row.location,
    created_at:      row.created_at,
    onboarded:       row.onboarded,
    first_login_at:  row.first_login_at,
    id_number:       row.id_number,
  }
}

// Called once, right after the onboarding gate is completed, so it never
// shows again for this account on any device.
export async function markScoutOnboarded(scoutId) {
  const { error } = await supabase.rpc('mark_scout_onboarded', { p_scout_id: scoutId })
  if (error) throw new Error(error.message)
}

// Called on every successful sign-in (password or Google). Stamps
// first_login_at only the first time — the 72h mission window is anchored
// to this moment, not account creation, and does not reset on later logins.
export async function recordLogin(scoutId) {
  const { data, error } = await supabase.rpc('record_login', { p_scout_id: scoutId })
  if (error) throw new Error(error.message)
  return data
}

// Updates full name/phone/location/ID number. passwordHash may be null
// (Google-only accounts) — the RPC only enforces a match if the account
// actually has a password. Returns null on auth failure (wrong password),
// which the caller should show as "Incorrect password" rather than a
// generic error.
export async function updateScoutProfile(scoutId, passwordHash, { full_name, phone, location, id_number }) {
  const { data, error } = await supabase.rpc('update_scout_profile', {
    p_scout_id:      scoutId,
    p_password_hash: passwordHash,
    p_full_name:     full_name ?? null,
    p_phone:         phone ?? null,
    p_location:      location ?? null,
    p_id_number:     id_number ?? null,
  })

  if (error) throw new Error(error.message)
  const row = data?.[0]
  if (!row) return null

  return {
    scout_id:      row.scout_id,
    full_name:     row.full_name,
    email:         row.email,
    phone:         row.phone_number,
    date_of_birth: row.birth_date,
    location:      row.location,
    created_at:    row.created_at,
    id_number:     row.id_number,
  }
}

// Returns { token, full_name } if the email matches an account that has a
// password, or null otherwise. The caller MUST show the same message either
// way — this distinction exists only to know whether to send an email, never
// to reveal to the requester whether the account exists.
export async function requestPasswordReset(email) {
  const { data, error } = await supabase.rpc('request_password_reset', { p_email: email.toLowerCase().trim() })
  if (error) throw new Error(error.message)
  const row = data?.[0]
  if (!row) return null
  return { token: row.token, full_name: row.full_name }
}

// Returns the scout_id on success, or null if the token is invalid, already
// used, or expired.
export async function resetScoutPassword(token, newHash) {
  const { data, error } = await supabase.rpc('reset_scout_password', { p_token: token, p_new_hash: newHash })
  if (error) throw new Error(error.message)
  const row = data?.[0]
  return row ? row.scout_id : null
}

async function scoutIdExists(id) {
  const { data } = await supabase
    .from('scouts')
    .select('scout_id')
    .eq('scout_id', id)
    .maybeSingle()
  return !!data
}

async function generateScoutId() {
  for (let i = 0; i < 20; i++) {
    const id = `SC${Math.floor(Math.random() * 900) + 100}`
    if (!(await scoutIdExists(id))) return id
  }
  return `SC${Math.floor(Math.random() * 9000) + 1000}`
}

export async function createScout({ full_name, email, phone, date_of_birth, location, password_hash }) {
  const scout_id     = await generateScoutId()
  const cleanEmail   = email.toLowerCase().trim()
  const created_at   = new Date().toISOString()

  // No .select() after insert — anon only has SELECT on the scout_id column
  // (see secure-rls.sql), so we return the row from the values we already
  // know instead of reading it back.
  const { error } = await supabase
    .from('scouts')
    .insert({
      scout_id,
      full_name,
      email:         cleanEmail,
      phone_number:  phone     ?? '',
      birth_date:    date_of_birth || null,
      location:      location  ?? '',
      password_hash,
      created_at,
      first_login_at: created_at,
    })

  if (error) throw new Error(error.message)

  return {
    scout_id,
    full_name,
    email:          cleanEmail,
    phone,
    date_of_birth,
    location,
    created_at,
    onboarded:      false,
    // Signing up logs the scout in immediately, so their 72h mission
    // window starts right now, same as first_login_at would via record_login.
    first_login_at: created_at,
  }
}



export async function getScoutSubmissions(scoutId) {
  const { data, error } = await supabase
    .rpc('get_scout_submissions', { p_scout_id: scoutId })

  if (error) throw new Error(error.message)
  return (data || []).map(r => ({
    mission_id:    r.mission_id,
    submitted_at:  r.submitted_at,
    text_response: r.text_response || '',
    images:        r.images || [],
  }))
}

// `images`, when passed, is the full replacement list of image URLs
// (already-kept existing ones + any newly uploaded ones combined by the
// caller) — omit it to leave images untouched.
export async function updateSubmission({ scout_id, mission_id, text_response, images }) {
  const payload = {
    text_response: text_response || '',
    submitted_at:  new Date().toISOString(),
  }
  if (images !== undefined) payload.images = images.length ? images : null

  const { error } = await supabase
    .from('submissions')
    .update(payload)
    .eq('scout_id', scout_id)
    .eq('mission_id', mission_id)

  if (error) throw new Error(error.message)
}

// Uploads files to Cloudinary and returns the resulting URLs — used both
// at first submission and when adding photos to an existing submission.
export async function uploadSubmissionImages(files) {
  const { uploadToCloudinary, cloudinaryReady } = await import('./cloudinary.js')
  const imageUrls = []
  if (cloudinaryReady() && files?.length) {
    for (const file of files) {
      const url = await uploadToCloudinary(file, file.name)
      if (url) imageUrls.push(url)
    }
  }
  return imageUrls
}

export async function submitMission({ scout_id, mission_id, wave, text_response, image_files }) {
  const imageUrls = await uploadSubmissionImages(image_files)

  // No .select() after insert — anon has no SELECT grant on submissions
  // (see secure-rls.sql), and the caller doesn't use the returned id anyway.
  const { error } = await supabase
    .from('submissions')
    .insert({
      scout_id,
      mission_id,
      text_response: text_response || '',
      images:        imageUrls.length ? imageUrls : null,
      wave:          wave || '',
      submitted_at:  new Date().toISOString(),
    })

  if (error) throw new Error(error.message)
  return imageUrls
}

// ── Missions ──────────────────────────────────────────────────────────────────

// Public read — anon has SELECT on missions (see secure-rls.sql). Shapes
// rows to match the object shape src/data/missions.js used to hardcode.
export async function getMissions() {
  const { data, error } = await supabase
    .from('missions')
    .select('mission_id, title, teaser, topic, status, estimated_time, reward, prompt, opens_at, scheduled_open_at')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map(m => ({
    id:            m.mission_id,
    title:         m.title,
    teaser:        m.teaser,
    topic:         m.topic,
    status:        m.status,
    estimatedTime: m.estimated_time,
    reward:        m.reward,
    prompt:        m.prompt,
    // Stamped server-side the moment a mission is published — see
    // fix-mission-scheduling.sql. Drives that mission's own 72h window.
    opensAt:         m.opens_at,
    // Optional admin-set future publish time — see add-scheduled-publish.sql.
    scheduledOpenAt: m.scheduled_open_at,
  }))
}

// Flips any Upcoming mission whose scheduled_open_at has passed to Current.
// Safe to call from anon — see add-scheduled-publish.sql for the narrow
// server-side guard. Called on every scout app load (trigger-on-load, no
// cron available in this architecture).
export async function activateScheduledMissions() {
  await supabase.rpc('activate_scheduled_missions')
}

// Admin-only — requires an authenticated Supabase Auth session (see
// add-admin-missions.sql; anon has no write grant on missions).
export async function createMission({ id, title, teaser, topic, status, estimatedTime, reward, prompt, scheduledOpenAt }) {
  const { error } = await supabase
    .from('missions')
    .insert({
      mission_id:        id,
      title,
      teaser:            teaser || '',
      topic:             topic || 'Culture',
      status:            status || 'upcoming',
      estimated_time:    estimatedTime || '',
      reward:            reward || '',
      prompt:            prompt || '',
      scheduled_open_at: scheduledOpenAt || null,
    })

  if (error) throw new Error(error.message)
}

export async function updateMission(id, { title, teaser, topic, status, estimatedTime, reward, prompt, scheduledOpenAt }) {
  const { error } = await supabase
    .from('missions')
    .update({
      title,
      teaser:            teaser || '',
      topic:             topic || 'Culture',
      status:            status || 'upcoming',
      estimated_time:    estimatedTime || '',
      reward:            reward || '',
      prompt:            prompt || '',
      scheduled_open_at: scheduledOpenAt || null,
    })
    .eq('mission_id', id)

  if (error) throw new Error(error.message)
}

// Permanently deletes a mission. submissions.mission_id has ON DELETE
// CASCADE, so any scout submissions for this mission are deleted with it —
// the caller must warn about that before calling this.
export async function deleteMission(id) {
  const { error } = await supabase
    .from('missions')
    .delete()
    .eq('mission_id', id)

  if (error) throw new Error(error.message)
}

// ── Admin auth (Supabase Auth — separate from the scouts' custom scheme) ─────

export async function adminSignIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data.session
}

export async function adminSignOut() {
  await supabase.auth.signOut()
}
