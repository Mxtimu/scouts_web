#!/usr/bin/env node
/**
 * migrate-to-supabase.js
 *
 * Reads all Scouts + Submissions from Airtable and inserts them into Supabase.
 * Run ONCE after the Supabase schema is applied and env vars are filled in.
 *
 * Usage:
 *   node migrate-to-supabase.js
 *
 * Requires:
 *   - @supabase/supabase-js  (already installed)
 *   - Node 18+ (uses built-in fetch)
 *
 * All four env vars must be set in .env before running:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
 *   VITE_AIRTABLE_PAT, VITE_AIRTABLE_BASE_ID
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'



const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '.env')
const envLines = readFileSync(envPath, 'utf8').split('\n')
const env = {}
for (const line of envLines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  const val = trimmed.slice(eq + 1).trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '')
  env[key] = val
}

const SUPABASE_URL         = env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const AT_PAT               = env.VITE_AIRTABLE_PAT
const AT_BASE_ID           = env.VITE_AIRTABLE_BASE_ID

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
  process.exit(1)
}
if (!AT_PAT || !AT_BASE_ID) {
  console.error('ERROR: VITE_AIRTABLE_PAT and VITE_AIRTABLE_BASE_ID must be set in .env')
  process.exit(1)
}

// Server-side only — the service role key bypasses RLS, which is required
// now that anon access to scouts/submissions is locked down.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Airtable helpers ─────────────────────────────────────────────────────────

async function airtableFetchAll(table) {
  const records = []
  let offset = undefined
  do {
    const url = new URL(`https://api.airtable.com/v0/${AT_BASE_ID}/${encodeURIComponent(table)}`)
    if (offset) url.searchParams.set('offset', offset)
    url.searchParams.set('pageSize', '100')

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AT_PAT}` },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Airtable error fetching ${table}: ${res.status} ${body}`)
    }
    const json = await res.json()
    records.push(...json.records)
    offset = json.offset
  } while (offset)
  return records
}

// ── Migration ────────────────────────────────────────────────────────────────

async function migrateScouts() {
  console.log('\n── Fetching scouts from Airtable…')
  const records = await airtableFetchAll('Scouts')
  console.log(`   Found ${records.length} scouts`)
  if (records.length === 0) return []

  const rows = records.map(r => ({
    scout_id:     r.fields['Scout ID']    || r.fields['scout_id']    || '',
    full_name:    r.fields['Full Name']   || r.fields['full_name']   || '',
    email:        (r.fields['Email']      || r.fields['email']       || '').toLowerCase().trim(),
    phone_number: r.fields['Phone Number'] || r.fields['Phone']      || r.fields['phone']       || '',
    birth_date:   r.fields['Date of Birth'] || r.fields['date_of_birth'] || null,
    location:     r.fields['Location']   || r.fields['location']    || '',
    password_hash: r.fields['Password Hash'] || r.fields['password_hash'] || '',
    created_at:   r.fields['Created At'] || r.fields['created_at']  || new Date().toISOString(),
  })).filter(r => r.scout_id && r.email)

  console.log(`   Inserting ${rows.length} scouts into Supabase…`)
  const { error } = await supabase
    .from('scouts')
    .upsert(rows, { onConflict: 'scout_id' })

  if (error) throw new Error(`Supabase scouts insert failed: ${error.message}`)
  console.log('   ✓ Scouts migrated')
  return rows.map(r => r.scout_id)
}

async function migrateSubmissions(knownScoutIds) {
  const scoutSet = new Set(knownScoutIds)

  console.log('\n── Fetching submissions from Airtable…')
  let records
  try {
    records = await airtableFetchAll('Submissions')
  } catch (e) {
    console.log(`   Skipping submissions — table not found or not accessible: ${e.message}`)
    return
  }
  console.log(`   Found ${records.length} submissions`)
  if (records.length === 0) return

  const rows = records
    .map(r => ({
      scout_id:      r.fields['Scout ID']      || r.fields['scout_id']      || '',
      mission_id:    r.fields['Mission ID']    || r.fields['mission_id']    || '',
      text_response: r.fields['Text Response'] || r.fields['text_response'] || '',
      images:        r.fields['Images']        || r.fields['images']        || null,
      wave:          r.fields['Wave']          || r.fields['wave']          || '',
      submitted_at:  r.fields['Submitted At']  || r.fields['submitted_at']  || new Date().toISOString(),
    }))
    .filter(r => r.scout_id && r.mission_id && scoutSet.has(r.scout_id))

  // Deduplicate by (scout_id, mission_id) — Airtable may have duplicate entries
  const deduped = [...new Map(rows.map(r => [`${r.scout_id}:${r.mission_id}`, r])).values()]

  if (deduped.length === 0) {
    console.log('   No valid submissions to migrate')
    return
  }

  console.log(`   Inserting ${deduped.length} submissions into Supabase…`)
  const { error } = await supabase
    .from('submissions')
    .upsert(deduped, { onConflict: 'scout_id,mission_id' })

  if (error) throw new Error(`Supabase submissions insert failed: ${error.message}`)
  console.log('   ✓ Submissions migrated')
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Signal Scouts — Airtable → Supabase Migration')
  console.log('==============================================')
  console.log(`Supabase: ${SUPABASE_URL}`)
  console.log(`Airtable base: ${AT_BASE_ID}`)

  try {
    const scoutIds = await migrateScouts()
    await migrateSubmissions(scoutIds)
    console.log('\n✓ Migration complete!\n')
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message)
    process.exit(1)
  }
}

main()
