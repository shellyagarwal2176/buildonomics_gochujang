// Reads the SYNTHETIC data from syntheticTrend.js into the plain-language
// output the UI renders (Drift Cards, Predictions paragraph, normal-range
// bands). This is intentionally kept separate from the generator: once real
// pose-derived metrics exist, this file's inputs change but its shape
// (data in, plain language out) doesn't have to.

export const METRICS = [
  {
    key: 'walkingSpeed',
    label: 'Walking speed',
    unit: 'torso-lengths/sec',
    // Lower is the concerning direction for this metric.
    goodDirection: 'up',
    format: (v) => v.toFixed(2),
  },
  {
    key: 'sitToStandMs',
    label: 'Sit-to-stand',
    unit: 'ms',
    // Higher (slower) is the concerning direction for this metric.
    goodDirection: 'down',
    format: (v) => `${Math.round(v)}`,
  },
  {
    key: 'postureSway',
    label: 'Sway',
    unit: 'relative',
    // Lower sway is steadier balance — the concerning direction is up.
    goodDirection: 'down',
    format: (v) => v.toFixed(2),
  },
  {
    key: 'activityMinutes',
    label: 'Activity pattern',
    unit: 'minutes',
    goodDirection: null,
    format: null,
  },
]

function average(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

// Compares an early baseline window against the most recent window so a
// short-term blip doesn't read as a trend the way a two-point comparison
// would.
export function pctChange(data, key, { baselineDays = 14, recentDays = 7 } = {}) {
  const baseline = average(data.slice(0, baselineDays).map((d) => d[key]))
  const recent = average(data.slice(-recentDays).map((d) => d[key]))
  const pct = ((recent - baseline) / baseline) * 100
  return { baseline, recent, pct }
}

// Fixed "normal" reference band derived from the earliest baseline period,
// independent of whatever zoom window (7/30/60 days) the chart is currently
// showing — the band shouldn't jump around as the user changes zoom.
export function normalRange(data, key, { baselineDays = 14, tolerance = 0.12 } = {}) {
  const baselineValues = data.slice(0, baselineDays).map((d) => d[key])
  const mean = average(baselineValues)
  const spread = Math.max(mean * tolerance, 0.001)
  return { min: mean - spread, max: mean + spread }
}

function describeChange(metricKey, pct) {
  const abs = Math.abs(Math.round(pct))
  switch (metricKey) {
    case 'walkingSpeed':
      return pct < 0
        ? `she's been walking about ${abs}% slower than usual`
        : `she's been walking about ${abs}% faster than usual`
    case 'sitToStandMs':
      return pct > 0
        ? `getting up from sitting is taking about ${abs}% longer than usual`
        : `getting up from sitting is about ${abs}% quicker than usual`
    case 'postureSway':
      return pct < 0
        ? `her balance looks about ${abs}% steadier than a few weeks ago`
        : `there's about ${abs}% more sway than a few weeks ago`
    default:
      return `${metricKey} changed by ${abs}%`
  }
}

// One plain-language caption per metric, for the currently visible window —
// this is the "headline" the PRD wants instead of a raw number.
export function captionFor(data, key) {
  const { pct } = pctChange(data, key)
  if (Math.abs(pct) < 3) {
    return "she's been steady lately — no meaningful change"
  }
  return describeChange(key, pct)
}

const CONCERN_THRESHOLD_PCT = 5

// Returns Drift Cards: plain-language sentences, never a score or diagnosis.
// By construction the synthetic generator declines walkingSpeed/sitToStandMs
// and improves postureSway, so this reliably surfaces both a "slowing"
// example and an "improving" example, per the PRD.
export function getDriftCards(data) {
  const latest = data[data.length - 1]
  const cards = []

  const walk = pctChange(data, 'walkingSpeed')
  if (walk.pct <= -CONCERN_THRESHOLD_PCT) {
    cards.push({
      id: 'walking-speed-slowing',
      kind: 'concern',
      metricKey: 'walkingSpeed',
      message: `Walking has slowed about ${Math.abs(Math.round(walk.pct))}% over the past 5 weeks.`,
      timestamp: latest.timestamp,
    })
  }

  const sway = pctChange(data, 'postureSway')
  if (sway.pct <= -CONCERN_THRESHOLD_PCT) {
    cards.push({
      id: 'posture-sway-improving',
      kind: 'positive',
      metricKey: 'postureSway',
      message: `Good news — balance looks steadier lately, sway is down about ${Math.abs(Math.round(sway.pct))}% from a few weeks ago.`,
      timestamp: latest.timestamp,
    })
  }

  const sitToStand = pctChange(data, 'sitToStandMs')
  if (sitToStand.pct >= CONCERN_THRESHOLD_PCT) {
    cards.push({
      id: 'sit-to-stand-slowing',
      kind: 'concern',
      metricKey: 'sitToStandMs',
      message: `Getting up from a chair is taking a bit longer than it used to — about ${Math.round(sitToStand.pct)}% more time.`,
      timestamp: latest.timestamp,
    })
  }

  return cards
}

// Plain-language paragraphs for the Predictions page. Always closes with
// the required disclaimer — never a diagnosis, never a score.
export function getPredictionSummary(data) {
  const walk = pctChange(data, 'walkingSpeed')
  const sitToStand = pctChange(data, 'sitToStandMs')

  const paragraphs = [
    `Over the past two months, walking speed has eased down by about ${Math.abs(Math.round(walk.pct))}%, and getting up from a chair takes roughly ${Math.round(sitToStand.pct)}% longer than it did at the start.`,
    `Balance has actually held steady or improved a little over the same period, which is a good sign.`,
    `Together, a slower walk paired with a slower sit-to-stand can sometimes point toward hip or knee stiffness, or general muscle fatigue.`,
    `This is a pattern, not a diagnosis. Share it with her doctor.`,
  ]

  return { paragraphs, highlightArea: 'hips' }
}
