import { useEffect, useState } from 'react'
import { socket } from '../lib/socket.js'

// Severity tiers per the PRD: normal (water, food), high (pain, medicine),
// urgent (help). Anything not listed defaults to 'normal' — extend this map
// as the real sign vocabulary grows, rather than hardcoding new cases below.
const SEVERITY_BY_SIGN = {
  water: 'normal',
  food: 'normal',
  pain: 'high',
  medicine: 'high',
  help: 'urgent',
}

function severityFor(sign) {
  return SEVERITY_BY_SIGN[sign?.toLowerCase()] ?? 'normal'
}

export function useAlertFeed() {
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    function handleAlert(payload) {
      setEvents((prev) => [
        {
          kind: 'alert',
          id: `${payload.timestamp}-${payload.sign}`,
          sign: payload.sign,
          timestamp: payload.timestamp,
          severity: severityFor(payload.sign),
        },
        ...prev,
      ])
    }
    function handleConnect() { setConnected(true) }
    function handleDisconnect() { setConnected(false) }

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
