// Internal alert dispatch to the relay server — no external SMS/WhatsApp/
// Twilio, per CLAUDE.md's hard requirement. This is the mirror side of the
// `alert` socket event contract documented in TEAM_GUIDE.md:
// `{ sign, timestamp, confidence }`. Don't change this shape without updating
// server/ and dashboard/ too.

import { io } from "socket.io-client";

export function createAlertSocket(serverUrl) {
  return io(serverUrl, { autoConnect: true });
}

function isValidAlert(alert) {
  return (
    alert &&
    typeof alert.sign === "string" &&
    alert.sign.length > 0 &&
    typeof alert.timestamp === "number" &&
    typeof alert.confidence === "number" &&
    alert.confidence >= 0 &&
    alert.confidence <= 1
  );
}

// alert: { sign, timestamp, confidence } — pass a SignChainBuffer's onAlert
// output straight through.
export function dispatchAlert(socket, alert) {
  if (!isValidAlert(alert)) {
    console.error("dispatchAlert: dropping malformed alert payload", alert);
    return;
  }
  socket.emit("alert", alert);
}
