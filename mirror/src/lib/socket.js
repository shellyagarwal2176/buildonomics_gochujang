import { io } from 'socket.io-client'

// Contract (see CLAUDE.md / TEAM_GUIDE.md): { sign, timestamp, confidence }
// over the 'alert' event. Don't change this shape without telling the team —
// dashboard/ and server/ both depend on it.
export const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:4000', {
  autoConnect: true,
})
