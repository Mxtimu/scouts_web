// Shared signup/profile validation — used by SignUpModal and
// EditProfileModal so the rules can't drift out of sync between the two.

// South African ID number: 13 digits encoding a real date of birth plus a
// Luhn checksum digit. A plain "is it 13 digits" check lets through
// anything, including obviously fake sequences like "1234567891234" — this
// catches those by actually validating the structure.
export function isValidSaId(id) {
  if (!/^\d{13}$/.test(id)) return false

  const yy = parseInt(id.slice(0, 2), 10)
  const mm = parseInt(id.slice(2, 4), 10)
  const dd = parseInt(id.slice(4, 6), 10)
  if (mm < 1 || mm > 12) return false

  const daysInMonth = (year, month) => new Date(year, month, 0).getDate()
  const validForCentury = (century) => {
    const year = century + yy
    return dd >= 1 && dd <= daysInMonth(year, mm)
  }
  if (!validForCentury(1900) && !validForCentury(2000)) return false

  // Luhn checksum over all 13 digits.
  let sum = 0
  let alternate = false
  for (let i = id.length - 1; i >= 0; i--) {
    let n = parseInt(id[i], 10)
    if (alternate) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alternate = !alternate
  }
  return sum % 10 === 0
}

// Local SA format only: 10 digits starting with 0 (e.g. 072 333 4356) — no
// +27 international prefix. Accepts input with spaces/dashes already in it.
export function isValidSaPhone(phone) {
  return /^0\d{9}$/.test(phone.replace(/[\s-]/g, ''))
}

// Formats digits as "072 333 4356" while typing — always reflects at most
// 10 digits regardless of what other characters were mixed in.
export function formatSaPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)]
    .filter(Boolean)
    .join(' ')
}

// Letters and single spaces only (so compound names still work) — no
// digits or punctuation. Motivated by a real incident: stray characters
// like backticks/quotes in a name field corrupted a CSV export.
export function isValidName(name) {
  return /^[A-Za-z]+(?:[ ][A-Za-z]+)*$/.test(name.trim())
}
