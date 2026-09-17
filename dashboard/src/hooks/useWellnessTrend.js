import { useEffect, useState } from 'react'
import { generateSyntheticTrend } from '../wellness/syntheticTrend.js'
import { fetchRealTrend } from '../wellness/realTrend.js'

// Below this, driftAnalysis.js's baselineDays=14/recentDays=7 windows
// overlap entirely (both would just be "all available rows"), so pctChange
// reads ~0%/steady right at switchover and only sharpens as real data grows
// toward 21 days. Expected, not a bug — chosen for a faster demo turnaround
// over a fully-settled baseline.
const MIN_REAL_DAYS = 7

export function useWellnessTrend({ residentId = 'grandparent-1', days = 60 } = {}) {
  const [state, setState] = useState(() => ({
    data: generateSyntheticTrend({ days }),
    isSynthetic: true,
  }))

  useEffect(() => {
    let cancelled = false
    fetchRealTrend({ residentId, days })
      .then((real) => {
        if (cancelled || real.length < MIN_REAL_DAYS) return
        setState({ data: real, isSynthetic: false })
      })
      // Server unreachable, or not enough real data yet — keep whatever's
      // already in state (synthetic on first load, or last-known-good real
      // data if this is a later re-fetch) rather than reverting the screen.
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [residentId, days])

  return state
}
