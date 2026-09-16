import { useEffect } from 'react'

const VISIBLE_MS = 2500

// Confirms the sentence-level alert actually went out — fires whenever a
// sentence is sent, whether by "Done", the inactivity timeout, or the
// safety cap (see signChain.js). Separate from WordConfirmedFlash, which
// fires per single word, well before a sentence is complete.
export default function MessageSentToast({ event, onDone }) {
  useEffect(() => {
    if (!event) return
    const timer = setTimeout(onDone, VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [event, onDone])

  if (!event) return null

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] animate-[fadeIn_.15s_ease-out]">
      <div className="bg-sage-deep text-white rounded-2xl px-5 py-3 shadow-[0_10px_28px_rgba(79,122,87,0.35)] flex items-center gap-2.5">
        <span aria-hidden>✓</span>
        <div>
          <p className="text-sm font-bold">Message sent to family</p>
          <p className="font-serif text-[13px] opacity-90">"{event.label}"</p>
        </div>
      </div>
    </div>
  )
}
