// Seeded so the drawer never renders empty before the first real check-in
// arrives over the 'checkin' socket event (see lib/socket.js).
const SEED_RECEIPT = 'Priya saw your message at 10:14'
const SEED_CHECKIN = { text: 'Coming home Sunday', from: 'Priya', when: 'today' }

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export default function ReassuranceDrawer({ lastSentLabel, lastCheckin }) {
  const checkin = lastCheckin
    ? { text: lastCheckin.text, from: lastCheckin.from || 'Family', when: formatTime(lastCheckin.timestamp) }
    : SEED_CHECKIN

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-line rounded-t-[26px] shadow-[0_-12px_30px_rgba(92,30,46,0.14)] px-7 pt-3.5 pb-5">
      <div className="w-11 h-1 bg-line rounded-full mx-auto mb-3.5" />
      <p className="text-[13px] text-muted mb-2.5">
        {lastSentLabel ? `Sent: "${lastSentLabel}" · ${SEED_RECEIPT}` : SEED_RECEIPT}
      </p>
      <div className="inline-flex items-center gap-2.5 bg-cream-2 rounded-2xl px-4 py-2.5">
        <div>
          <p className="font-serif text-[15px] text-wine">{checkin.text}</p>
          <span className="block text-[11.5px] text-muted mt-0.5">
            From {checkin.from} · {checkin.when}
          </span>
        </div>
      </div>
    </div>
  )
}
