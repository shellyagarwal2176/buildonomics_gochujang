// Dev-only diagnostic readout for verifying pose tracking actually works on a
// real camera — gated behind ?debug=1 so it never shows in the real elder-
// facing UI. Not per-frame: reads the same ~5Hz throttled snapshot the rest
// of useSignRecognition's UI state uses.
//
// The real fall detector (wellness/poseMetrics.js) needs a fast, large hip
// drop, no recovery for 1.5s, and a favorable posture read — geometry that's
// awkward to reliably re-enact on demand for a demo. onTriggerFall fires the
// exact same dispatchFall(...) + local banner the real detector would, so
// this button exercises the actual mirror -> socket -> server -> dashboard
// path deterministically, instead of hoping a mimed fall gets picked up.
export default function DebugOverlay({ data, onTriggerFall }) {
  const row = (label, value) => (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span>{value === null || value === undefined ? '—' : String(value)}</span>
    </div>
  )

  return (
    <div className="fixed bottom-4 right-4 z-[300] bg-black/85 text-white text-xs font-mono rounded-xl p-3.5 w-64 flex flex-col gap-1 pointer-events-none">
      <p className="text-amber font-bold mb-1">debug (?debug=1)</p>
      {!data && <p>waiting for camera…</p>}
      {data && (
        <>
          {row('wellness consent', data.wellnessEnabled ? 'on' : 'off')}
          {row('hand detected', data.hasHand)}
          {row('pose detected', data.hasPose)}
          {row('hip Y (0-1 normal)', data.hipY)}
          {row('hip visibility', data.visibility)}
          {row('posture', data.posture)}
        </>
      )}
      {onTriggerFall && (
        <button
          type="button"
          onClick={onTriggerFall}
          className="pointer-events-auto mt-2 bg-urgent text-white rounded-md py-1.5 text-xs font-bold"
        >
          Trigger test fall
        </button>
      )}
    </div>
  )
}
