import { useMemo, useState } from 'react'
import HealthGraph from './HealthGraph.jsx'
import WellnessDriftCards from './WellnessDriftCards.jsx'
import Predictions from './Predictions.jsx'
import { useWellnessTrend } from '../hooks/useWellnessTrend.js'
import { useDriftCards } from '../hooks/useDriftCards.js'
import { getDriftCards } from '../wellness/driftAnalysis.js'
import { adaptRealDriftCard } from '../wellness/realDriftCards.js'

const TABS = [
  { key: 'graph', label: 'Health graph' },
  { key: 'predictions', label: 'Predictions' },
]

// Container for the Phase 2 wellness UI. Reads SYNTHETIC data until at least
// a week of real data has come in through the mirror's webcam pipeline (see
// useWellnessTrend.js), then switches over automatically — no manual toggle.
export default function WellnessScreen({ onBack }) {
  const [tab, setTab] = useState('graph')
  const [mentionedIds, setMentionedIds] = useState(() => new Set())

  const { data, isSynthetic } = useWellnessTrend()
  const { cards: realCards } = useDriftCards()
  const driftCards = useMemo(
    () => (isSynthetic ? getDriftCards(data) : realCards.map(adaptRealDriftCard)),
    [isSynthetic, data, realCards]
  )

  const handleMention = (card) => {
    setMentionedIds((prev) => new Set(prev).add(card.id))
  }

  return (
    <div>
      <div className="flex justify-between items-start gap-4 flex-wrap mb-5">
        <div>
          <p className="text-rose text-[13px] font-semibold uppercase tracking-wide mb-1">
            Family view · Wellness
          </p>
          <h1 className="font-serif text-[32px] text-wine">How she's doing, over time</h1>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold px-3.5 py-2 rounded-full bg-cream-2 text-wine"
        >
          ← Back to today
        </button>
      </div>

      {isSynthetic && (
        <p className="text-xs text-muted italic mb-5">
          Preview data — this screen shows synthetic sample trends, not live readings from her
          mirror yet.
        </p>
      )}

      <div className="flex gap-1.5 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`text-[13px] font-semibold px-4 py-2 rounded-full ${
              tab === t.key ? 'bg-rose text-white' : 'bg-cream-2 text-wine'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'graph' ? (
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-7">
          <HealthGraph data={data} />
          <WellnessDriftCards
            title="Drift cards"
            cards={driftCards}
            mentionedIds={mentionedIds}
            onMentionToDoctor={handleMention}
          />
        </div>
      ) : (
        <Predictions data={data} />
      )}
    </div>
  )
}
