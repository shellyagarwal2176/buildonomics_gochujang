// Mirrors mirror/src/components/PairingScreen.jsx's visual pattern for
// showing a household code — this is the dashboard-side equivalent for when
// that one-time screen is long gone and someone needs a new code to bring in
// another family member or pair a replacement mirror.
export default function RegenerateCodeModal({ open, code, error, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] bg-wine/60 flex items-center justify-center p-5">
      <div className="bg-white rounded-[28px] p-9 max-w-[420px] w-full text-center">
        {error ? (
          <>
            <p className="font-dev text-rose text-[15px] mb-2">Something went wrong</p>
            <h2 className="font-serif text-2xl text-wine mb-4">Couldn't generate a new code</h2>
            <p className="text-[13.5px] text-muted leading-relaxed mb-6">{error}</p>
          </>
        ) : code ? (
          <>
            <p className="font-dev text-rose text-[15px] mb-2">New pairing code</p>
            <h2 className="font-serif text-2xl text-wine mb-4">Give this code to family</h2>
            <p className="text-[13.5px] text-muted leading-relaxed mb-5">
              The old code no longer works — anyone who still needs to join or pair a
              mirror will need this one instead.
            </p>
            <div className="font-serif text-[48px] tracking-[0.25em] text-wine font-semibold mb-6">
              {code}
            </div>
          </>
        ) : (
          <p className="text-[13.5px] text-muted py-8">Generating a new code…</p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-sage-deep text-white rounded-2xl py-3.5 text-sm font-bold"
        >
          Done
        </button>
      </div>
    </div>
  )
}
