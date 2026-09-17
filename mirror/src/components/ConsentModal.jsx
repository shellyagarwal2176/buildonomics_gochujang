// Deliberately no backdrop-click-to-close: a real consent decision needs an
// explicit tap on one of the two buttons below, not an accidental miss-click
// outside the card. If she wants to say no, she has to actually choose "No,
// not for me" — silence/misclick must never read as an answer either way.
export default function ConsentModal({ open, onYes, onNo }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] bg-wine/55 flex items-center justify-center p-5">
      <div className="bg-white rounded-[28px] p-9 max-w-[420px]">
        <p className="font-dev text-rose text-[15px] mb-1">சம்மதம்</p>
        <h2 className="font-serif text-[21px] text-wine mb-3">
          Would you like KineSense to also watch how you move?
        </h2>
        <p className="text-[13.5px] text-muted leading-relaxed">
          This helps your family gently notice if you're moving differently over
          time — like walking a little slower some weeks. Nothing is ever recorded
          or stored as video; only your movement is looked at, and it's never shown
          to anyone as numbers or charts. You can change your mind anytime from
          this same screen.
        </p>
        <div className="flex gap-2.5 mt-5">
          <button
            type="button"
            onClick={onYes}
            className="flex-1 bg-sage-deep text-white rounded-2xl py-3.5 text-sm font-bold"
          >
            Yes, I'd like that
          </button>
          <button
            type="button"
            onClick={onNo}
            className="flex-1 bg-rose-deep text-white rounded-2xl py-3.5 text-sm font-bold"
          >
            No, not for me
          </button>
        </div>
      </div>
    </div>
  )
}
