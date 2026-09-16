// Mocked — there's no multi-user auth/presence yet, so this always shows
// the same two people. Wire this to something real once accounts exist.
const WATCHERS = [
  { initial: 'P', name: 'Priya', color: 'var(--color-rose)' },
  { initial: 'R', name: 'Ravi', color: 'var(--color-sage-deep)' },
]

export default function WhosWatching() {
  return (
    <div className="flex items-center gap-2 mt-4">
      <div className="flex">
        {WATCHERS.map((w, i) => (
          <span
            key={w.initial}
            className="w-7 h-7 rounded-full text-white font-serif text-[13px] flex items-center justify-center border-2 border-cream"
            style={{ backgroundColor: w.color, marginLeft: i > 0 ? '-10px' : 0 }}
          >
            {w.initial}
          </span>
        ))}
      </div>
      <p className="text-[12.5px] text-muted ml-1.5">
        {WATCHERS.map((w) => w.name).join(' and ')} are viewing now
      </p>
    </div>
  )
}
