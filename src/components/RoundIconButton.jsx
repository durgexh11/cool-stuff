export default function RoundIconButton({ label, active = false, children, className = '', ...rest }) {
  return (
    <button aria-label={label} title={label} aria-pressed={rest['aria-pressed']}
      className={`relative grid size-11 shrink-0 place-items-center rounded-full transition active:scale-90 ${active ? 'bg-ink text-white' : 'bg-white/70 text-ink hover:bg-white'} ${className}`} {...rest}>
      {children}
    </button>
  )
}
