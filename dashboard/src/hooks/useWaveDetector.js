import { useEffect, useRef, useState } from 'react'

// Simplification: "wave" is detected as a hand held up in front of the camera
// for HOLD_MS, not actual back-and-forth motion — much simpler and more
// robust than tracking oscillation, and reuses the same MediaPipe Holistic
// setup as mirror/'s useSignRecognition. Revisit if holding still (not
// waving) turns out to trigger it too easily by accident.
const HOLD_MS = 1200

export function useWaveDetector({ onWave, enabled = true } = {}) {
  const videoRef = useRef(null)
  const [handVisible, setHandVisible] = useState(false)
  const callbackRef = useRef(onWave)
  useEffect(() => {
    callbackRef.current = onWave
  }, [onWave])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let camera = null
    let holistic = null
    let handSince = null
    let fired = false

    async function setup() {
      const { Holistic, Camera } = window
      holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      })
      holistic.setOptions({
        modelComplexity: 0, // only need hand presence here, not classification accuracy
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
      holistic.onResults(onResults)

      if (!videoRef.current) return
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (!cancelled) await holistic.send({ image: videoRef.current })
        },
        width: 320,
        height: 240,
      })
      camera.start()
    }

    function onResults(results) {
      if (cancelled || fired) return
      const hasHand = Boolean(results.leftHandLandmarks || results.rightHandLandmarks)
      const now = Date.now()
      setHandVisible(hasHand)

      if (hasHand) {
        if (handSince === null) handSince = now
        if (now - handSince >= HOLD_MS) {
          fired = true
          callbackRef.current?.()
        }
      } else {
        handSince = null
      }
    }

    setup()

    return () => {
      cancelled = true
      camera?.stop()
      holistic?.close()
    }
  }, [enabled])

  return { videoRef, handVisible }
}
