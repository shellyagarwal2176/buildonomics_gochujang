export default function ConsentModal({ open, onYes, onNo }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-wine/55 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onNo()}
    >
      <div className="bg-white rounded-[28px] p-9 max-w-[420px]">
        <p className="font-dev text-rose text-[15px] mb-1">சம்மதம்</p>
        <h2 className="font-serif text-[21px] text-wine mb-3">
          Would you like KineSense to also watch how you move?
        </h2>
        <p className="text-[13.5px] text-muted leading-relaxed">
          This helps your family notice if you're slowing down — weeks before it
          becomes a problem. You will never see numbers or charts. You can turn
          this off anytime, just by signing.
        </p>
        <div className="flex gap-2.5 mt-5">
          <button
            type="button"
            onClick={onYes}
            className="flex-1 bg-sage-deep text-white rounded-2xl py-3.5 text-sm font-bold"
          >
            Sign YES
          </button>
          <button
            type="button"
            onClick={onNo}
            className="flex-1 bg-cream-2 text-rose-deep rounded-2xl py-3.5 text-sm font-bold"
          >
            Sign NO
          </button>
        </div>
      </div>
    </div>
  )
}
