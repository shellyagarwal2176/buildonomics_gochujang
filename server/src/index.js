const { createServer } = require('http')
const { Server } = require('socket.io')

// Relays alert and check-in events between mirror and dashboard. No video,
// no persistence, no DB.
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

const httpServer = createServer()
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
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => console.log(`relay listening on :${PORT}`))
