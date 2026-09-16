import { useEffect, useState } from 'react'

const GREETINGS = [
  { hour: 5, tamil: 'வணக்கம்', text: 'Good morning, Amma' },
  { hour: 12, tamil: 'வணக்கம்', text: 'Good afternoon, Amma' },
  { hour: 17, tamil: 'வணக்கம்', text: 'Good evening, Amma' },
  { hour: 21, tamil: 'இரவு வணக்கம்', text: 'Good night, Amma' },
]

function greetingForHour(hour) {
  let current = GREETINGS[0]
  for (const g of GREETINGS) {
    if (hour >= g.hour) current = g
  }
  return current
}

export default function Greeting({ wellnessOn, onToggleWellness }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const greeting = greetingForHour(now.getHours())
  const time = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  const day = now.toLocaleDateString('en-IN', { weekday: 'long' })

  return (
    <div className="flex items-start justify-between gap-5">
      <div>
        <p className="font-dev text-rose text-[15px] mb-1">{greeting.tamil}</p>
        <h1 className="font-serif text-[32px] text-wine">{greeting.text}</h1>
        <p className="text-rose-deep text-sm mt-1">{day} · {time}</p>
      </div>

      <button
        type="button"
        onClick={onToggleWellness}
        className="flex items-center gap-2 bg-white/60 border border-line px-3.5 py-2 rounded-full text-xs font-semibold text-rose-deep"
        title="Tap to preview turning this off — in the real product, she signs to do this."
      >
        <span
          className={`w-2 h-2 rounded-full ${wellnessOn ? 'bg-sage-deep animate-dot-glow' : 'bg-line'}`}
        />
        Wellness tracking is {wellnessOn ? 'on' : 'off'}
      </button>
    </div>
  )
}
