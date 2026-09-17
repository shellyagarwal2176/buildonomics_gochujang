import { useMemo, useState } from 'react'
import { METRICS, captionFor, normalRange } from '../wellness/driftAnalysis.js'

const ZOOM_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 60, label: '60 days' },
]

const CHART_WIDTH = 640
const CHART_HEIGHT = 200
const PAD_X = 10
const PAD_Y = 16

function scaleX(i, count) {
  if (count <= 1) return PAD_X
  return PAD_X + (i * (CHART_WIDTH - PAD_X * 2)) / (count - 1)
}

function scaleY(value, min, max) {
  const range = max - min || 1
  return CHART_HEIGHT - PAD_Y - ((value - min) / range) * (CHART_HEIGHT - PAD_Y * 2)
}

function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

// Single-metric line + shaded "normal range" band. The band comes from the
// full-history baseline (driftAnalysis.normalRange), not the zoomed window,
// so it doesn't jump around when the zoom tabs change.
function LineChart({ windowData, metricKey, band }) {
  const values = windowData.map((d) => d[metricKey])
  const domainMin = Math.min(...values, band.min)
  const domainMax = Math.max(...values, band.max)
  const pad = (domainMax - domainMin) * 0.1 || 1
  const min = domainMin - pad
  const max = domainMax + pad

  const linePath = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i, values.length).toFixed(1)} ${scaleY(v, min, max).toFixed(1)}`)
    .join(' ')

  const bandTop = scaleY(band.max, min, max)
  const bandBottom = scaleY(band.min, min, max)

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-[180px]" preserveAspectRatio="none">
      <rect
        x={PAD_X}
        y={bandTop}
        width={CHART_WIDTH - PAD_X * 2}
        height={Math.max(bandBottom - bandTop, 1)}
        fill="var(--color-sage)"
        opacity="0.18"
        rx="6"
      />
      <path d={linePath} fill="none" stroke="var(--color-rose)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {values.length <= 60 &&
        values.map((v, i) => (
          <circle
            key={windowData[i].date}
            cx={scaleX(i, values.length)}
            cy={scaleY(v, min, max)}
            r={values.length > 30 ? 0 : 2.5}
            fill="var(--color-rose-deep)"
          />
        ))}
    </svg>
  )
}

// Activity pattern as a stacked area (percent of day), since it's three
// series that should always read as summing to one full day.
function StackedActivityChart({ windowData }) {
  const n = windowData.length
  const pct = (mins) => (mins / 1440) * 100

  const sittingTop = windowData.map((d) => pct(d.activityMinutes.sitting))
  const standingTop = windowData.map((d, i) => sittingTop[i] + pct(d.activityMinutes.standing))
  const lyingTop = windowData.map((d, i) => standingTop[i] + pct(d.activityMinutes.lying))

  const min = 0
  const max = 100

  // Walk the top series left-to-right, then the bottom series right-to-left,
  // so the closed path traces the band's outline without self-crossing.
  function areaPath(topSeries, bottomSeries) {
    const topPts = topSeries.map((v, i) => [scaleX(i, n), scaleY(v, min, max)])
    const bottomPts = bottomSeries.map((v, i) => [scaleX(i, n), scaleY(v, min, max)]).reverse()
    return [...topPts, ...bottomPts]
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
      .concat('Z')
      .join(' ')
  }

  const zero = new Array(n).fill(0)

  return (
    <>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-[180px]" preserveAspectRatio="none">
        <path d={areaPath(sittingTop, zero)} fill="var(--color-amber)" opacity="0.55" />
        <path d={areaPath(standingTop, sittingTop)} fill="var(--color-sage-deep)" opacity="0.6" />
        <path d={areaPath(lyingTop, standingTop)} fill="var(--color-rose-deep)" opacity="0.5" />
      </svg>
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        {[
          ['Sitting', 'var(--color-amber)'],
          ['Standing', 'var(--color-sage-deep)'],
          ['Lying', 'var(--color-rose-deep)'],
        ].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </>
  )
}

function activityCaption(windowData) {
  const first = windowData[0].activityMinutes
  const last = windowData[windowData.length - 1].activityMinutes
  const lyingDelta = last.lying - first.lying
  if (lyingDelta > 30) {
    return "she's been resting a little more during the day than she used to"
  }
  if (lyingDelta < -30) {
    return "she's been up and about a little more during the day than usual"
  }
  return 'her daily activity pattern has been steady'
}

export default function HealthGraph({ data }) {
  const [metricKey, setMetricKey] = useState('walkingSpeed')
  const [zoomDays, setZoomDays] = useState(30)

  const windowData = useMemo(() => data.slice(-zoomDays), [data, zoomDays])
  const band = useMemo(() => normalRange(data, metricKey === 'activityMinutes' ? 'walkingSpeed' : metricKey), [data, metricKey])

  const caption = metricKey === 'activityMinutes' ? activityCaption(windowData) : captionFor(windowData, metricKey)

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_28px_rgba(92,30,46,0.12)]">
      <h2 className="font-serif text-lg text-wine mb-3.5">Health graph</h2>

      <div className="flex gap-1.5 flex-wrap mb-3">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetricKey(m.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              metricKey === m.key ? 'bg-rose text-white' : 'bg-cream-2 text-wine'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-[14px] font-serif italic text-wine mb-3">"{caption}"</p>

      {metricKey === 'activityMinutes' ? (
        <StackedActivityChart windowData={windowData} />
      ) : (
        <LineChart windowData={windowData} metricKey={metricKey} band={band} />
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted">{formatShortDate(windowData[0].date)}</span>
        <span className="text-xs text-muted">{formatShortDate(windowData[windowData.length - 1].date)}</span>
      </div>

      <div className="flex gap-1.5 mt-4">
        {ZOOM_OPTIONS.map((z) => (
          <button
            key={z.days}
            type="button"
            onClick={() => setZoomDays(z.days)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
              zoomDays === z.days ? 'border-rose text-rose-deep bg-cream-2' : 'border-line text-muted'
            }`}
          >
            {z.label}
          </button>
        ))}
      </div>
    </div>
  )
}
