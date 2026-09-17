// Maps a real /drift-cards row (server/src/db.js's getUndismissedDriftCards
// shape: { id, metric, message, severity, detected_at, changepoint_date })
// into WellnessDriftCards.jsx's card shape, so one component renders cards
// from either source.
export function adaptRealDriftCard(row) {
  return {
    id: row.id,
    // severity is 'notice'|'info' per ml/src/detect_drift.py's TEMPLATES.
    kind: row.severity === 'notice' ? 'concern' : 'positive',
    message: row.message,
    timestamp: row.detected_at,
  }
}
