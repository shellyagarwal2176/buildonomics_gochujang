import { useEffect, useRef, useState } from 'react'
import { loadSignClassifier } from '../ml/signClassifier.js'
import { landmarksToVector } from '../ml/normalize.js'
import { SignChainBuffer } from '../alerts/signChain.js'
import { dispatchAlert } from '../alerts/dispatchAlert.js'
import { socket } from '../lib/socket.js'

// Real recognition loop: webcam -> Holistic (live, per CLAUDE.md an independent
// choice from the offline HandLandmarker extraction — same 21-point hand
// landmark schema either way, so normalize.js/signClassifier.js are unchanged)
// -> per-frame classification -> majority-vote hold-to-confirm -> sign chaining
// -> alert dispatch. The MediaPipe/classifier loop lives entirely in refs, not
// React state — only a throttled ~5Hz snapshot is pushed to state for the UI.

const CONFIRM_WINDOW_FRAMES = 15 // ~1s at ~15fps
const CONFIRM_THRESHOLD = 0.6 // fraction of the window that must agree
const UI_UPDATE_MS = 200 // ~5Hz
const NO_HAND_TIMEOUT_MS = 2000

export function useSignRecognition({ onIntentConfirmed, onWordConfirmed } = {}) {
  const videoRef = useRef(null)
  const [inFrame, setInFrame] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [holdingSign, setHoldingSign] = useState(null)
  const [draftWords, setDraftWords] = useState([])
  const chainRef = useRef(null)

  const callbackRef = useRef(onIntentConfirmed)
  const wordCallbackRef = useRef(onWordConfirmed)
  useEffect(() => {
    callbackRef.current = onIntentConfirmed
    wordCallbackRef.current = onWordConfirmed
  }, [onIntentConfirmed, onWordConfirmed])

  useEffect(() => {
    let cancelled = false
    let camera = null
    let holistic = null
    let lastHandSeenAt = 0
    let lastUiPush = 0
    let confirmedThisHold = false

    const recentPredictions = [] // ring buffer of { label, confidence }, refs-only
    const classifierRef = { current: null }
    const chain = new SignChainBuffer({
      onUpdate: setDraftWords,
      onAlert: (alert) => {
        dispatchAlert(socket, alert)
        callbackRef.current?.(alert)
      },
    })
    chainRef.current = chain

    async function setup() {
      classifierRef.current = await loadSignClassifier()
      if (cancelled) return

      // @mediapipe/holistic and @mediapipe/camera_utils are loaded as global
      // <script> tags in index.html, not npm-imported — their UMD bundles
      // assume a global-script environment and break under Vite's ESM/CJS
      // interop when imported directly.
      const { Holistic, Camera } = window

      holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      })
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        refineFaceLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
      holistic.onResults(onResults)

      if (!videoRef.current) return
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (!cancelled) await holistic.send({ image: videoRef.current })
        },
        width: 640,
        height: 480,
      })
      camera.start()
    }

    function onResults(results) {
      if (cancelled) return
      const now = Date.now()
      const hasHand = Boolean(results.leftHandLandmarks || results.rightHandLandmarks)

      if (hasHand) lastHandSeenAt = now
      const currentlyInFrame = now - lastHandSeenAt < NO_HAND_TIMEOUT_MS

      let topLabel = null
      let topConfidence = 0

      if (hasHand && classifierRef.current) {
        const vector = landmarksToVector(results.leftHandLandmarks, results.rightHandLandmarks)
        const prediction = classifierRef.current.predict(vector)
        topLabel = prediction.label
        topConfidence = prediction.confidence

        recentPredictions.push(prediction)
        if (recentPredictions.length > CONFIRM_WINDOW_FRAMES) recentPredictions.shift()
      } else {
        recentPredictions.length = 0
        confirmedThisHold = false
      }

      // Majority vote: does one label hold a strong enough share of the recent window?
      if (recentPredictions.length === CONFIRM_WINDOW_FRAMES && !confirmedThisHold) {
        const counts = new Map()
        for (const p of recentPredictions) counts.set(p.label, (counts.get(p.label) ?? 0) + 1)
        const [majorityLabel, majorityCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]

        if (majorityCount / CONFIRM_WINDOW_FRAMES >= CONFIRM_THRESHOLD) {
          const avgConfidence =
            recentPredictions
              .filter((p) => p.label === majorityLabel)
              .reduce((sum, p) => sum + p.confidence, 0) / majorityCount

          confirmedThisHold = true
          wordCallbackRef.current?.({ sign: majorityLabel, confidence: avgConfidence })
          chain.push({ sign: majorityLabel, confidence: avgConfidence, timestamp: now })
        }
      }

      if (now - lastUiPush >= UI_UPDATE_MS) {
        lastUiPush = now
        setInFrame(currentlyInFrame)
        setConfidence(currentlyInFrame ? topConfidence : 0)
        setHoldingSign(currentlyInFrame ? topLabel : null)
      }
    }

    setup()

    return () => {
      cancelled = true
      chain.dispose()
      chainRef.current = null
      camera?.stop()
      holistic?.close()
    }
  }, [])

  const sendSentence = () => chainRef.current?.flush()
  const removeLastWord = () => chainRef.current?.removeLast()

  return { videoRef, inFrame, confidence, holdingSign, draftWords, sendSentence, removeLastWord }
}
