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
