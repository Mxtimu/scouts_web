// Proper CSV escaping (quotes fields containing commas/quotes/newlines,
// doubles internal quotes) — the exact robustness gap that let stray
// characters corrupt an earlier CSV export.
function csvEscape(value) {
  if (Array.isArray(value)) value = value.join('; ')
  const str = value == null ? '' : String(value)
  if (/["\n,]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

// columns: [{ key, label }] — exports rows[*][key] under header `label`.
export function exportToCsv(filename, rows, columns) {
  const header = columns.map(c => csvEscape(c.label)).join(',')
  const lines  = rows.map(row => columns.map(c => csvEscape(row[c.key])).join(','))
  const csv    = [header, ...lines].join('\r\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
