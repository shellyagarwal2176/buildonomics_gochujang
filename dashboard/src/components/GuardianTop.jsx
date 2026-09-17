export default function GuardianTop({ connected, onLogout, onRegenerateCode }) {
  return (
    <div className="flex justify-between items-start gap-4 flex-wrap">
      <div>
        <p className="text-rose text-[13px] font-semibold uppercase tracking-wide mb-1">Family view</p>
        <h1 className="font-serif text-[32px] text-wine">Watching over your loved one</h1>
      </div>
      <div className="flex items-center gap-3">
        {/* Device status is a stub — mirror doesn't yet send a heartbeat, this
            just reflects whether THIS browser has a live socket connection to
            the relay, not whether the actual mirror is online. Real device
            presence needs a small addition to server/ — flag with Neerav
            before changing the socket contract. */}
        <div
          className={`text-xs font-semibold px-3.5 py-2 rounded-full ${
            connected ? 'bg-cream-2 text-sage-deep' : 'bg-cream-2 text-urgent'
          }`}
        >
          {connected ? 'Connected to the relay' : "Can't reach the relay — check server/ is running"}
        </div>
        {onRegenerateCode && (
          <button
            type="button"
            onClick={onRegenerateCode}
            className="text-xs font-semibold text-rose-deep underline px-1"
          >
            New pairing code
          </button>
        )}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-semibold text-muted underline px-1"
          >
            Log out
          </button>
        )}
      </div>
    </div>
  )
}
