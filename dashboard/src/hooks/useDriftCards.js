import { useCallback, useEffect, useState } from 'react'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'
const RESIDENT_ID = 'grandparent-1' // single hardcoded resident, matches mirror/src/wellness/dispatchMetric.js
const POLL_MS = 30000 // drift_cards only change after a manual/scheduled detect_drift.py run — polling is fine, no need for a socket event

export function useDriftCards() {
  const [cards, setCards] = useState([])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/drift-cards?residentId=${RESIDENT_ID}`)
      if (res.ok) setCards(await res.json())
    } catch {
      // server unreachable — leave cards as-is, next poll retries
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  const dismiss = useCallback(async (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id)) // optimistic
    try {
      await fetch(`${SERVER_URL}/drift-cards/${id}/dismiss`, { method: 'POST' })
    } catch {
      refresh() // fetch failed — reconcile with server instead of trusting the optimistic update
    }
  }, [refresh])

  return { cards, dismiss }
}
