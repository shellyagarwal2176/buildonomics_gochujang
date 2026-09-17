// Metric contract: { residentId, windowStart, windowEnd, ...nullable numeric
// fields } — mirrors dispatchFall.js/alerts/dispatchAlert.js's shape-
// validation-then-emit pattern. Write-only ingestion, not broadcast — see
// server/src/index.js's metric handler.
const RESIDENT_ID = 'grandparent-1'

function isValidMetric(metric) {
  if (!metric) return false
  if (typeof metric.windowStart !== 'number' || typeof metric.windowEnd !== 'number') return false
  const numericOrNull = (v) => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0)
  return (
    numericOrNull(metric.gaitSpeedAvg) &&
    numericOrNull(metric.sitToStandMs) &&
    numericOrNull(metric.swayScore) &&
    numericOrNull(metric.symmetryScore) &&
    numericOrNull(metric.freezeEventsCount) &&
    numericOrNull(metric.sittingMinutes) &&
    numericOrNull(metric.standingMinutes) &&
    numericOrNull(metric.lyingMinutes)
  )
}

export function dispatchMetric(socket, metric) {
  if (!isValidMetric(metric)) {
    console.error('dispatchMetric: dropping malformed metric payload', metric)
    return
  }
  socket.emit('metric', { residentId: RESIDENT_ID, ...metric })
}
