import { Link } from 'react-router-dom'
import PillButton from './PillButton'
import { SearchIcon, CartIcon, UserIcon, WhatsAppIcon, ArrowIcon } from './Icons'
import { DELIVERY_TIME, DAMAGE_REPORT_HOURS } from '../lib/site'

const steps = [
  { icon: SearchIcon, title: 'Find something cool', text: 'Browse, search and filter products. Tap the heart to save the ones you love to your wishlist.' },
  { icon: CartIcon, title: 'Add to cart', text: 'Create a free account, add what you like and set the quantity. Your cart is saved to your account.' },
  { icon: UserIcon, title: 'Place your order', text: 'Enter your name, phone and delivery address. Your order is saved and gets its own order number.' },
  { icon: WhatsAppIcon, title: 'Confirm on WhatsApp', text: 'WhatsApp opens with your order details ready. We confirm the price, delivery and payment with you in the chat.' },
]
const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered']
const faqs = [
  ['Do I pay on the website?', 'No. The website only saves your order. Payment is arranged with you in the WhatsApp chat.'],
  ['How long does delivery take?', `Usually ${DELIVERY_TIME} after we confirm your order. We tell you the exact time in the chat.`],
  ['Can I cancel my order?', 'Yes. Message us on WhatsApp before the order is shipped.'],
  ['What if my item is damaged?', `Message us within ${DAMAGE_REPORT_HOURS} hours of delivery with your order number and photos. We will replace it or refund you.`],
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-28">
      <h2 className="text-center font-mono text-2xl font-bold">How ordering works</h2>
      <p className="mx-auto mb-8 mt-2 max-w-md text-center text-sm text-ink/70">Four simple steps. There is no payment on the website.</p>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="fade-up rounded-card bg-white p-6 shadow-card" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between">
              <span className="grid size-12 place-items-center rounded-full bg-ink text-white"><s.icon /></span>
              <span className="font-mono text-3xl font-bold text-ink/15" aria-hidden="true">0{i + 1}</span>
            </div>
            <h3 className="mt-4 font-mono font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-card bg-white p-6 shadow-card">
          <h3 className="font-mono font-bold">Track your order</h3>
          <p className="mt-2 text-sm text-ink/70">See the latest status any time in My Orders.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {statuses.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="chip" data-on={i === 0}>{s}</span>
                {i < statuses.length - 1 && <span className="text-ink/30" aria-hidden="true">›</span>}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-card bg-white p-6 shadow-card">
          <h3 className="font-mono font-bold">Good to know</h3>
          <ul className="mt-2 space-y-2 text-sm text-ink/70">
            <li>Payment is arranged in the WhatsApp chat, never on this website.</li>
            <li>Delivery charges, if any, are told to you before you pay.</li>
            <li>
              Read our <Link to="/policy/shipping" className="font-bold underline">shipping</Link> and{' '}
              <Link to="/policy/returns" className="font-bold underline">returns</Link> policies.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-card bg-white p-6 shadow-card">
        <h3 className="font-mono font-bold">Common questions</h3>
        <div className="mt-2 divide-y divide-slate-100">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-1">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden="true" className="font-mono text-lg transition group-open:rotate-45">+</span>
              </summary>
              <p className="pb-3 text-sm leading-relaxed text-ink/70">{a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center"><PillButton to="/cool-stuff" icon={<ArrowIcon />}>Start browsing</PillButton></div>
    </section>
  )
}