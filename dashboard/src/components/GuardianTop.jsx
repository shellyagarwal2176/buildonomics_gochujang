export default function GuardianTop({ connected }) {
  return (
    <div className="flex justify-between items-start gap-4 flex-wrap">
      <div>
        <p className="font-dev text-rose text-[15px] mb-1">குடும்பம்</p>
        <h1 className="font-serif text-[32px] text-wine">Watching over Amma</h1>
      </div>
      {/* Device status is a stub — mirror doesn't yet send a heartbeat, this
          just reflects whether THIS browser has a live socket connection to
          the relay, not whether Amma's actual mirror is online. Real device
          presence needs a small addition to server/ — flag with Neerav
          before changing the socket contract. */}
      <div
        className={`text-xs font-semibold px-3.5 py-2 rounded-full ${
          connected ? 'bg-cream-2 text-sage-deep' : 'bg-cream-2 text-urgent'
        }`}
      >
        {connected ? 'Connected to the relay' : "Can't reach the relay — check server/ is running"}
      </div>
    </div>
  )
}
