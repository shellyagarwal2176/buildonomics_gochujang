import { useEffect } from 'react'

const FLASH_MS = 1500

// Immediate per-word feedback, separate from the final sentence alert — fires
// the instant hold-to-confirm locks in a single sign, so Amma gets confirmation
// each word landed while she keeps signing the rest of the sentence.
export default function WordConfirmedFlash({ word, onDone }) {
  useEffect(() => {
    if (!word) return
    const timer = setTimeout(onDone, FLASH_MS)
    return () => clearTimeout(timer)
  }, [word, onDone])

  if (!word) return null

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] animate-[fadeIn_.15s_ease-out]">
      <div className="bg-sage-deep text-white rounded-full px-5 py-2.5 shadow-[0_10px_28px_rgba(79,122,87,0.35)] flex items-center gap-2 text-sm font-bold">
        <span>✓</span>
        <span className="font-serif">"{word}" recognised</span>
      </div>
    </div>
  )
}
