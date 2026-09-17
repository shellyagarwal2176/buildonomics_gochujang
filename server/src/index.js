const { createServer } = require('http')
const { Server } = require('socket.io')
const { upsertDailyMetric, getUndismissedDriftCards, dismissDriftCard } = require('./db')

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
// mirror's Reassurance Drawer, mirroring the alert contract's shape.
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

const httpServer = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/drift-cards') {
    const residentId = url.searchParams.get('residentId')
    if (!residentId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'residentId is required' }))
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(getUndismissedDriftCards(residentId)))
    return
  }

  if (req.method === 'POST' && /^\/drift-cards\/\d+\/dismiss$/.test(url.pathname)) {
    const id = Number(url.pathname.split('/')[2])
    dismissDriftCard(id)
    res.writeHead(204)
    res.end()
    return
  }

  res.writeHead(404)
  res.end()
})
const io = new Server(httpServer, {
  cors: { origin: '*' },
})

io.on('connection', (socket) => {
  socket.on('alert', (payload) => {
    if (!isValidAlert(payload)) {
      console.error('Dropping malformed alert payload from', socket.id, payload)
      return
    }
    socket.broadcast.emit('alert', payload)
  })

  socket.on('checkin', (payload) => {
    if (!isValidCheckin(payload)) {
      console.error('Dropping malformed checkin payload from', socket.id, payload)
      return
    }
    socket.broadcast.emit('checkin', payload)
  })

  socket.on('fall', (payload) => {
    if (!isValidFall(payload)) {
      console.error('Dropping malformed fall payload from', socket.id, payload)
      return
    }
    socket.broadcast.emit('fall', payload)
  })

  socket.on('fallResolved', (payload) => {
    if (!isValidFallResolved(payload)) {
      console.error('Dropping malformed fallResolved payload from', socket.id, payload)
      return
    }
    socket.broadcast.emit('fallResolved', payload)
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
