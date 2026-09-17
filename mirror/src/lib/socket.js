import { io } from 'socket.io-client'

// Contract (see CLAUDE.md / TEAM_GUIDE.md): { sign, timestamp, confidence }
// over the 'alert' event. Don't change this shape without telling the team —
// dashboard/ and server/ both depend on it.
// This app also listens for { text, timestamp, from } over 'checkin' — the
// reverse direction, family to mirror — see App.jsx's checkin listener.
//
// autoConnect is off: every connection must now authenticate (server/src/
// index.js's io.use() middleware), so lib/pairing.js sets `socket.auth` and
// calls socket.connect() itself once a device token is available — either a
// saved one, or a freshly paired one on first launch.
export const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:4000', {
  autoConnect: false,
})
