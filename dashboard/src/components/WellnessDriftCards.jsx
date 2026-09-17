// Shared Drift Cards renderer — plain-language sentences, never a diagnosis,
// never a score. Used both on the main guardian screen (real cards, fed by
// server/src/db.js via useDriftCards + realDriftCards.js's adapter) and
// inside WellnessScreen (synthetic cards from wellness/driftAnalysis.js, or
// real cards via the same adapter once enough real data exists). `onDismiss`
// is optional — pass it for the guardian screen's dismiss affordance; omit
// it where dismissal isn't a concept (e.g. WellnessScreen's synthetic
// preview). `onMentionToDoctor` is likewise optional.

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

export default function WellnessDriftCards({
  cards,
  mentionedIds,
  onMentionToDoctor,
  onDismiss,
  title = 'Noticed lately',
}) {
  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_28px_rgba(92,30,46,0.12)]">
      <h2 className="font-serif text-lg text-wine mb-3.5">{title}</h2>
      {!cards || cards.length === 0 ? (
        <div className="flex items-start gap-2.5 bg-cream-2 border border-sage-deep/30 rounded-2xl px-3.5 py-2.5">
          <span className="mt-1.5 w-2 h-2 rounded-full bg-sage-deep shrink-0" />
          <p className="flex-1 text-[13px] text-wine leading-relaxed">
            No changes to report — everything's looking steady lately.
          </p>
        </div>
      ) : (
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
                      <div className="flex items-center gap-3 shrink-0">
                        {onMentionToDoctor && (
                          <button
                            type="button"
                            disabled={mentioned}
                            onClick={() => onMentionToDoctor(card)}
                            className={`text-xs font-semibold ${
                              mentioned ? 'text-sage-deep' : 'text-rose-deep underline'
                            }`}
                          >
                            {mentioned ? 'Mentioned ✓' : 'Mention to her doctor'}
                          </button>
                        )}
                        {onDismiss && (
                          <button
                            type="button"
                            onClick={() => onDismiss(card.id)}
                            className="text-muted text-xs"
                            aria-label="Dismiss"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
