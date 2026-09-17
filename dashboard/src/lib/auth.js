// Family member signup/login (CLAUDE.md's Authentication section). The
// server issues a JWT on success; App.jsx stores it and uses it to
// authenticate the socket connection (`socket.auth = { token }`).
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'
const TOKEN_KEY = 'ghar-sanket:family-token'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function postJson(path, body) {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

export async function signup({ pairingCode, name, password }) {
  const { token } = await postJson('/api/family/signup', { pairingCode, name, password })
  return token
}

export async function login({ pairingCode, name, password }) {
  const { token } = await postJson('/api/family/login', { pairingCode, name, password })
  return token
}

// Issues a fresh household pairing code (server/src/auth.js's
// regenerateHouseholdCode) — the one shown once on the mirror at setup can't
// be viewed again otherwise, so this is the only way to get a new one for
// a family member who never saw or lost it. Doesn't affect already-paired
// mirrors or already-logged-in members, only future signups/pairings.
export async function regenerateCode(token) {
  const res = await fetch(`${SERVER_URL}/api/household/regenerate-code`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not generate a new code')
  return data.pairingCode
}
