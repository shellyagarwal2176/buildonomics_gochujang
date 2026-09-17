// Renders Drift Cards for the synthetic-data Wellness screen — plain-
// language sentences derived from SYNTHETIC wellness data (see
// dashboard/src/wellness/). Never a diagnosis, never a score: just a
// sentence, a timestamp, and a way to flag it to her doctor.
//
// Distinct from ./DriftCards.jsx, which renders the REAL, server-backed
// drift cards (ml/src/detect_drift.py) inline on the main guardian screen.
// This component only ever appears inside WellnessScreen's synthetic
// preview — see its "Preview data" banner — so the two are never shown
// side by side without that disclaimer.

const KIND_STYLE = {
  concern: 'border-amber/40 bg-cream-2',
  positive: 'border-sage-deep/30 bg-cream-2',
}

const KIND_DOT = {
  concern: 'bg-amber',
  positive: 'bg-sage-deep',
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export default function WellnessDriftCards({ cards, mentionedIds, onMentionToDoctor }) {
  if (cards.length === 0) {
    return (
      <p className="text-[13px] text-muted italic">
        Nothing notable to flag yet — check back as more days come in.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {cards.map((card) => {
        const mentioned = mentionedIds?.has(card.id)
        return (
          <div key={card.id} className={`rounded-2xl border px-4 py-3.5 ${KIND_STYLE[card.kind]}`}>
            <div className="flex items-start gap-2.5">
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${KIND_DOT[card.kind]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] text-ink leading-snug">{card.message}</p>
                <div className="flex items-center justify-between gap-3 mt-2.5">
                  <p className="text-xs text-muted">{formatDate(card.timestamp)}</p>
                  <button
                    type="button"
                    disabled={mentioned}
                    onClick={() => onMentionToDoctor?.(card)}
                    className={`text-xs font-semibold shrink-0 ${
                      mentioned ? 'text-sage-deep' : 'text-rose-deep underline'
                    }`}
                  >
                    {mentioned ? 'Mentioned ✓' : 'Mention to her doctor'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
