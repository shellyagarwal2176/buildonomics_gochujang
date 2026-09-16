export default function FallAlertModal({ open, onClose }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] bg-wine/60 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-[28px] p-10 max-w-[420px] w-full text-center text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #C1425A, #8E2E42)' }}
      >
        <div className="w-[70px] h-[70px] rounded-full bg-white/15 mx-auto mb-4.5 flex items-center justify-center text-3xl">
          🚨
        </div>
        <h2 className="font-serif text-2xl">Your loved one may have fallen</h2>
        <p className="text-[13.5px] text-white/85 mt-2.5">
          No movement detected after a sudden drop · {new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
        </p>
        <div className="flex flex-col gap-2.5 mt-6">
          <button className="bg-white text-urgent rounded-2xl py-3.5 text-sm font-bold">
            Call them now
          </button>
          <button className="bg-white/12 border border-white/40 text-white rounded-2xl py-3.5 text-sm font-bold">
            Call neighbour Lakshmi
          </button>
          <button onClick={onClose} className="text-white/75 underline text-sm py-1">
            I've seen this
          </button>
        </div>
      </div>
    </div>
  )
}
