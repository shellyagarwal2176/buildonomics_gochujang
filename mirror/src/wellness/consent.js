// Phase 2 wellness-monitoring consent. Stored client-side only (localStorage)
// since nothing here is video/PII either way — matches CLAUDE.md's existing
// privacy stance. null = never asked, true/false = explicit answer.
const KEY = 'kinesense.wellnessConsent'

export function getConsent() {
  const raw = localStorage.getItem(KEY)
  if (raw === 'yes') return true
  if (raw === 'no') return false
  return null
}

export function setConsent(granted) {
  localStorage.setItem(KEY, granted ? 'yes' : 'no')
}
