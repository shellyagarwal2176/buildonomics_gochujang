import { useCallback, useEffect, useMemo, useState } from 'react'
import Landing from './components/Landing.jsx'
import AuthForm from './components/AuthForm.jsx'
import GuardianTop from './components/GuardianTop.jsx'
import WhosWatching from './components/WhosWatching.jsx'
import Timeline from './components/Timeline.jsx'
import Composer from './components/Composer.jsx'
import FallAlertModal from './components/FallAlertModal.jsx'
import AlertToast from './components/AlertToast.jsx'
import AmbientKolam from './components/AmbientKolam.jsx'
import DriftCards from './components/DriftCards.jsx'
import { useAlertFeed } from './hooks/useAlertFeed.js'
import { useDriftCards } from './hooks/useDriftCards.js'
import { getStoredToken, storeToken, clearStoredToken } from './lib/auth.js'
import { socket } from './lib/socket.js'

function App() {
  const [screen, setScreen] = useState('landing')
  const [checkins, setCheckins] = useState([])
  const [fallOpen, setFallOpen] = useState(false)
  const [toastAlert, setToastAlert] = useState(null)
  const [authToken, setAuthToken] = useState(() => getStoredToken())

  // Connect (or reconnect) once we have a family JWT to authenticate with —
  // the socket.io server rejects any unauthenticated connection
  // (server/src/index.js's io.use() middleware).
  useEffect(() => {
    if (!authToken) return
    socket.auth = { token: authToken }
    socket.connect()
    return () => socket.disconnect()
  }, [authToken])

  useEffect(() => {
    function handleConnectError(err) {
      console.error('Dashboard socket connect_error:', err.message)
      // Most likely an expired/invalid token — drop it and send them back to
      // the login form rather than sitting "disconnected" indefinitely.
      clearStoredToken()
      setAuthToken(null)
    }
    socket.on('connect_error', handleConnectError)
    return () => socket.off('connect_error', handleConnectError)
  }, [])

  const handleAuthenticated = useCallback((token) => {
    storeToken(token)
    setAuthToken(token)
  }, [])

  const handleLogout = useCallback(() => {
    clearStoredToken()
    setAuthToken(null)
    socket.disconnect()
  }, [])

  // Other family members' check-ins in this household, relayed by the server
  // with a `from` name it attached itself (never trust a client-supplied
  // name for attribution) — this app's own sent messages are added locally
  // by handleSendCheckin below instead, since the server excludes the
  // sender from its own broadcast.
  useEffect(() => {
    function handleCheckin(payload) {
      setCheckins((prev) => [
        {
          kind: 'checkin',
          id: `checkin-${payload.timestamp}-${payload.from ?? 'unknown'}`,
          text: payload.text,
          timestamp: payload.timestamp,
          from: payload.from,
        },
        ...prev,
      ])
    }
    socket.on('checkin', handleCheckin)
    return () => socket.off('checkin', handleCheckin)
  }, [])

  const handleNewAlert = useCallback((event) => setToastAlert(event), [])
  const { events, connected } = useAlertFeed({ onNewAlert: handleNewAlert })
  const { cards: driftCards, dismiss: dismissDriftCard } = useDriftCards()

  // Phase 2: a real 'fall' event opens the same modal Composer's manual
  // "Preview: fall alert" button opens — that button stays for demo/testing
  // when there's no live fall to trigger the flow. A 'fallResolved' event
  // (the elder hitting "I'm okay" on their own FallDetectedBanner) closes it
  // back down in step, instead of it staying open until a family member acts.
  useEffect(() => {
    function handleFall() {
      setFallOpen(true)
    }
    function handleFallResolved() {
      setFallOpen(false)
    }
    socket.on('fall', handleFall)
    socket.on('fallResolved', handleFallResolved)
    return () => {
      socket.off('fall', handleFall)
      socket.off('fallResolved', handleFallResolved)
    }
  }, [])

  const handleSendCheckin = useCallback((text) => {
    const timestamp = Date.now()
    setCheckins((prev) => [
      { kind: 'checkin', id: `checkin-${timestamp}`, text, timestamp, own: true },
      ...prev,
    ])
    socket.emit('checkin', { text, timestamp })
  }, [])

  const timelineItems = useMemo(
    () => [...events, ...checkins].sort((a, b) => b.timestamp - a.timestamp),
    [events, checkins]
  )

  if (screen === 'landing') {
    return (
      <Landing
        onChooseFamily={() => setScreen('guardian')}
        onChooseElder={() => {
          // In the real product this is a different device entirely.
          // For local dev, the mirror app runs on its own port.
          window.location.href = 'http://localhost:5173'
        }}
      />
    )
  }

  if (!authToken) {
    return <AuthForm onAuthenticated={handleAuthenticated} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-peach to-cream relative overflow-hidden">
      <div className="absolute -top-28 -right-28 w-80 h-80 bg-rose/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-28 w-72 h-72 bg-sage/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-peach-deep/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/3 w-56 h-56 bg-amber/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-24 right-1/3 w-60 h-60 bg-rose/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-8 left-10 w-36 h-36 rounded-full border-2 border-rose/25 pointer-events-none" />
      <div className="absolute bottom-16 left-1/3 w-20 h-20 rounded-full border-2 border-sage/30 pointer-events-none" />
      <div className="absolute top-1/3 right-16 w-28 h-28 rounded-full border-2 border-amber/25 pointer-events-none" />
      <div className="absolute top-24 right-1/3 w-3 h-3 rounded-full bg-sage-deep/40 pointer-events-none" />
      <div className="absolute bottom-10 left-16 w-2.5 h-2.5 rounded-full bg-rose-deep/40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-amber/50 pointer-events-none" />

      <div className="max-w-[1080px] mx-auto px-7 py-10 relative">
        <AmbientKolam className="absolute -top-24 left-1/2 -translate-x-1/2 w-screen h-[700px] max-w-none opacity-30 z-0 pointer-events-none" />

        <div className="relative z-10">
          <GuardianTop connected={connected} onLogout={handleLogout} />
          <WhosWatching />

          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-7 mt-7">
            <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_28px_rgba(92,30,46,0.12)]">
              <h2 className="font-serif text-lg text-wine mb-3.5">Today</h2>
              <Timeline items={timelineItems} />
            </div>
            <div className="flex flex-col gap-7">
              <Composer onSend={handleSendCheckin} onPreviewFall={() => setFallOpen(true)} />
              <DriftCards cards={driftCards} onDismiss={dismissDriftCard} />
            </div>
          </div>
        </div>
      </div>

      <FallAlertModal open={fallOpen} onClose={() => setFallOpen(false)} />
      <AlertToast alert={toastAlert} onDismiss={() => setToastAlert(null)} />
    </div>
  )
}

export default App
