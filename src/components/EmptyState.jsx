import PillButton from './PillButton'
export default function EmptyState({ title, text, actionLabel, actionTo, onAction }) {
  return (
    <div className="mx-auto max-w-md rounded-card bg-white p-10 text-center shadow-card">
      <h2 className="font-mono text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-ink/70">{text}</p>
      {(actionTo || onAction) && <PillButton to={actionTo} onClick={onAction} className="mt-6">{actionLabel}</PillButton>}
    </div>
  )
}
