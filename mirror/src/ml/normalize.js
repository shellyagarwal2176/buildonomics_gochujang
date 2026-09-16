// Port of ml/src/normalize.py — must stay numerically identical to it, since
// the classifier was trained on vectors produced by that script. Re-centers on
// the wrist and scales by hand span so recognition is invariant to distance/
// position from the camera (see root CLAUDE.md — not optional polish).

const WRIST_IDX = 0;
const MIDDLE_MCP_IDX = 9;
const NUM_LANDMARKS = 21;
const VEC_LEN_PER_HAND = NUM_LANDMARKS * 3;

// landmarks: array of 21 {x, y, z} (e.g. MediaPipe Hands output), or null/
// undefined if that hand wasn't detected. Returns a flat length-63 Float32Array.
export function normalizeHand(landmarks) {
  if (!landmarks) {
    return new Float32Array(VEC_LEN_PER_HAND);
  }

  const wrist = landmarks[WRIST_IDX];
  const centered = landmarks.map((p) => [p.x - wrist.x, p.y - wrist.y, p.z - wrist.z]);

  const mcp = centered[MIDDLE_MCP_IDX];
  const handSpan = Math.sqrt(mcp[0] * mcp[0] + mcp[1] * mcp[1] + mcp[2] * mcp[2]);
  const scale = handSpan > 1e-6 ? handSpan : 1.0;

  const out = new Float32Array(VEC_LEN_PER_HAND);
  for (let i = 0; i < centered.length; i++) {
    out[i * 3] = centered[i][0] / scale;
    out[i * 3 + 1] = centered[i][1] / scale;
    out[i * 3 + 2] = centered[i][2] / scale;
  }
  return out;
}

// Fixed-shape (126,) vector: 63 for left hand + 63 for right hand, in that
// order. Don't change the shape or ordering without updating ml/ and CLAUDE.md.
export function landmarksToVector(leftHandLandmarks, rightHandLandmarks) {
  const left = normalizeHand(leftHandLandmarks);
  const right = normalizeHand(rightHandLandmarks);
  const out = new Float32Array(left.length + right.length);
  out.set(left, 0);
  out.set(right, left.length);
  return out;
}
