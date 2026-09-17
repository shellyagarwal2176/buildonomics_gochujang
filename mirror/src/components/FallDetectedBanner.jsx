// Elder-facing counterpart to dashboard/src/components/FallAlertModal.jsx —
// same fall event, shown to the person it happened to, not just the family.
// Reassuring tone, no backdrop-dismiss (unlike ConsentModal) since this is
// safety-relevant and shouldn't be closeable by an accidental tap.
export default function FallDetectedBanner({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] bg-wine/60 flex items-center justify-center p-5">
      <div
        className="rounded-[28px] p-10 max-w-[420px] w-full text-center text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #C1425A, #8E2E42)' }}
      >
        <div className="w-[70px] h-[70px] rounded-full bg-white/15 mx-auto mb-4.5 flex items-center justify-center text-3xl">
          🚨
        </div>
        <h2 className="font-serif text-2xl">Did you fall?</h2>
        <p className="text-[13.5px] text-white/85 mt-2.5">
          We noticed a sudden movement and let your family know, just in case.
        </p>
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-white text-urgent rounded-2xl py-3.5 text-sm font-bold"
          >
            I'm okay
          </button>
        </div>
      </div>
    </div>
  )
}
