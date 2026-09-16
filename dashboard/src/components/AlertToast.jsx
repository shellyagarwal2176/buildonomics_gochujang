import { useEffect } from 'react'

const SEVERITY_STYLE = {
  urgent: 'bg-urgent text-white',
  high: 'bg-amber text-wine',
  normal: 'bg-wine text-white',
}

const AUTO_DISMISS_MS = 6000

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

// Real-time pop-up for a just-arrived alert, per the original PRD requirement
// ("alert appears as a real-time pop-up notification") — separate from the
// persistent Timeline entry, which stays regardless of whether this is dismissed.
export default function AlertToast({ alert, onDismiss }) {
  useEffect(() => {
    if (!alert) return
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [alert, onDismiss])

  if (!alert) return null

  return (
    <div className="fixed top-6 right-6 z-[150] max-w-[340px] animate-[fadeIn_.2s_ease-out]">
      <div className={`rounded-2xl shadow-[0_10px_28px_rgba(92,30,46,0.25)] p-4 ${SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.normal}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold opacity-80">Your loved one just signed</p>
            <p className="font-serif text-lg mt-0.5">"{alert.sign}"</p>
            <p className="text-xs opacity-75 mt-1">{formatTime(alert.timestamp)}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-semibold opacity-80 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
