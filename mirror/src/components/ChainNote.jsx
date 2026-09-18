export default function ChainNote({ lastEvent, wellnessOn }) {
  return (
    <div className="flex items-center gap-3.5 flex-wrap mt-5">
      {lastEvent ? (
        <div className="bg-cream-2 border border-dashed border-rose-deep text-rose-deep text-[13px] font-semibold px-4 py-2.5 rounded-2xl">
          Sent as "{lastEvent.label}"
        </div>
      ) : (
        <div className="text-muted text-[13px]">Waiting for the next sign…</div>
      )}
      <p className="text-[13px] text-muted">
        Movement watching:{' '}
        <span className={`font-semibold ${wellnessOn ? 'text-sage-deep' : 'text-muted'}`}>
          {wellnessOn ? 'On' : 'Off'}
        </span>
      </p>
    </div>
  )
}
