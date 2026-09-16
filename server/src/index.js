const { createServer } = require('http')
const { Server } = require('socket.io')

// Relays alert events between mirror and dashboard. No video, no persistence, no DB.
// Alert contract: { sign, timestamp, confidence } — see CLAUDE.md.
const httpServer = createServer()
const io = new Server(httpServer, {
  cors: { origin: '*' },
})

io.on('connection', (socket) => {
  socket.on('alert', (payload) => {
    socket.broadcast.emit('alert', payload)
  })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => console.log(`relay listening on :${PORT}`))
