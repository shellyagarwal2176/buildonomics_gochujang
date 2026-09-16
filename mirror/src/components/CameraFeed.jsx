// Pose points are illustrative, not real MediaPipe output — the real
// overlay will drive these same <circle>/<line> positions from live
// landmark coordinates once ml/ is wired in (see CLAUDE.md's pipeline).
const BONES = [
  [100, 30, 100, 55], [100, 55, 65, 70], [100, 55, 135, 70], [65, 70, 135, 70],
  [65, 70, 50, 115], [50, 115, 40, 150], [135, 70, 150, 115], [150, 115, 160, 150],
  [65, 70, 80, 150], [135, 70, 120, 150], [80, 150, 120, 150],
  [80, 150, 75, 220], [75, 220, 70, 280], [120, 150, 125, 220], [125, 220, 130, 280],
]
const JOINTS = [
  [100, 30, 6], [65, 70, 4], [135, 70, 4], [50, 115, 4], [150, 115, 4],
  [40, 150, 4], [160, 150, 4], [80, 150, 4], [120, 150, 4],
  [75, 220, 4], [125, 220, 4], [70, 280, 4], [130, 280, 4],
]

const STATUS_COPY = {
  good: { dot: 'bg-emerald-300', text: "You're clearly in frame" },
  low: { dot: 'bg-amber', text: 'The room looks a little dark — a lamp would help' },
  out: { dot: 'bg-urgent', text: "I can't see you right now — try stepping closer" },
}

export default function CameraFeed({ status = 'good', onCycleStatus }) {
  const copy = STATUS_COPY[status]

  return (
    <div className="relative rounded-[20px] bg-[#2A1720] aspect-[4/5] overflow-hidden flex items-center justify-center">
      {status !== 'out' && (
        <svg viewBox="0 0 200 320" width="150" height="240" className="opacity-90">
          {BONES.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9476B" strokeWidth="2" />
          ))}
          {JOINTS.map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#FCD9C5" />
          ))}
        </svg>
      )}
      <button
        type="button"
        onClick={onCycleStatus}
        className="absolute left-3.5 right-3.5 bottom-3.5 bg-white/15 backdrop-blur text-white text-xs font-semibold py-2 rounded-full flex items-center justify-center gap-2"
        title="Demo only — cycles the camera-status states"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${copy.dot}`} />
        {copy.text}
      </button>
    </div>
  )
}
