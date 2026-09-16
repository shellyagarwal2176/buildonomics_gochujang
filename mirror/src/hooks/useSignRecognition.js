import { useEffect, useRef, useState } from 'react'

/*
  MOCK recognition loop — replace with the real pipeline once ml/ is ready.

  Real contract (CLAUDE.md): a fixed-shape landmark array goes in,
  { sign, confidence } comes out, on a sliding window over live camera frames.
  This hook fakes that timing so the rest of the UI (ring fill, chaining,
  alert dispatch) can be built and demoed before the classifier exists —
  swap the body of runCycle() for the real recognizer and every component
  downstream keeps working unchanged.

  DEMO_SCRIPT below is illustrative: cycles through single signs and one
  chained pair (HEAD + PAIN -> headache) the way the real chaining logic
  (2-3 confirmed signs in a short window -> one intent) will behave.
*/
const DEMO_SCRIPT = [
  { signs: ['WATER'], intent: 'water', label: 'water' },
  { signs: ['HEAD', 'PAIN'], intent: 'pain', label: 'headache' },
  { signs: ['MEDICINE'], intent: 'medicine', label: 'medicine' },
  { signs: ['TIRED'], intent: 'tired', label: 'tired' },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function useSignRecognition({ onIntentConfirmed } = {}) {
  const [inFrame] = useState(true)
  const [confidence, setConfidence] = useState(0)
  const [holdingSign, setHoldingSign] = useState(null)
  const scriptIndex = useRef(0)
  const callbackRef = useRef(onIntentConfirmed)

  useEffect(() => {
    callbackRef.current = onIntentConfirmed
  }, [onIntentConfirmed])

  useEffect(() => {
    let cancelled = false

    async function runCycle() {
      const step = DEMO_SCRIPT[scriptIndex.current % DEMO_SCRIPT.length]
      scriptIndex.current += 1

      for (const sign of step.signs) {
        if (cancelled) return
        setHoldingSign(sign)
        for (let c = 0; c <= 1; c += 0.04) {
          if (cancelled) return
          setConfidence(Math.min(c, 1))
          await sleep(55)
        }
        await sleep(280)
      }

      if (!cancelled) {
        callbackRef.current?.(step)
        setHoldingSign(null)
        setConfidence(0)
      }

      await sleep(2800)
      if (!cancelled) runCycle()
    }

    const startTimer = setTimeout(runCycle, 1100)
    return () => {
      cancelled = true
      clearTimeout(startTimer)
    }
  }, [])

  return { inFrame, confidence, holdingSign }
}
