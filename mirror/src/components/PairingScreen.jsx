// Shown once, right after this mirror silently pairs itself on first launch
// (see lib/pairing.js) — not a login screen for her, just the code whoever
// is setting up the household needs to hand to family members so they can
// sign up on the dashboard (CLAUDE.md's Authentication section).
export default function PairingScreen({ code, onContinue }) {
  if (!code) return null

  return (
    <div className="fixed inset-0 z-[200] bg-wine/90 flex items-center justify-center p-6 text-center">
      <div className="bg-white rounded-[28px] p-10 max-w-[420px] w-full">
        <p className="font-dev text-rose text-[15px] mb-2">Household set up</p>
        <h2 className="font-serif text-2xl text-wine mb-4">Give this code to family</h2>
        <p className="text-[13.5px] text-muted leading-relaxed mb-5">
          Family members enter this on their dashboard to connect to this home. It won't be shown again.
        </p>
        <div className="font-serif text-[48px] tracking-[0.25em] text-wine font-semibold mb-6">
          {code}
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="w-full bg-sage-deep text-white rounded-2xl py-3.5 text-sm font-bold"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
