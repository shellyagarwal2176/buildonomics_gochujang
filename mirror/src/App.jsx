import { useCallback, useState } from 'react'
import Greeting from './components/Greeting.jsx'
import CameraFeed from './components/CameraFeed.jsx'
import ConfidenceRing from './components/ConfidenceRing.jsx'
import NeedGrid from './components/NeedGrid.jsx'
import ChainNote from './components/ChainNote.jsx'
import ReassuranceDrawer from './components/ReassuranceDrawer.jsx'
import ConsentModal from './components/ConsentModal.jsx'
import { useSignRecognition } from './hooks/useSignRecognition.js'
import { sendAlert } from './lib/socket.js'

const CAMERA_STATES = ['good', 'low', 'out']

function App() {
  const [activeNeedId, setActiveNeedId] = useState(null)
  const [lastEvent, setLastEvent] = useState(null)
  const [wellnessOn, setWellnessOn] = useState(true)
  const [consentOpen, setConsentOpen] = useState(false)
  const [cameraStateIndex, setCameraStateIndex] = useState(0)

  const handleIntentConfirmed = useCallback((step) => {
    setActiveNeedId(step.intent)
    setLastEvent(step)
    sendAlert({ sign: step.label, confidence: 1 })
    setTimeout(() => setActiveNeedId(null), 2200)
  }, [])

  const { confidence, holdingSign } = useSignRecognition({
    onIntentConfirmed: handleIntentConfirmed,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-peach to-cream pb-32">
      <div className="max-w-[1080px] mx-auto px-7 pt-9">
        <Greeting wellnessOn={wellnessOn} onToggleWellness={() => setWellnessOn((v) => !v)} />

        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-6 mt-7">
          <div className="bg-white rounded-[28px] shadow-[0_10px_28px_rgba(92,30,46,0.12)] p-5 flex flex-col gap-4">
            <CameraFeed
              status={CAMERA_STATES[cameraStateIndex]}
              onCycleStatus={() => setCameraStateIndex((i) => (i + 1) % CAMERA_STATES.length)}
            />
            <ConfidenceRing confidence={confidence} holdingSign={holdingSign} />
          </div>

          <div>
            <NeedGrid activeNeedId={activeNeedId} />
            <ChainNote lastEvent={lastEvent} onOpenConsent={() => setConsentOpen(true)} />
          </div>
        </div>
      </div>

      <ReassuranceDrawer lastSentLabel={lastEvent?.label} />

      <ConsentModal
        open={consentOpen}
        onYes={() => { setWellnessOn(true); setConsentOpen(false) }}
        onNo={() => { setWellnessOn(false); setConsentOpen(false) }}
      />
    </div>
  )
}

export default App
