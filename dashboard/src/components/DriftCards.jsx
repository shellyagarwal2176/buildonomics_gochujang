// Plain-language wellness trend cards only — enforced by construction, since
// this component only ever receives { id, message } pairs from the server
// (see ml/src/detect_drift.py's fixed template lookup), never raw metric
// values, so there's nothing here to accidentally chart. Never shown to the
// elder's mirror app, per CLAUDE.md's Phase 2 rule — dashboard/ only.
export default function DriftCards({ cards, onDismiss }) {
  if (cards.length === 0) return null

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_28px_rgba(92,30,46,0.12)]">
      <h2 className="font-serif text-lg text-wine mb-3.5">Noticed lately</h2>
      <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
        {cards.map((card) => (
          <li
            key={card.id}
            className="flex items-start gap-2.5 bg-cream-2 border border-line rounded-2xl px-3.5 py-2.5"
          >
            <p className="flex-1 text-[13px] text-wine leading-relaxed">{card.message}</p>
            <button
              onClick={() => onDismiss(card.id)}
              className="text-muted text-xs shrink-0"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
