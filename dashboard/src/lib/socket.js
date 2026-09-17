import { io } from 'socket.io-client'

// Contract (see CLAUDE.md / TEAM_GUIDE.md): { sign, timestamp, confidence }
// over the 'alert' event, coming from mirror/ via the server relay.
// This app also emits { text, timestamp } over 'checkin' — the reverse
// direction, family to mirror — see App.jsx's handleSendCheckin. Incoming
// checkin events (from other family members in the same household) carry a
// server-attached `from` name — see App.jsx's checkin listener.
//
// autoConnect is off: every connection must now authenticate (server/src/
// index.js's io.use() middleware) with a family JWT, so App.jsx sets
// `socket.auth = { token }` and calls socket.connect() itself once a token
// is available — either a saved one, or one just issued by AuthForm.
export const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:4000', {
  autoConnect: false,
})
