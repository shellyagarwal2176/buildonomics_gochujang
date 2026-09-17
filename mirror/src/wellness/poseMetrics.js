// Phase 2 pose-geometry processing, hooked into the same Holistic onResults
// frame stream useSignRecognition.js already runs (results.poseLandmarks is
// received on every frame today and discarded — this just starts reading it).
// Entirely separate from results.leftHandLandmarks/rightHandLandmarks, which
// still feed normalize.js/signClassifier.js completely unchanged — sign
// recognition accuracy is unaffected either way.
//
// MediaPipe Pose landmark indices (BlazePose topology).
const LEFT_SHOULDER = 11
const RIGHT_SHOULDER = 12
const LEFT_HIP = 23
const RIGHT_HIP = 24
const LEFT_KNEE = 25
const RIGHT_KNEE = 26
const LEFT_ANKLE = 27
const RIGHT_ANKLE = 28

const DROP_WINDOW_MS = 500 // how fast a drop must happen to count as "sudden"
const DROP_THRESHOLD = 0.22 // normalized (0..1) hip-centroid y increase within the window
const NO_RECOVERY_MS = 1500 // how long the drop must persist to rule out a quick crouch/bend
const RECOVERY_TOLERANCE = 0.08 // how close to pre-drop y counts as "recovered"
const FALL_COOLDOWN_MS = 30000 // don't re-fire on the same fall
const MIN_HIP_VISIBILITY = 0.3 // below this, MediaPipe itself doesn't trust the landmark — treat as noise, not motion (see the near-zero-visibility readings the fake-camera debug session turned up)

function hipVisibilityOk(landmarks) {
  const l = landmarks[LEFT_HIP], r = landmarks[RIGHT_HIP]
  if (!l || !r) return false
  // `visibility` is absent on some MediaPipe builds — default to trusting the
  // landmark rather than discarding real data just because the field is missing.
  const v = ((l.visibility ?? 1) + (r.visibility ?? 1)) / 2
  return v >= MIN_HIP_VISIBILITY
}

// ponytail: thresholds are hand-picked geometry heuristics, not tuned against
// real fall data (none exists) — expect false positives/negatives until
// someone hand-tests by miming a fall in frame. Upgrade path: log (drop
// magnitude, resolved posture) pairs during testing and adjust the constants above.
export function createFallDetector({ onFall }) {
  let history = [] // ring buffer of { t, hipY }
  let state = 'idle' // 'idle' | 'dropped'
  let dropBaselineY = null
  let dropStartedAt = null
  let lastFallFiredAt = 0

  // A sudden hip-Y rise that never "recovers" is ALSO exactly what a normal
  // sit-down at the desk looks like — this app's whole camera setup is
  // someone sitting close to a laptop, so that's not a rare edge case, it's
  // the common case. Firing on drop-and-stay alone would false-positive on
  // ordinary sitting down. Resolve it by checking the CURRENTLY VISIBLE,
  // settled posture: 'lying' confirms an actual fall, 'sitting'/'standing'
  // means they're upright and fine (a controlled sit or recovery).
  function resolveDropLive(now, landmarks) {
    state = 'idle'
    if (now - lastFallFiredAt < FALL_COOLDOWN_MS) return
    const posture = classifyPosture(landmarks)
    if (posture === 'sitting' || posture === 'standing') return // visibly upright and settled — not a fall

    lastFallFiredAt = now
    onFall({ confidence: posture === 'lying' ? 0.85 : 0.7 })
  }

  // Landmarks lost entirely (left the frame) — deliberately NOT posture-
  // gated: the last frame seen right before disappearing is a mid-motion
  // snapshot, not a settled read, and could transiently still look like
  // "standing" a split second before actually collapsing. Losing tracking
  // right after a sudden drop is itself consistent with a real fall (a
  // desk-camera setup makes this plausible), so err toward alerting rather
  // than trusting an unreliable last-known frame to veto it.
  function resolveDropLost(now) {
    state = 'idle'
    if (now - lastFallFiredAt < FALL_COOLDOWN_MS) return
    lastFallFiredAt = now
    onFall({ confidence: 0.6 })
  }

  function update(poseLandmarks, now) {
    if (!poseLandmarks) {
      if (state === 'dropped') {
        if (now - dropStartedAt >= NO_RECOVERY_MS) resolveDropLost(now)
        return
      }
      history = []
      return
    }

    if (!hipVisibilityOk(poseLandmarks)) return // noisy/unreliable frame — ignore rather than let it drive a transition

    const left = poseLandmarks[LEFT_HIP]
    const right = poseLandmarks[RIGHT_HIP]
    const hipY = (left.y + right.y) / 2

    if (state === 'idle') {
      history.push({ t: now, hipY })
      while (history.length && now - history[0].t > DROP_WINDOW_MS) history.shift()
      if (history.length < 2) return
      const baseline = history[0].hipY
      if (hipY - baseline >= DROP_THRESHOLD) {
        state = 'dropped'
        dropBaselineY = baseline
        dropStartedAt = now
      }
      return
    }

    // state === 'dropped'
    const recovered = hipY - dropBaselineY < RECOVERY_TOLERANCE
    if (recovered) {
      state = 'idle'
      history = []
      return
    }
    if (now - dropStartedAt >= NO_RECOVERY_MS) resolveDropLive(now, poseLandmarks)
  }

  return { update }
}

