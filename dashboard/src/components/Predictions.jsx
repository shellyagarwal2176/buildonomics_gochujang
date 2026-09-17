import { useEffect, useState } from 'react'
import { getPredictionSummary } from '../wellness/driftAnalysis.js'

// Simple, non-anatomical front-view silhouette. Not a real medical diagram —
// just enough shape to say "roughly here" when pairing with the plain-
// language paragraph below.
function BodySilhouette({ highlightArea }) {
  return (
    <svg viewBox="0 0 120 240" className="w-[120px] h-[240px] mx-auto" aria-hidden="true">
      <circle cx="60" cy="22" r="17" fill="var(--color-peach-deep)" />
      <rect x="38" y="42" width="44" height="68" rx="18" fill="var(--color-peach-deep)" />
      <rect x="20" y="48" width="16" height="58" rx="8" fill="var(--color-peach-deep)" />
      <rect x="84" y="48" width="16" height="58" rx="8" fill="var(--color-peach-deep)" />
      <rect x="42" y="106" width="16" height="112" rx="8" fill="var(--color-peach-deep)" />
      <rect x="62" y="106" width="16" height="112" rx="8" fill="var(--color-peach-deep)" />

      {highlightArea === 'hips' && (
        <>
          <ellipse cx="60" cy="112" rx="32" ry="18" fill="var(--color-rose)" opacity="0.35" className="animate-pulse" />
          <circle cx="50" cy="168" r="12" fill="var(--color-amber)" opacity="0.4" className="animate-pulse" />
          <circle cx="70" cy="168" r="12" fill="var(--color-amber)" opacity="0.4" className="animate-pulse" />
        </>
      )}
    </svg>
  )
}

export default function Predictions({ data }) {
  const { paragraphs, highlightArea } = getPredictionSummary(data)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(false), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_28px_rgba(92,30,46,0.12)] relative">
      <h2 className="font-serif text-lg text-wine mb-3.5">What this might mean</h2>

      <BodySilhouette highlightArea={highlightArea} />

      <div className="mt-5 flex flex-col gap-3">
        {paragraphs.map((p, i) => (
          <p
            key={p.slice(0, 20)}
            className={
              i === paragraphs.length - 1
                ? 'text-[13.5px] font-semibold text-rose-deep'
                : 'text-[13.5px] text-ink leading-relaxed'
            }
          >
            {p}
          </p>
        ))}
      </div>

      <button
        type="button"
        // Stub — no PDF generation yet, just UI feedback. Wire to a real
        // export once there's a summary format the doctor-facing side wants.
        onClick={() => setToast(true)}
        className="w-full mt-5 bg-rose text-white rounded-xl py-2.5 text-[13px] font-bold"
      >
        Download summary for her doctor
      </button>

      {toast && (
        // Fixed to the viewport, not the card — the wellness screen's outer
        // wrapper (App.jsx) is overflow-hidden, which would clip an
        // absolutely-positioned toast anchored to this card instead.
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[150] bg-wine text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-[0_10px_28px_rgba(92,30,46,0.25)] animate-[fadeIn_.2s_ease-out]">
          Summary coming soon — this is a UI preview
        </div>
      )}
    </div>
  )
}
