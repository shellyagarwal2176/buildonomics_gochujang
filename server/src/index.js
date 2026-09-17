const { createServer } = require('http')
const { Server } = require('socket.io')
const { upsertDailyMetric, getUndismissedDriftCards, dismissDriftCard } = require('./db')
const {
  createHousehold,
  regenerateHouseholdCode,
  pairMirror,
  verifyDeviceToken,
  signupFamilyMember,
  loginFamilyMember,
  verifyFamilyToken,
} = require('./auth')

// Relays alert and check-in events between mirror and dashboard. No video
// ever stored — that's what CLAUDE.md's "no persistence" line protects.
// Phase 2 adds a small SQLite store (see db.js) for the wellness trend
// engine's rolling metric buffer; it holds numeric gait/posture summaries
// only, never video/PII, so it's a deliberate addition, not a reversal.
// Alert contract: { sign, timestamp, confidence } — see CLAUDE.md/TEAM_GUIDE.md.
// Sign chaining happens upstream in mirror/ (see PRD architecture diagram: ISL
// model -> sign chaining -> alert) — by the time an event reaches here it's
// already a single finished alert, not raw per-sign events to buffer.
// Check-in contract: { text, timestamp } — family's message back to the
// mirror's Reassurance Drawer, mirroring the alert contract's shape. The
// relay attaches `from` (the sender's name) server-side before broadcasting
// — see the socket.io auth middleware below; never trust a client-supplied
// name for attribution.
//
// Every socket must authenticate (see CLAUDE.md's Authentication section) as
// either a paired mirror device or a logged-in family member, and every
// live event (alert/checkin/fall/fallResolved) is scoped to that socket's
// household room — a household never sees another household's events.
function isValidAlert(payload) {
  return (
    payload &&
    typeof payload.sign === 'string' &&
    payload.sign.length > 0 &&
    typeof payload.timestamp === 'number' &&
    typeof payload.confidence === 'number' &&
    payload.confidence >= 0 &&
    payload.confidence <= 1
  )
}

function isValidCheckin(payload) {
  return (
    payload &&
    typeof payload.text === 'string' &&
    payload.text.length > 0 &&
    typeof payload.timestamp === 'number'
  )
}

// Fall contract: { residentId, timestamp, confidence } — instant, mirrors the
// alert contract's shape exactly. Drives dashboard/FallAlertModal.
function isValidFall(payload) {
  return (
    payload &&
    typeof payload.residentId === 'string' &&
    payload.residentId.length > 0 &&
    typeof payload.timestamp === 'number' &&
    typeof payload.confidence === 'number' &&
    payload.confidence >= 0 &&
    payload.confidence <= 1
  )
}

// Fall-resolved contract: { residentId, timestamp } — sent when the elder
// dismisses their own FallDetectedBanner ("I'm okay"), so the family
// dashboard's FallAlertModal clears in step rather than staying open forever.
function isValidFallResolved(payload) {
  return (
    payload &&
    typeof payload.residentId === 'string' &&
    payload.residentId.length > 0 &&
    typeof payload.timestamp === 'number'
  )
}

// Metric contract: { residentId, windowStart, windowEnd, ...nullable numeric
// gait/posture fields }. Batched every 30-60s in mirror/, NOT per-frame.
// Unlike alert/checkin/fall this is write-only ingestion into daily_metrics —
// it does not get broadcast, since nobody needs to see it live; the dashboard
// reads the trend engine's derived drift_cards instead (see ml/detect_drift.py).
function isValidMetric(payload) {
  if (!payload) return false
  if (typeof payload.residentId !== 'string' || payload.residentId.length === 0) return false
  if (typeof payload.windowStart !== 'number' || typeof payload.windowEnd !== 'number') return false
  const numericOrNull = (v) => v === null || v === undefined || (typeof v === 'number' && Number.isFinite(v) && v >= 0)
  return (
    numericOrNull(payload.gaitSpeedAvg) &&
    numericOrNull(payload.sitToStandMs) &&
    numericOrNull(payload.swayScore) &&
    numericOrNull(payload.symmetryScore) &&
    numericOrNull(payload.freezeEventsCount) &&
    numericOrNull(payload.sittingMinutes) &&
    numericOrNull(payload.standingMinutes) &&
    numericOrNull(payload.lyingMinutes)
  )
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS })
  res.end(JSON.stringify(body))
}

// Family-JWT auth for the REST endpoints that need it (currently just
// regenerate-code) — same token shape/verification as the socket.io
// middleware below, just read from an Authorization header instead of
// handshake.auth. Returns the decoded payload or null, never throws.
function authenticateFamilyRequest(req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return verifyFamilyToken(token)
}

