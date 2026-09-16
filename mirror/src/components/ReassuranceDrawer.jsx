// Real data will come from the dashboard/server once check-ins and read
// receipts are wired end to end. Seeded with one of each so the drawer
// never renders empty during development.
const SEED_RECEIPT = 'Priya saw your message at 10:14'
const SEED_CHECKIN = { text: 'Coming home Sunday', from: 'Priya', when: 'today' }

export default function ReassuranceDrawer({ lastSentLabel }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-line rounded-t-[26px] shadow-[0_-12px_30px_rgba(92,30,46,0.14)] px-7 pt-3.5 pb-5">
      <div className="w-11 h-1 bg-line rounded-full mx-auto mb-3.5" />
      <p className="text-[13px] text-muted mb-2.5">
        {lastSentLabel ? `Sent: "${lastSentLabel}" · ${SEED_RECEIPT}` : SEED_RECEIPT}
      </p>
      <div className="inline-flex items-center gap-2.5 bg-cream-2 rounded-2xl px-4 py-2.5">
        <div>
          <p className="font-serif text-[15px] text-wine">{SEED_CHECKIN.text}</p>
          <span className="block text-[11.5px] text-muted mt-0.5">
            From {SEED_CHECKIN.from} · {SEED_CHECKIN.when}
          </span>
        </div>
      </div>
    </div>
  )
}
