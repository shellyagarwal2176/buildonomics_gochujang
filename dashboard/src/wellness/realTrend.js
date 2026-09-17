// Fetches real daily_metrics rows from the server and maps them into the
// exact shape syntheticTrend.js's generateSyntheticTrend() already produces,
// so HealthGraph.jsx / Predictions.jsx / driftAnalysis.js need zero changes
// to work with either source.

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'

export async function fetchRealTrend({ residentId = 'grandparent-1', days = 60 } = {}) {
  const res = await fetch(`${SERVER_URL}/metrics?residentId=${residentId}&days=${days}`)
  if (!res.ok) throw new Error(`metrics fetch failed: ${res.status}`)
  const rows = await res.json()
  return rows.filter(hasSignal).map(mapRow)
}

// Drop days with zero signal on all three scalar metrics (mirror was off, or
// consent was declined that day) rather than passing nulls through —
// driftAnalysis.js's average() would silently produce NaN on a null input.
function hasSignal(row) {
  return row.gait_speed_avg != null || row.sit_to_stand_avg_ms != null || row.sway_score_avg != null
}

// A single metric missing on one day (batch had no signal for it) holds the
// previous day's value instead of nulling out — one metric's temporary gap
// shouldn't NaN out that metric's whole chart when the other two are fine.
function mapRow(row, i, rows) {
  const prev = rows[i - 1]
  const fallback = (value, key) => (value != null ? value : prev ? prev[key] : 0)
  return {
    day: i,
    date: row.date,
    timestamp: new Date(row.date).getTime(),
    walkingSpeed: fallback(row.gait_speed_avg, 'gait_speed_avg'),
    sitToStandMs: fallback(row.sit_to_stand_avg_ms, 'sit_to_stand_avg_ms'),
    postureSway: fallback(row.sway_score_avg, 'sway_score_avg'),
    activityMinutes: {
      sitting: row.sitting_minutes ?? 0,
      standing: row.standing_minutes ?? 0,
      lying: row.lying_minutes ?? 0,
    },
  }
}
