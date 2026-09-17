import { socket } from './socket.js'

// Silent, one-time device pairing (CLAUDE.md's Authentication section) — she
// never sees a login screen. On first launch this asks the server to create
// a household and pair this device, then persists the device token so this
// never runs again. The pairing code is handed back to App.jsx to display
// once, for whoever is setting up family accounts on the dashboard.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'
const DEVICE_TOKEN_KEY = 'ghar-sanket:mirror-device-token'

async function postJson(path, body) {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request to ${path} failed`)
  return data
}

// Resolves { pairingCode } on a fresh pairing (so the caller can display it
// once), or { pairingCode: null } when a saved device token was reused.
// Either way, socket.auth is set and socket.connect() has been called by the
// time this resolves — the socket.io server rejects any unauthenticated
// connection (server/src/index.js's io.use() middleware).
export async function ensurePaired() {
  const existingToken = localStorage.getItem(DEVICE_TOKEN_KEY)
  if (existingToken) {
    socket.auth = { deviceToken: existingToken }
    socket.connect()
    return { pairingCode: null }
  }

  const { pairingCode } = await postJson('/api/household')
  const { deviceToken } = await postJson('/api/mirror/pair', { pairingCode })
  localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken)

  socket.auth = { deviceToken }
  socket.connect()
  return { pairingCode }
}
