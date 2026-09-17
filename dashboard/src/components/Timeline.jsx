const SEVERITY_DOT = {
  normal: 'bg-sage-deep',
  high: 'bg-amber',
  urgent: 'bg-urgent',
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export default function Timeline({ items }) {
  if (items.length === 0) {
    return (
      <p className="text-[13px] text-muted italic">
        Nothing yet today — this fills in as your loved one signs from their mirror.
      </p>
    )
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-col relative before:content-[''] before:absolute before:left-[9px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-line">
      {items.map((item) => (
        <li key={item.id} className="relative pl-8 py-3">
          <span
            className={`absolute left-1 top-4 w-3 h-3 rounded-full ring-4 ring-cream ${
              item.kind === 'checkin' ? 'bg-rose-deep' : SEVERITY_DOT[item.severity]
            }`}
          />
          {item.kind === 'alert' ? (
            <>
              <p className="font-serif text-[15px] text-wine">"{item.sign}"</p>
              <p className="text-xs text-muted mt-1">{formatTime(item.timestamp)}</p>
            </>
          ) : (
            <p className="text-[13px] text-muted italic">
              {item.own ? 'You' : item.from || 'Family'} sent: "{item.text}" · {formatTime(item.timestamp)}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
