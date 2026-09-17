import { useCallback, useEffect, useState } from 'react'
import Greeting from './components/Greeting.jsx'
import CameraFeed from './components/CameraFeed.jsx'
import ConfidenceRing from './components/ConfidenceRing.jsx'
import DetectedWords from './components/DetectedWords.jsx'
import SignHint from './components/SignHint.jsx'
import ChainNote from './components/ChainNote.jsx'
import ReassuranceDrawer from './components/ReassuranceDrawer.jsx'
import ConsentModal from './components/ConsentModal.jsx'
import WordConfirmedFlash from './components/WordConfirmedFlash.jsx'
import MessageSentToast from './components/MessageSentToast.jsx'
import AmbientKolam from './components/AmbientKolam.jsx'
import DebugOverlay from './components/DebugOverlay.jsx'
import FallDetectedBanner from './components/FallDetectedBanner.jsx'
import PairingScreen from './components/PairingScreen.jsx'
import { useSignRecognition } from './hooks/useSignRecognition.js'
import { getConsent, setConsent } from './wellness/consent.js'
import { dispatchFallResolved } from './wellness/dispatchFallResolved.js'
import { ensurePaired } from './lib/pairing.js'
import { socket } from './lib/socket.js'

function App() {
  const [lastEvent, setLastEvent] = useState(null)
  const [wellnessConsent, setWellnessConsent] = useState(() => getConsent())
  const [consentOpen, setConsentOpen] = useState(() => getConsent() === null)
  const [confirmedWord, setConfirmedWord] = useState(null)
  const [lastCheckin, setLastCheckin] = useState(null)
  const [sentEvent, setSentEvent] = useState(null)
  const [fallDetected, setFallDetected] = useState(false)
  const [pairingCode, setPairingCode] = useState(null)

  // Silent device pairing/auth (CLAUDE.md's Authentication section) — runs
  // once per device, ever. The socket only connects once this resolves.
  useEffect(() => {
    ensurePaired()
      .then(({ pairingCode }) => {
        if (pairingCode) setPairingCode(pairingCode)
      })
      .catch((err) => console.error('Mirror pairing failed:', err))
  }, [])

  // Never surface a raw connection error to her — socket.io keeps retrying
  // on its own; this is just so an auth failure doesn't go unhandled.
  useEffect(() => {
    function handleConnectError(err) {
      console.error('Mirror socket connect_error:', err.message)
    }
    socket.on('connect_error', handleConnectError)
    return () => socket.off('connect_error', handleConnectError)
  }, [])

  const handleConsent = useCallback((granted) => {
    setConsent(granted)
    setWellnessConsent(granted)
    setConsentOpen(false)
  }, [])

  // Family's check-in messages, sent from the dashboard's Composer over the
  // 'checkin' socket event (see server/src/index.js's relay).
  useEffect(() => {
    function handleCheckin(payload) {
      setLastCheckin(payload)
    }
    socket.on('checkin', handleCheckin)
    return () => socket.off('checkin', handleCheckin)
  }, [])

  // alert dispatch already happened inside the hook (chaining -> dispatchAlert) by
  // the time this fires — this callback is UI state only, don't re-dispatch here.
  const handleIntentConfirmed = useCallback((alert) => {
    setLastEvent({ label: alert.sign })
    setSentEvent({ label: alert.sign })
  }, [])

  // Fires per single sign, well before the sentence-level alert above —
  // immediate "yes, that landed" feedback while they keep signing.
  const handleWordConfirmed = useCallback((word) => {
    setConfirmedWord(word.sign)
  }, [])

  const handleFallDetected = useCallback(() => {
    setFallDetected(true)
  }, [])

  const {
    videoRef, inFrame, confidence, holdingSign, draftWords, poseDebug, sendSentence, removeLastWord,
  } = useSignRecognition({
    onIntentConfirmed: handleIntentConfirmed,
    onWordConfirmed: handleWordConfirmed,
    onFallDetected: handleFallDetected,
    wellnessEnabled: Boolean(wellnessConsent),
  })

  const debugMode = new URLSearchParams(window.location.search).get('debug') === '1'

  return (
    <div className="min-h-screen bg-gradient-to-b from-peach to-cream pb-32 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-rose/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-28 w-80 h-80 bg-sage/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-peach-deep/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-16 w-56 h-56 bg-amber/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 -right-10 w-48 h-48 bg-rose/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-8 w-40 h-40 rounded-full border-2 border-rose/25 pointer-events-none" />
      <div className="absolute bottom-24 right-10 w-24 h-24 rounded-full border-2 border-sage/30 pointer-events-none" />
      <div className="absolute bottom-10 left-6 w-16 h-16 rounded-full border-2 border-amber/30 pointer-events-none" />
      <div className="absolute top-1/2 right-16 w-3 h-3 rounded-full bg-sage-deep/40 pointer-events-none" />
      <div className="absolute bottom-52 left-14 w-2.5 h-2.5 rounded-full bg-rose-deep/40 pointer-events-none" />
      <div className="absolute top-24 left-1/2 w-2 h-2 rounded-full bg-amber/50 pointer-events-none" />

      <div className="max-w-[680px] mx-auto px-7 pt-6 relative">
        <AmbientKolam className="absolute -top-16 left-1/2 -translate-x-1/2 w-screen h-[600px] max-w-none opacity-40 z-0 pointer-events-none" />

        <div className="relative z-10">
          <Greeting />

          <div className="bg-white rounded-[28px] shadow-[0_10px_28px_rgba(92,30,46,0.12)] p-5 flex flex-col gap-4 mt-5">
            <CameraFeed videoRef={videoRef} status={inFrame ? 'good' : 'out'} />
            <ConfidenceRing confidence={confidence} holdingSign={holdingSign} />
            <DetectedWords words={draftWords} onBackspace={removeLastWord} onDone={sendSentence} />
          </div>

          <SignHint />

          <ChainNote
            lastEvent={lastEvent}
            onOpenConsent={() => setConsentOpen(true)}
            wellnessOn={Boolean(wellnessConsent)}
          />
        </div>
      </div>

      <ReassuranceDrawer lastSentLabel={lastEvent?.label} lastCheckin={lastCheckin} />

      <ConsentModal
        open={consentOpen}
        onYes={() => handleConsent(true)}
        onNo={() => handleConsent(false)}
      />

      <WordConfirmedFlash word={confirmedWord} onDone={() => setConfirmedWord(null)} />
      <MessageSentToast event={sentEvent} onDone={() => setSentEvent(null)} />
      {debugMode && <DebugOverlay data={poseDebug} />}
      <FallDetectedBanner
        open={fallDetected}
        onClose={() => {
          dispatchFallResolved(socket)
          setFallDetected(false)
        }}
      />
      <PairingScreen code={pairingCode} onContinue={() => setPairingCode(null)} />
    </div>
  )
}

export default App