// No framework (matches the existing plain `http` server) — just enough
// body parsing for the small JSON payloads the /api/* auth endpoints take.
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 1e6) req.destroy(new Error('Request body too large'))
    })
    req.on('end', () => {
      if (!data) return resolve({})
      try {
        resolve(JSON.parse(data))
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  if (req.method === 'GET' && url.pathname === '/drift-cards') {
    const residentId = url.searchParams.get('residentId')
    if (!residentId) {
      sendJson(res, 400, { error: 'residentId is required' })
      return
    }
    sendJson(res, 200, getUndismissedDriftCards(residentId))
    return
  }

  if (req.method === 'POST' && /^\/drift-cards\/\d+\/dismiss$/.test(url.pathname)) {
    const id = Number(url.pathname.split('/')[2])
    dismissDriftCard(id)
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/household') {
    try {
      const { householdId, pairingCode } = createHousehold()
      sendJson(res, 201, { householdId, pairingCode })
    } catch (err) {
      sendJson(res, 500, { error: err.message })
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/mirror/pair') {
    try {
      const body = await readJsonBody(req)
      const { deviceToken, householdId } = pairMirror(body.pairingCode)
      sendJson(res, 201, { deviceToken, householdId })
    } catch (err) {
      sendJson(res, 400, { error: err.message })
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/family/signup') {
    try {
      const body = await readJsonBody(req)
      const token = signupFamilyMember(body.pairingCode, body.name, body.password)
      sendJson(res, 201, { token })
    } catch (err) {
      sendJson(res, 400, { error: err.message })
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/family/login') {
    try {
      const body = await readJsonBody(req)
      const token = loginFamilyMember(body.pairingCode, body.name, body.password)
      sendJson(res, 200, { token })
    } catch (err) {
      sendJson(res, 401, { error: err.message })
    }
    return
  }

  // Rotates the household's pairing code (see auth.js's regenerateHouseholdCode)
  // — any logged-in family member can trigger it, proven by their JWT.
  // Doesn't invalidate already-paired mirrors or already-issued JWTs, only
  // future signups/logins/mirror pairings need the new code.
  if (req.method === 'POST' && url.pathname === '/api/household/regenerate-code') {
    const payload = authenticateFamilyRequest(req)
    if (!payload) {
      sendJson(res, 401, { error: 'unauthorized' })
      return
    }
    try {
      const pairingCode = regenerateHouseholdCode(payload.householdId)
      sendJson(res, 200, { pairingCode })
    } catch (err) {
      sendJson(res, 400, { error: err.message })
    }
    return
  }

  res.writeHead(404, CORS_HEADERS)
  res.end()
})
const io = new Server(httpServer, {
  cors: { origin: '*' },
})

// Every socket authenticates as either a paired mirror device
// ({ deviceToken } in handshake.auth) or a logged-in family member
// ({ token }). Neither resolves -> reject the connection outright, per
// CLAUDE.md's Authentication section — no anonymous sockets.
io.use((socket, next) => {
  const auth = socket.handshake.auth || {}

  if (auth.deviceToken) {
    const result = verifyDeviceToken(auth.deviceToken)
    if (!result) return next(new Error('unauthorized'))
    socket.data.householdId = result.householdId
    socket.data.role = 'mirror'
    socket.data.name = null
    return next()
  }

  if (auth.token) {
    const payload = verifyFamilyToken(auth.token)
    if (!payload) return next(new Error('unauthorized'))
    socket.data.householdId = payload.householdId
    socket.data.role = 'family'
    socket.data.name = payload.name
    return next()
  }

  return next(new Error('unauthorized'))
})

io.on('connection', (socket) => {
  const room = `household:${socket.data.householdId}`
  socket.join(room)

  socket.on('alert', (payload) => {
    if (!isValidAlert(payload)) {
      console.error('Dropping malformed alert payload from', socket.id, payload)
      return
    }
    io.to(room).except(socket.id).emit('alert', payload)
  })

  socket.on('checkin', (payload) => {
    if (!isValidCheckin(payload)) {
      console.error('Dropping malformed checkin payload from', socket.id, payload)
      return
    }
    io.to(room).except(socket.id).emit('checkin', { ...payload, from: socket.data.name })
  })

  // fall/fallResolved carry the same cross-household privacy stakes as
  // alert/checkin (arguably higher), so they're room-scoped the same way
  // even though only alert/checkin were called out by name — leaving these
  // on socket.broadcast would still leak a fall event to every connected
  // household, which defeats the point of this auth pass.
  socket.on('fall', (payload) => {
    if (!isValidFall(payload)) {
      console.error('Dropping malformed fall payload from', socket.id, payload)
      return
    }
    io.to(room).except(socket.id).emit('fall', payload)
  })

  socket.on('fallResolved', (payload) => {
    if (!isValidFallResolved(payload)) {
      console.error('Dropping malformed fallResolved payload from', socket.id, payload)
      return
    }
    io.to(room).except(socket.id).emit('fallResolved', payload)
  })

  socket.on('metric', (payload) => {
    if (!isValidMetric(payload)) {
      console.error('Dropping malformed metric payload from', socket.id, payload)
      return
    }
    const date = new Date(payload.windowEnd).toISOString().slice(0, 10)
    upsertDailyMetric(payload.residentId, date, payload)
  })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => console.log(`relay listening on :${PORT}`))
