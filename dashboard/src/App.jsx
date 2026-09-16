import { useCallback, useMemo, useState } from 'react'
import Landing from './components/Landing.jsx'
import GuardianTop from './components/GuardianTop.jsx'
import WhosWatching from './components/WhosWatching.jsx'
import Timeline from './components/Timeline.jsx'
import Composer from './components/Composer.jsx'
import FallAlertModal from './components/FallAlertModal.jsx'
import AlertToast from './components/AlertToast.jsx'
import { useAlertFeed } from './hooks/useAlertFeed.js'

function App() {
  const [screen, setScreen] = useState('landing')
  const [checkins, setCheckins] = useState([])
  const [fallOpen, setFallOpen] = useState(false)
  const [toastAlert, setToastAlert] = useState(null)

  const handleNewAlert = useCallback((event) => setToastAlert(event), [])
  const { events, connected } = useAlertFeed({ onNewAlert: handleNewAlert })

  const handleSendCheckin = useCallback((text) => {
    setCheckins((prev) => [
      { kind: 'checkin', id: `checkin-${Date.now()}`, text, timestamp: Date.now() },
      ...prev,
    ])
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

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-[1080px] mx-auto px-7 py-10">
        <GuardianTop connected={connected} />
        <WhosWatching />

        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-7 mt-7">
          <div>
            <h2 className="font-serif text-lg text-wine mb-3.5">Today</h2>
            <Timeline items={timelineItems} />
          </div>
          <Composer onSend={handleSendCheckin} onPreviewFall={() => setFallOpen(true)} />
        </div>
      </div>

      <FallAlertModal open={fallOpen} onClose={() => setFallOpen(false)} />
      <AlertToast alert={toastAlert} onDismiss={() => setToastAlert(null)} />
    </div>
  )
}

export default App
