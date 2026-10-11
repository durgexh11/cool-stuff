import { useState } from 'react'
import PillButton from './PillButton'
import RoundIconButton from './RoundIconButton'
import { ArrowIcon, ArrowLeftIcon, WhatsAppIcon, LinkIcon, ShareIcon } from './Icons'

const inr = (n) => `₹${n.toLocaleString('en-IN')}`

// Reference 1 style: big rounded card on a colour gradient, switchable featured products.
export default function HeroCard({ products }) {
  const [i, setI] = useState(0)
  const [img, setImg] = useState(0)
  const p = products[i]
  const next = products[(i + 1) % products.length]
  const go = (d) => { setI((i + d + products.length) % products.length); setImg(0) }
  const c = p.category

  return (
    <section className="page-gradient px-4 pb-16 pt-28" style={{ '--accent-from': c?.from, '--accent-to': c?.to }}>
      <div className="relative mx-auto max-w-6xl rounded-hero bg-white/25 p-6 shadow-hero backdrop-blur-sm md:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_1.2fr_auto]">
          <div className="order-2 md:order-1">
            <div className="mb-5 flex gap-2">
              <RoundIconButton label="Previous product" onClick={() => go(-1)}><ArrowLeftIcon /></RoundIconButton>
              <RoundIconButton label="Next product" onClick={() => go(1)}><ArrowIcon /></RoundIconButton>
            </div>
            <h1 key={p.id} className="fade-up text-4xl font-extrabold leading-[1.05] md:text-5xl">{p.name}</h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink/80">{p.shortDescription}</p>
            <PillButton to={`/cool-stuff/${p.slug}`} variant="light" icon={<ArrowIcon />} className="mt-6">Take a look</PillButton>
            <div className="mt-8 hidden gap-2 md:flex" aria-hidden="true">
              {[WhatsAppIcon, LinkIcon, ShareIcon].map((Ic, k) => <span key={k} className="grid size-9 place-items-center rounded-full bg-white/60"><Ic /></span>)}
            </div>
          </div>

          <div className="order-1 text-center md:order-2">
            <img key={p.id + img} src={p.images[img]} alt={p.name} className="fade-up mx-auto aspect-square w-full max-w-md rounded-[36px] object-cover" />
            <div className="mt-4 flex justify-center gap-2">
              {p.images.map((src, k) => (
                <button key={k} onClick={() => setImg(k)} aria-label={`Show image ${k + 1}`} aria-pressed={img === k}
                  className={`size-11 overflow-hidden rounded-full border-2 ${img === k ? 'border-ink' : 'border-white/70'}`}>
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
            <p className="mt-3 font-mono text-xs text-ink/70">{p.tags.slice(0, 3).join(' · ')}</p>
          </div>

          <div className="order-3 flex items-end justify-between gap-4 md:flex-col md:items-end md:justify-center md:gap-10">
            <div className="md:text-right">
              <p className="font-mono text-3xl font-bold">{inr(p.price)}</p>
              {p.discount > 0 && <p className="font-mono text-sm text-ink/60 line-through">{inr(p.originalPrice)}</p>}
            </div>
            <button onClick={() => go(1)} aria-label={`Next: ${next.name}`}
              className="flex items-center gap-3 rounded-full bg-white/70 p-1.5 pr-4 text-left transition hover:bg-white">
              <img src={next.images[0]} alt="" className="size-12 rounded-full object-cover" />
              <span className="hidden text-xs font-bold sm:block">Next<br /><span className="font-mono font-normal">{next.name}</span></span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
