import PillButton from './PillButton'
import { WhatsAppIcon } from './Icons'

// Wide info card: coloured panel on the left, text on the right.
export default function FeatureCard({ title, text, actionLabel, actionTo, tone = ['#fed7aa', '#fb923c'] }) {
  return (
    <section className="grid items-center gap-6 rounded-hero bg-white p-4 shadow-card md:grid-cols-2 md:p-6">
      <div
        className="grid aspect-[4/3] place-items-center overflow-hidden rounded-card"
        style={{ background: `linear-gradient(135deg, ${tone[0]}, ${tone[1]})` }}
        aria-hidden="true"
      >
        <div className="flex flex-col items-center gap-4 p-4 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-white shadow-hover [&>svg]:size-9"><WhatsAppIcon /></span>
          <div className="flex flex-wrap justify-center gap-2 font-mono text-xs font-bold">
            {['Cart', 'Order', 'WhatsApp'].map((t) => <span key={t} className="rounded-full bg-white/70 px-3 py-1.5">{t}</span>)}
          </div>
        </div>
      </div>
      <div className="px-2 pb-4 md:pb-0">
        <h2 className="font-mono text-2xl font-bold">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">{text}</p>
        {actionTo && <PillButton to={actionTo} className="mt-6">{actionLabel}</PillButton>}
      </div>
    </section>
  )
}