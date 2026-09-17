// Fall-resolved contract: { residentId, timestamp } — mirrors dispatchFall.js's
// shape-validation-then-emit pattern. Sent when the elder dismisses their own
// FallDetectedBanner, so the family dashboard's FallAlertModal clears too.
const RESIDENT_ID = 'grandparent-1'

export function dispatchFallResolved(socket) {
  socket.emit('fallResolved', { residentId: RESIDENT_ID, timestamp: Date.now() })
}
