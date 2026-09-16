const STATUS_COPY = {
  good: { dot: 'bg-emerald-300', text: "You're clearly in frame" },
  out: { dot: 'bg-urgent', text: "I can't see you right now — try stepping closer" },
}

// ponytail: no low-light detection — "good"/"out" is driven purely by whether
// MediaPipe found a hand recently. Revisit if a lit-but-no-hand-yet moment
// reads as a false "out" in practice.
export default function CameraFeed({ videoRef, status = 'out' }) {
  const copy = STATUS_COPY[status] ?? STATUS_COPY.out

  return (
    <div className="relative rounded-[20px] bg-[#2A1720] aspect-[4/5] overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
      />
      <div className="absolute left-3.5 right-3.5 bottom-3.5 bg-white/15 backdrop-blur text-white text-xs font-semibold py-2 rounded-full flex items-center justify-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${copy.dot}`} />
        {copy.text}
      </div>
    </div>
  )
}
