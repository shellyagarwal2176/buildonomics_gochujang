// Always-visible box under the camera showing the sentence being built from
// confirmed signs. Nothing is sent to the family until "Done" — see
// signChain.js. Backspace drops the most recently confirmed word, for when
// the classifier locks in the wrong one (see ml/README's known accuracy gaps).
export default function DetectedWords({ words, onBackspace, onDone }) {
  const hasWords = words.length > 0

  return (
    <div className="border-t border-line pt-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Words detected</p>

      {hasWords ? (
        <p className="font-serif text-xl text-wine mb-3 min-h-[1.75rem]">
          {words.map((w) => w.toLowerCase()).join(' ')}
        </p>
      ) : (
        <p className="text-muted text-sm italic mb-3 min-h-[1.75rem]">Sign to begin a sentence…</p>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onBackspace}
          disabled={!hasWords}
          className="flex items-center gap-1.5 bg-cream-2 text-rose-deep rounded-full px-4 py-2 text-sm font-bold disabled:opacity-40"
        >
          ⌫ Remove last
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={!hasWords}
          className="bg-sage-deep text-white rounded-full px-5 py-2 text-sm font-bold disabled:opacity-40"
        >
          Done
        </button>
      </div>
    </div>
  )
}
