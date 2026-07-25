// SHA-256 + random salt via Web Crypto API — no external deps, sufficient for MVP
//
// crypto.subtle only exists in a secure context (HTTPS or localhost) — on a
// plain http:// page it's undefined, and every call below would otherwise
// fail with a cryptic "Cannot read properties of undefined (reading
// 'digest')". This check turns that into a message that actually explains
// what's wrong.
function assertSecureContext() {
  if (!window.crypto?.subtle) {
    throw new Error('This page needs to be loaded over a secure (https://) connection to sign in or create an account.')
  }
}

export async function hashPassword(password) {
  assertSecureContext()
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + password))
  const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${salt}:${hash}`
}

// Used server-side (verify_scout_password RPC) to check the computed hash —
// the stored salt:hash is never sent to the client, only the salt is.
export async function computeHash(password, salt) {
  assertSecureContext()
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}
