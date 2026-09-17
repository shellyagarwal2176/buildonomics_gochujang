// Fall contract: { residentId, timestamp, confidence } — mirrors
// alerts/dispatchAlert.js's shape-validation-then-emit pattern exactly.
const RESIDENT_ID = 'grandparent-1' // single hardcoded resident, per Phase 2 plan — no accounts/multi-resident support

function isValidFall(fall) {
  return (
    fall &&
    typeof fall.timestamp === 'number' &&
    typeof fall.confidence === 'number' &&
    fall.confidence >= 0 &&
    fall.confidence <= 1
  )
}

export function dispatchFall(socket, fall) {
  if (!isValidFall(fall)) {
    console.error('dispatchFall: dropping malformed fall payload', fall)
    return
  }
  socket.emit('fall', { residentId: RESIDENT_ID, ...fall })
}
