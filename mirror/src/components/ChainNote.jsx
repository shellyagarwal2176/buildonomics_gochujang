export default function ChainNote({ lastEvent, onOpenConsent }) {
  return (
    <div className="flex items-center gap-3.5 flex-wrap mt-5">
      {lastEvent ? (
        <div className="bg-cream-2 border border-dashed border-rose-deep text-rose-deep text-[13px] font-semibold px-4 py-2.5 rounded-2xl">
          {lastEvent.signs.join(' + ')} → sent as "{lastEvent.label}"
        </div>
      ) : (
        <div className="text-muted text-[13px]">Waiting for the next sign…</div>
      )}
      <button
        type="button"
        onClick={onOpenConsent}
        className="text-rose-deep text-[13px] font-semibold underline underline-offset-4 decoration-1"
      >
        See the first-time setup screen
      </button>
    </div>
  )
}
