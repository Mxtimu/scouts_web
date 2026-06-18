import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL?.replace(/^'|'$/g, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.replace(/^'|'$/g, '')

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Scouts ────────────────────────────────────────────────────────────────────

export async function findScoutByEmail(email) {
  const { data, error } = await supabase
    .from('scouts')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    scout_id:      data.scout_id,
    full_name:     data.full_name,
    email:         data.email,
    phone:         data.phone_number,
    date_of_birth: data.birth_date,
    location:      data.location,
    password_hash: data.password_hash,
    created_at:    data.created_at,
  }
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
  const scout_id = await generateScoutId()

  const { data, error } = await supabase
    .from('scouts')
    .insert({
      scout_id,
      full_name,
      email:         email.toLowerCase().trim(),
      phone_number:  phone     ?? '',
      birth_date:    date_of_birth || null,
      location:      location  ?? '',
      password_hash,
      created_at:    new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    scout_id:      data.scout_id,
    full_name:     data.full_name,
    email:         data.email,
    phone:         data.phone_number,
    date_of_birth: data.birth_date,
    location:      data.location,
    created_at:    data.created_at,
  }
}

// ── Submissions ───────────────────────────────────────────────────────────────

export async function getScoutSubmissions(scoutId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('mission_id, submitted_at')
    .eq('scout_id', scoutId)

  if (error) throw new Error(error.message)
  return (data || []).map(r => ({
    mission_id:   r.mission_id,
    submitted_at: r.submitted_at,
  }))
}

export async function submitMission({ scout_id, mission_id, wave, text_response, image_files }) {
  const { uploadToCloudinary, cloudinaryReady } = await import('./cloudinary.js')
  const imageUrls = []

  if (cloudinaryReady() && image_files?.length) {
    for (const file of image_files) {
      const url = await uploadToCloudinary(file, file.name)
      if (url) imageUrls.push(url)
    }
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      scout_id,
      mission_id,
      text_response: text_response || '',
      images:        imageUrls.length ? imageUrls : null,
      wave:          wave || '',
      submitted_at:  new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}
