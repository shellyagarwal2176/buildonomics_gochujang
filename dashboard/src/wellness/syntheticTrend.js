// SYNTHETIC DATA — not real wellness detection.
//
// Per the Phase 2 PRD: no public dataset exists that tracks one person's
// gait/mobility decline over months, so this generator stands in for real
// pose-derived metrics with a parametric model (gentle trend + noise) purely
// so the Health Graph / Drift Cards / Predictions UI has something realistic
// to render and a trend/changepoint algorithm has something to detect later.
//
// This file must never be wired to mirror/src/wellness/ or real pose
// landmarks — that's a separate, later pass once real footage exists to
// validate detection thresholds against.

const DAY_MS = 24 * 60 * 60 * 1000

// Deterministic PRNG (mulberry32) so the demo renders the same "history"
// every load instead of re-rolling a new decline curve on every refresh.
function mulberry32(seed) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lerp(from, to, t) {
  return from + (to - from) * t
}

// Exponentially-smoothed noise instead of pure white noise, so consecutive
// days drift together a bit (closer to how a real biological signal
// behaves) rather than jittering independently every day.
function makeSmoothedNoise(random, amplitude, smoothing = 0.7) {
  let state = 0
  return () => {
    state = state * smoothing + (random() * 2 - 1) * (1 - smoothing)
    return state * amplitude
  }
}

const DEFAULT_DAYS = 60
const DEFAULT_SEED = 20260101

/**
 * Generates `days` of synthetic daily aggregated wellness metrics for one
 * person, oldest day first, most recent day last.
 *
 * Trend design (see PRD "Phase 2 — Wellness Monitoring"):
 *  - walkingSpeed drifts DOWN ~20% over the window (decline example)
 *  - sitToStandMs drifts UP ~30% over the window (decline example)
 *  - postureSway drifts DOWN ~45% over the window (improvement example —
 *    the PRD explicitly wants a positive Drift Card, not only alarms)
 *  - activityMinutes redistributes slightly toward lying/sitting over time
 *
 * All four series carry day-to-day noise on top of the trend line so a
 * changepoint/trend detector has real variance to work against later.
 */
export function generateSyntheticTrend({ days = DEFAULT_DAYS, seed = DEFAULT_SEED } = {}) {
  const random = mulberry32(seed)
  const walkingSpeedNoise = makeSmoothedNoise(random, 0.045)
  const sitToStandNoise = makeSmoothedNoise(random, 90)
  const postureSwayNoise = makeSmoothedNoise(random, 0.02)
  const activityNoise = makeSmoothedNoise(random, 25)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const out = []
  for (let day = 0; day < days; day++) {
    const t = days === 1 ? 1 : day / (days - 1) // 0 at oldest, 1 at most recent

    const walkingSpeed = Math.max(0.4, lerp(1.25, 1.0, t) + walkingSpeedNoise())
    const sitToStandMs = Math.max(600, lerp(1350, 1750, t) + sitToStandNoise())
    const postureSway = Math.min(1, Math.max(0, lerp(0.42, 0.22, t) + postureSwayNoise()))

    // Minutes across a 1440-minute day. Sitting creeps up, standing eases
    // down, lying ticks up slightly — a plausible "more time resting"
    // pattern, kept normalized so the three always sum to a full day.
    const standing = Math.max(60, lerp(310, 230, t) + activityNoise())
    const lying = Math.max(360, lerp(600, 660, t) + activityNoise() * 0.6)
    const sitting = Math.max(0, 1440 - standing - lying)

    const date = new Date(today.getTime() - (days - 1 - day) * DAY_MS)

    out.push({
      day,
      date: date.toISOString().slice(0, 10),
      timestamp: date.getTime(),
      walkingSpeed,
      sitToStandMs,
      postureSway,
      activityMinutes: { sitting, standing, lying },
    })
  }

  return out
}
