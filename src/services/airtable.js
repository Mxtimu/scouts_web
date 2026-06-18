const PAT      = import.meta.env.VITE_AIRTABLE_PAT?.replace(/^'|'$/g, '')
const BASE_ID  = import.meta.env.VITE_AIRTABLE_BASE_ID?.replace(/^'|'$/g, '')
const TABLE    = (import.meta.env.VITE_AIRTABLE_TABLE_NAME?.replace(/^'|'$/g, '')) || 'Scouts'
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`

// Submissions table (created 2026-06-08)
const SUBMISSIONS_TABLE_ID  = 'tblV1xDF6PAr45wbj'
const SUBMISSIONS_URL        = `https://api.airtable.com/v0/${BASE_ID}/${SUBMISSIONS_TABLE_ID}`
const VOICE_NOTE_FIELD_ID    = 'fldmdsbdxqlqBUEyw'
const IMAGES_FIELD_ID        = 'fldL4Zs5Gn2L6pS4M'

// Actual Airtable field names → our internal snake_case keys
const FIELD_MAP = {
  'Scout ID':      'scout_id',
  'Full Name':     'full_name',
  'Email':         'email',
  'Phone Number':  'phone',
  'Date of Birth': 'date_of_birth',
  'Location':      'location',
  'Password Hash': 'password_hash',
  'Created At':    'created_at',
}

function normalize(fields) {
  if (!fields) return null
  const out = {}
  for (const [atKey, ourKey] of Object.entries(FIELD_MAP)) {
    if (fields[atKey] !== undefined) out[ourKey] = fields[atKey]
  }
  return out
}

function toAirtableFields({ scout_id, full_name, email, phone, date_of_birth, location, password_hash, created_at }) {
  return {
    'Scout ID':      scout_id,
    'Full Name':     full_name,
    'Email':         email,
    'Phone Number':  phone ?? '',
    'Date of Birth': date_of_birth ?? '',
    'Location':      location ?? '',
    'Password Hash': password_hash ?? '',
    'Created At':    created_at ?? new Date().toISOString(),
  }
}

function authHeaders() {
  return {
    Authorization: `Bearer ${PAT}`,
    'Content-Type': 'application/json',
  }
}

async function airtableFetch(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...options.headers } })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `Airtable error ${res.status}`)
  return data
}

export async function findScoutByEmail(email) {
  const formula = encodeURIComponent(`{Email}='${email.replace(/'/g, "\\'")}'`)
  const data = await airtableFetch(`${BASE_URL}?filterByFormula=${formula}`)
  return normalize(data.records?.[0]?.fields)
}

async function findScoutByScoutId(scoutId) {
  const formula = encodeURIComponent(`{Scout ID}='${scoutId}'`)
  const data = await airtableFetch(`${BASE_URL}?filterByFormula=${formula}`)
  return normalize(data.records?.[0]?.fields)
}

async function generateScoutId() {
  for (let i = 0; i < 20; i++) {
    const num = Math.floor(Math.random() * 900) + 100   // SC100 – SC999
    const id  = `SC${num}`
    const existing = await findScoutByScoutId(id)
    if (!existing) return id
  }
  return `SC${Math.floor(Math.random() * 9000) + 1000}`
}

export async function getScoutSubmissions(scoutId) {
  const formula = encodeURIComponent(`{Scout ID}='${scoutId}'`)
  const data = await airtableFetch(`${SUBMISSIONS_URL}?filterByFormula=${formula}`)
  return (data.records || []).map(r => ({
    mission_id:   r.fields['Mission ID'],
    submitted_at: r.fields['Submitted At'],
  }))
}

export async function submitMission({ scout_id, mission_id, mission_title, wave, text_response, voice_blob, image_files }) {
  // Lazy-import so Cloudinary is only loaded when a submission happens
  const { uploadToCloudinary, cloudinaryReady } = await import('./cloudinary.js')

  // 1. Upload files to Cloudinary first (if configured) to get public URLs
  let voiceUrl = null
  const imageUrls = []

  if (cloudinaryReady()) {
    if (voice_blob) {
      const ext = voice_blob.type.includes('ogg') ? 'ogg' : 'webm'
      voiceUrl = await uploadToCloudinary(voice_blob, `voice_${scout_id}_${mission_id}.${ext}`)
    }
    for (const file of (image_files || [])) {
      const url = await uploadToCloudinary(file, file.name)
      if (url) imageUrls.push(url)
    }
  }

  // 2. Build the text response — append file notes if Cloudinary not set up
  let fullText = text_response || ''
  if (!cloudinaryReady()) {
    if (voice_blob) fullText += fullText ? '\n\n[Voice note recorded — file storage not configured]' : '[Voice note recorded — file storage not configured]'
    if (image_files?.length) fullText += `\n\n[${image_files.length} image(s) selected — file storage not configured]`
  }

  // 3. Create the Airtable record with text + attachment URLs
  const attachmentFields = {}
  if (voiceUrl) attachmentFields['Voice Note'] = [{ url: voiceUrl }]
  if (imageUrls.length) attachmentFields['Images'] = imageUrls.map(url => ({ url }))

  const record = await airtableFetch(SUBMISSIONS_URL, {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        'Scout ID':      scout_id,
        'Mission ID':    mission_id,
        'Mission Title': mission_title,
        'Text Response': fullText,
        'Wave':          wave || '',
        'Submitted At':  new Date().toISOString(),
        ...attachmentFields,
      },
    }),
  })

  return record.id
}

export async function createScout({ full_name, email, phone, date_of_birth, location, password_hash }) {
  const scout_id = await generateScoutId()
  const data = await airtableFetch(BASE_URL, {
    method: 'POST',
    body: JSON.stringify({
      fields: toAirtableFields({
        scout_id,
        full_name,
        email,
        phone,
        date_of_birth,
        location,
        password_hash,
        created_at: new Date().toISOString(),
      }),
    }),
  })
  return normalize(data.fields)
}
