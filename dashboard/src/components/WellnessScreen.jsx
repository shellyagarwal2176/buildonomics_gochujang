import { useMemo, useState } from 'react'
import HealthGraph from './HealthGraph.jsx'
import DriftCards from './DriftCards.jsx'
import Predictions from './Predictions.jsx'
import { generateSyntheticTrend } from '../wellness/syntheticTrend.js'
import { getDriftCards } from '../wellness/driftAnalysis.js'

const TABS = [
  { key: 'graph', label: 'Health graph' },
  { key: 'predictions', label: 'Predictions' },
]

// Container for the Phase 2 wellness UI. Everything here reads SYNTHETIC
// data (see wellness/syntheticTrend.js) — there is no real pose/gait
// pipeline behind this yet, per the PRD's UI-first scope for this pass.
export default function WellnessScreen({ onBack }) {
  const [tab, setTab] = useState('graph')
  const [mentionedIds, setMentionedIds] = useState(() => new Set())

  const data = useMemo(() => generateSyntheticTrend(), [])
  const driftCards = useMemo(() => getDriftCards(data), [data])

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

      <p className="text-xs text-muted italic mb-5">
        Preview data — this screen shows synthetic sample trends, not live readings from her
        mirror yet.
      </p>

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
          <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_28px_rgba(92,30,46,0.12)]">
            <h2 className="font-serif text-lg text-wine mb-3.5">Drift cards</h2>
            <DriftCards cards={driftCards} mentionedIds={mentionedIds} onMentionToDoctor={handleMention} />
          </div>
        </div>
      ) : (
        <Predictions data={data} />
      )}
    </div>
  )
}
