// Live view of the sentence being built from confirmed signs — nothing is
// sent to the family until "Done" is pressed (manual send, see signChain.js).
export default function SentenceDraft({ words, onDone }) {
  if (words.length === 0) return null

  return (
    <div className="fixed bottom-28 inset-x-0 z-40 flex justify-center px-5">
      <div className="bg-white rounded-2xl shadow-[0_10px_28px_rgba(92,30,46,0.18)] px-5 py-3.5 flex items-center gap-4 max-w-[90vw]">
        <p className="font-serif text-base text-wine truncate">
          {words.map((w) => w.toLowerCase()).join(' ')}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="shrink-0 bg-sage-deep text-white rounded-full px-5 py-2 text-sm font-bold"
        >
          Done
        </button>
      </div>
    </div>
  )
}
