import { useState } from 'react'

const QUICK_MESSAGES = ['Coming home Sunday', 'Take your medicine', 'Calling tonight']

export default function Composer({ onSend, onPreviewFall }) {
  const [draft, setDraft] = useState('')

  return (
    <div className="bg-white rounded-[22px] p-5 shadow-[0_10px_28px_rgba(92,30,46,0.12)]">
      <h2 className="font-serif text-lg text-wine mb-3.5">Send a check-in</h2>

      {/* NOTE: this only updates the local timeline right now. There's no
          'checkin' event in the server contract yet (server/ only relays
          'alert'), so nothing actually reaches Amma's mirror until that's
          added — coordinate with Neerav before adding it, per TEAM_GUIDE. */}
      <div className="flex flex-col gap-2 mb-3.5">
        {QUICK_MESSAGES.map((msg) => (
          <button
            key={msg}
            onClick={() => onSend(msg)}
            className="bg-cream-2 border border-line rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold text-wine text-left"
          >
            {msg}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              onSend(draft.trim())
              setDraft('')
            }
          }}
          placeholder="Write your own…"
          className="flex-1 border border-line rounded-xl px-3 py-2.5 text-[13px] text-ink outline-none focus:border-rose"
        />
        <button
          onClick={() => {
            if (draft.trim()) {
              onSend(draft.trim())
              setDraft('')
            }
          }}
          className="bg-rose text-white rounded-xl px-4 py-2.5 text-[13px] font-bold"
        >
          Send
        </button>
      </div>

      <button
        onClick={onPreviewFall}
        className="w-full mt-4 border border-dashed border-urgent text-urgent text-xs font-semibold rounded-xl py-2.5"
      >
        Preview: fall alert
      </button>
    </div>
  )
}
