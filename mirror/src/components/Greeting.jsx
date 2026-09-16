import { useEffect, useState } from 'react'

const GREETINGS = [
  { hour: 5, text: 'Good morning' },
  { hour: 12, text: 'Good afternoon' },
  { hour: 17, text: 'Good evening' },
  { hour: 21, text: 'Good night' },
]

function greetingForHour(hour) {
  let current = GREETINGS[0]
  for (const g of GREETINGS) {
    if (hour >= g.hour) current = g
  }
  return current
}

export default function Greeting() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const greeting = greetingForHour(now.getHours())
  const time = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  const day = now.toLocaleDateString('en-IN', { weekday: 'long' })

  return (
    <div>
      <h1 className="font-serif text-[32px] text-wine">{greeting.text}</h1>
      <p className="text-rose-deep text-sm mt-1">{day} · {time}</p>
    </div>
  )
}
