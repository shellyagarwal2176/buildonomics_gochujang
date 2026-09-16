const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ConfidenceRing({ confidence = 0, holdingSign }) {
  const offset = CIRCUMFERENCE * (1 - confidence)

  return (
    <div className="flex items-center gap-3.5 justify-center">
      <svg viewBox="0 0 120 120" className="w-[68px] h-[68px] shrink-0">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--color-cream-3)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="var(--color-rose)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 60ms linear' }}
        />
      </svg>
      <p className="text-[13px] text-muted">
        {holdingSign ? 'Holding sign' : 'Watching for a sign'}
        {holdingSign && (
          <span className="block font-serif text-base text-wine mt-0.5">{holdingSign}</span>
        )}
      </p>
    </div>
  )
}
