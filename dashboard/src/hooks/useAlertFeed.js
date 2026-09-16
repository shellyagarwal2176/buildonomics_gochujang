import { useEffect, useRef, useState } from 'react'
import { socket } from '../lib/socket.js'

// Severity tiers over the real frozen 19-word vocabulary (ml/src/labels.py).
// Anything not listed defaults to 'normal'.
const SEVERITY_BY_SIGN = {
  'i need help': 'urgent',
  warn: 'urgent',
  afraid: 'urgent',
  pain: 'high',
  sick: 'high',
  bad: 'high',
  problem: 'high',
  doctor: 'high',
  stop: 'high',
}

function severityFor(sign) {
  return SEVERITY_BY_SIGN[sign?.toLowerCase()] ?? 'normal'
}

export function useAlertFeed({ onNewAlert } = {}) {
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(socket.connected)
  const onNewAlertRef = useRef(onNewAlert)
  useEffect(() => {
    onNewAlertRef.current = onNewAlert
  }, [onNewAlert])

  useEffect(() => {
    function handleAlert(payload) {
      const event = {
        kind: 'alert',
        id: `${payload.timestamp}-${payload.sign}`,
        sign: payload.sign,
        timestamp: payload.timestamp,
        severity: severityFor(payload.sign),
      }
      setEvents((prev) => [event, ...prev])
      onNewAlertRef.current?.(event)
    }
    function handleConnect() { setConnected(true) }
    function handleDisconnect() { setConnected(false) }

    // socket.io connects as soon as lib/socket.js is imported, which can
    // happen (and finish) before this effect runs — sync the current state
    // here too, not just on future 'connect'/'disconnect' events, or an
    // already-connected socket leaves `connected` stuck at its stale initial
    // value forever.
    setConnected(socket.connected)

    socket.on('alert', handleAlert)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    return () => {
      socket.off('alert', handleAlert)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }, [])

  return { events, connected }
}
