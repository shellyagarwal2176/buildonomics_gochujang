// Shown right after this mirror silently pairs itself on first launch (see
// lib/pairing.js) — not a login screen for her, just the code whoever is
// setting up the household needs to hand to family members so they can sign
// up on the dashboard (CLAUDE.md's Authentication section). Reused for
// ChainNote's "Get a new code for family" link (lib/pairing.js's
// regenerateCode) — same screen, `regenerated` just swaps the copy since a
// rotated code invalidates the old one instead of being the household's
// very first code.
export default function PairingScreen({ code, loading, error, regenerated, onContinue }) {
  if (!code && !loading && !error) return null

  return (
    <div className="fixed inset-0 z-[200] bg-wine/90 flex items-center justify-center p-6 text-center">
      <div className="bg-white rounded-[28px] p-10 max-w-[420px] w-full">
        {error ? (
          <>
            <p className="font-dev text-rose text-[15px] mb-2">Something went wrong</p>
            <h2 className="font-serif text-2xl text-wine mb-4">Couldn't get a new code</h2>
            <p className="text-[13.5px] text-muted leading-relaxed mb-6">{error}</p>
          </>
        ) : loading ? (
          <p className="text-[13.5px] text-muted py-10">Getting a new code…</p>
        ) : (
          <>
            <p className="font-dev text-rose text-[15px] mb-2">
              {regenerated ? 'New pairing code' : 'Household set up'}
            </p>
            <h2 className="font-serif text-2xl text-wine mb-4">Give this code to family</h2>
            <p className="text-[13.5px] text-muted leading-relaxed mb-5">
              {regenerated
                ? 'The old code no longer works — anyone who still needs to join will need this one instead.'
                : 'Family members enter this on their dashboard to connect to this home.'}
            </p>
            <div className="font-serif text-[48px] tracking-[0.25em] text-wine font-semibold mb-6">
              {code}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={onContinue}
          className="w-full bg-sage-deep text-white rounded-2xl py-3.5 text-sm font-bold"
        >
          {error ? 'Close' : 'Done'}
        </button>
      </div>
    </div>
  )
}