// --- Batched metrics: gait speed, sit-to-stand, sway, symmetry, freezing-of-
// gait, activity minutes. Reduced into one `metric` payload per batch window
// (createWellnessBatcher.flush()), mirroring how SignChainBuffer reduces many
// per-frame predictions into one alert — not pushed per-frame.
//
// ponytail: sitting/standing/lying is a simple thigh/shank vertical-ratio +
// body-aspect heuristic, not a trained pose classifier, and gait
// speed/symmetry assume the camera can see legs walking — a laptop "mirror"
// aimed at someone seated close to the screen may rarely satisfy that. These
// are honest best-effort numbers, not validated ones (see plan's risk list).
// Upgrade path: if framing turns out to reliably show full body, tighten
// thresholds against recorded real sessions instead of guesses.

const WALK_SPEED_THRESHOLD = 0.015 // normalized units/frame hip displacement counted as "walking"
const FREEZE_MIN_MS = 800 // how long speed must stay ~0 after walking to count as a freeze
const STAND_TRANSITION_MAX_MS = 4000 // sit->stand must complete within this to count as one transition
const SWAY_SAMPLE_CAP = 1200 // ~80s at 15fps — bounds memory, sway is a short-window statistic anyway

export function classifyPosture(landmarks) {
  const ls = landmarks[LEFT_SHOULDER], rs = landmarks[RIGHT_SHOULDER]
  const lh = landmarks[LEFT_HIP], rh = landmarks[RIGHT_HIP]
  const lk = landmarks[LEFT_KNEE], rk = landmarks[RIGHT_KNEE]
  const la = landmarks[LEFT_ANKLE], ra = landmarks[RIGHT_ANKLE]
  if (!ls || !rs || !lh || !rh || !lk || !rk || !la || !ra) return null

  const shoulderY = (ls.y + rs.y) / 2
  const hipY = (lh.y + rh.y) / 2
  const kneeY = (lk.y + rk.y) / 2
  const ankleY = (la.y + ra.y) / 2

  const verticalSpan = Math.abs(ankleY - shoulderY)
  const horizontalSpan = Math.max(ls.x, rs.x, lh.x, rh.x, la.x, ra.x) - Math.min(ls.x, rs.x, lh.x, rh.x, la.x, ra.x)
  if (verticalSpan < horizontalSpan * 0.6) return 'lying' // body reads wider than tall

  const thighSpan = Math.abs(kneeY - hipY)
  const shankSpan = Math.abs(ankleY - kneeY) || 0.001
  return thighSpan / shankSpan < 0.55 ? 'sitting' : 'standing'
}

