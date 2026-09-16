import { useEffect, useState } from 'react'

// Purely decorative — rotates through a few of the trained words so the page
// doesn't feel static now that the need cards are gone.
const TIPS = ['PAIN', 'HOME', 'DOCTOR', 'THIRSTY', 'HUNGRY', 'HELP']
const ROTATE_MS = 4000

export default function SignHint() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TIPS.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-2.5 bg-white/70 border border-line rounded-full px-4 py-2 text-sm text-rose-deep font-semibold w-fit mx-auto mt-5">
      <span aria-hidden>🖐️</span>
      Try signing <span className="font-serif">{TIPS[index]}</span>
    </div>
  )
}
