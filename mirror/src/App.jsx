import { useCallback, useState } from 'react'
import Greeting from './components/Greeting.jsx'
import CameraFeed from './components/CameraFeed.jsx'
import ConfidenceRing from './components/ConfidenceRing.jsx'
import NeedGrid from './components/NeedGrid.jsx'
import ChainNote from './components/ChainNote.jsx'
import ReassuranceDrawer from './components/ReassuranceDrawer.jsx'
import ConsentModal from './components/ConsentModal.jsx'
import WordConfirmedFlash from './components/WordConfirmedFlash.jsx'
import SentenceDraft from './components/SentenceDraft.jsx'
import { useSignRecognition } from './hooks/useSignRecognition.js'

function App() {
  const [activeNeedId, setActiveNeedId] = useState(null)
  const [lastEvent, setLastEvent] = useState(null)
  const [wellnessOn, setWellnessOn] = useState(true)
  const [consentOpen, setConsentOpen] = useState(false)
  const [confirmedWord, setConfirmedWord] = useState(null)

  // alert dispatch already happened inside the hook (chaining -> dispatchAlert) by
  // the time this fires — this callback is UI state only, don't re-dispatch here.
  const handleIntentConfirmed = useCallback((alert) => {
    setActiveNeedId(alert.sign.toLowerCase())
    setLastEvent({ label: alert.sign })
    setTimeout(() => setActiveNeedId(null), 2200)
  }, [])

  // Fires per single sign, well before the sentence-level alert above —
  // immediate "yes, that landed" feedback while she keeps signing.
  const handleWordConfirmed = useCallback((word) => {
    setConfirmedWord(word.sign)
  }, [])

  const { videoRef, inFrame, confidence, holdingSign, draftWords, sendSentence } = useSignRecognition({
    onIntentConfirmed: handleIntentConfirmed,
    onWordConfirmed: handleWordConfirmed,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-peach to-cream pb-32">
      <div className="max-w-[1080px] mx-auto px-7 pt-9">
        <Greeting wellnessOn={wellnessOn} onToggleWellness={() => setWellnessOn((v) => !v)} />

        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-6 mt-7">
          <div className="bg-white rounded-[28px] shadow-[0_10px_28px_rgba(92,30,46,0.12)] p-5 flex flex-col gap-4">
            <CameraFeed videoRef={videoRef} status={inFrame ? 'good' : 'out'} />
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

      <WordConfirmedFlash word={confirmedWord} onDone={() => setConfirmedWord(null)} />
      <SentenceDraft words={draftWords} onDone={sendSentence} />
    </div>
  )
}

export default App