export function createWellnessBatcher() {
  let windowStart = Date.now()
  let lastSample = null // { t, hipCentroid: {x,y} }

  let gaitDistanceSum = 0
  let gaitTimeMs = 0

  const swaySamplesX = []

  let leftAnkleMin = Infinity, leftAnkleMax = -Infinity
  let rightAnkleMin = Infinity, rightAnkleMax = -Infinity

  let freezeEventsCount = 0
  let wasWalking = false
  let freezeStartedAt = null

  let postureMsByState = { sitting: 0, standing: 0, lying: 0 }
  let lastPosture = null
  let lastPostureAt = null

  let standTransitionStartedAt = null
  const sitToStandDurations = []

  function reset() {
    windowStart = Date.now()
    lastSample = null
    gaitDistanceSum = 0
    gaitTimeMs = 0
    swaySamplesX.length = 0
    leftAnkleMin = Infinity; leftAnkleMax = -Infinity
    rightAnkleMin = Infinity; rightAnkleMax = -Infinity
    freezeEventsCount = 0
    wasWalking = false
    freezeStartedAt = null
    postureMsByState = { sitting: 0, standing: 0, lying: 0 }
    lastPosture = null
    lastPostureAt = null
    standTransitionStartedAt = null
    sitToStandDurations.length = 0
  }

  function update(poseLandmarks, now) {
    if (!poseLandmarks) return
    const lh = poseLandmarks[LEFT_HIP], rh = poseLandmarks[RIGHT_HIP]
    if (!lh || !rh) return
    const hipCentroid = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 }

    // Gait speed: frame-to-frame hip displacement / elapsed time.
    if (lastSample) {
      const dt = now - lastSample.t
      if (dt > 0) {
        const dx = hipCentroid.x - lastSample.hipCentroid.x
        const dy = hipCentroid.y - lastSample.hipCentroid.y
        const dist = Math.hypot(dx, dy)
        gaitDistanceSum += dist
        gaitTimeMs += dt

        const speedPerFrame = dist // proxy for instantaneous speed; fine given frames arrive at a roughly steady rate
        const walkingNow = speedPerFrame >= WALK_SPEED_THRESHOLD

        if (walkingNow) {
          wasWalking = true
          freezeStartedAt = null
        } else if (wasWalking) {
          if (freezeStartedAt === null) freezeStartedAt = now
          else if (now - freezeStartedAt >= FREEZE_MIN_MS) {
            freezeEventsCount += 1
            wasWalking = false
            freezeStartedAt = null
          }
        }
      }
    }
    lastSample = { t: now, hipCentroid }

    // Postural sway: lateral hip-centroid spread over the window.
    swaySamplesX.push(hipCentroid.x)
    if (swaySamplesX.length > SWAY_SAMPLE_CAP) swaySamplesX.shift()

    // Gait symmetry: left vs right ankle vertical amplitude while walking.
    const la = poseLandmarks[LEFT_ANKLE], ra = poseLandmarks[RIGHT_ANKLE]
    if (la && ra) {
      leftAnkleMin = Math.min(leftAnkleMin, la.y); leftAnkleMax = Math.max(leftAnkleMax, la.y)
      rightAnkleMin = Math.min(rightAnkleMin, ra.y); rightAnkleMax = Math.max(rightAnkleMax, ra.y)
    }

    // Activity + sit-to-stand.
    const posture = classifyPosture(poseLandmarks)
    if (posture && lastPostureAt !== null) {
      postureMsByState[posture] += now - lastPostureAt
    }
    if (posture === 'standing' && lastPosture === 'sitting') {
      standTransitionStartedAt = lastPostureAt
    }
    if (posture === 'standing' && standTransitionStartedAt !== null) {
      const duration = now - standTransitionStartedAt
      if (duration <= STAND_TRANSITION_MAX_MS) sitToStandDurations.push(duration)
      standTransitionStartedAt = null
    } else if (posture === 'sitting') {
      standTransitionStartedAt = null
    }
    if (posture) {
      lastPosture = posture
      lastPostureAt = now
    }
  }

  function mean(arr) {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  }

  function stdDev(arr) {
    if (arr.length < 2) return null
    const m = mean(arr)
    return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length)
  }

  // Returns a metric batch payload and resets accumulators for the next window.
  function flush(now = Date.now()) {
    const leftAmp = leftAnkleMax - leftAnkleMin
    const rightAmp = rightAnkleMax - rightAnkleMin
    const hasSymmetryData = Number.isFinite(leftAmp) && Number.isFinite(rightAmp) && Math.max(leftAmp, rightAmp) > 0.01

    const batch = {
      windowStart,
      windowEnd: now,
      gaitSpeedAvg: gaitTimeMs > 0 ? gaitDistanceSum / (gaitTimeMs / 1000) : null,
      sitToStandMs: mean(sitToStandDurations),
      swayScore: stdDev(swaySamplesX),
      symmetryScore: hasSymmetryData ? Math.min(leftAmp, rightAmp) / Math.max(leftAmp, rightAmp) : null,
      freezeEventsCount,
      sittingMinutes: postureMsByState.sitting / 60000,
      standingMinutes: postureMsByState.standing / 60000,
      lyingMinutes: postureMsByState.lying / 60000,
    }

    reset()
    return batch
  }

  return { update, flush }
}
