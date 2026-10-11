import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getProducts } from '../lib/api'
import HeroCard from '../components/HeroCard'
import ProductGrid from '../components/ProductGrid'
import HowItWorks from '../components/HowItWorks'
import EmptyState from '../components/EmptyState'
import PillButton from '../components/PillButton'
import Seo from '../components/Seo'
import { ArrowIcon, SearchIcon, HeartIcon, WhatsAppIcon } from '../components/Icons'
import { INSTAGRAM_URL } from '../lib/site'

const perks = [
  { icon: SearchIcon, title: 'Hand-picked finds', text: 'Interesting, useful and unusual products, all in one place.' },
  { icon: HeartIcon, title: 'Save your favourites', text: 'Tap the heart to build a wishlist you can come back to.' },
  { icon: WhatsAppIcon, title: 'Order on WhatsApp', text: 'No payment on the website. We confirm everything in chat.' },
]

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [latest, setLatest] = useState([])
  const [more, setMore] = useState([])
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getProducts({ featured: true, pageSize: 5 }),
      getProducts({ trending: true, pageSize: 8 }),
      getProducts({ pageSize: 12 }),
      getCategories().catch(() => []),
    ])
      .then(([f, t, all, c]) => {
        setFeatured(f.items)
        setLatest(t.items)
        const seen = new Set(t.items.map((p) => p.id))
        setMore(all.items.filter((p) => !seen.has(p.id)).slice(0, 8))
        setCats(c || [])
      })
      .catch(() => setError('Could not load products. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Seo title="Discover cool stuff" description="Interesting, useful and unusual products. Save favourites and order on WhatsApp." />
      {featured.length > 0
        ? <HeroCard products={featured} />
        : <div className="page-gradient grid min-h-[60vh] place-items-center px-4 pt-28">{loading ? <p className="font-mono">Loading…</p> : <EmptyState title="No featured products" text="Check back soon." actionLabel="Browse all" actionTo="/cool-stuff" />}</div>}

      <main className="mx-auto max-w-6xl space-y-20 px-4 py-16">
        <section>
          <h2 className="text-center font-mono text-2xl font-bold">Trending now</h2>
          <p className="mx-auto mb-8 mt-2 max-w-md text-center text-sm text-ink/70">Fresh finds people are looking at this week.</p>
          {error ? <EmptyState title="Something went wrong" text={error} actionLabel="Reload" onAction={() => location.reload()} />
            : !loading && latest.length === 0 ? <EmptyState title="No products yet" text="New products will show up here." />
            : <ProductGrid products={latest} loading={loading} />}
          <div className="mt-8 text-center"><PillButton to="/cool-stuff" icon={<ArrowIcon />}>See all products</PillButton></div>
        </section>

        {cats.length > 0 && (
          <section aria-labelledby="cats-title">
            <h2 id="cats-title" className="text-center font-mono text-2xl font-bold">Shop by category</h2>
            <p className="mx-auto mb-8 mt-2 max-w-md text-center text-sm text-ink/70">Pick a mood and start exploring.</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {cats.map((c, i) => {
                const [a, b] = c.soft || [c.from, c.to]
                return (
                  <Link
                    key={c.id}
                    to={`/cool-stuff?category=${c.slug}`}
                    className="fade-up group flex min-h-44 flex-col justify-between rounded-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-hover"
                    style={{ background: `linear-gradient(135deg, ${a}, ${b})`, animationDelay: `${i * 60}ms` }}
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-white font-mono text-lg font-bold shadow-card" style={{ color: c.from }} aria-hidden="true">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <span>
                      <span className="block font-mono text-lg font-bold text-ink">{c.name}</span>
                      {c.subs?.length > 0 && <span className="mt-1 block text-xs text-ink/70">{c.subs.slice(0, 3).join(' · ')}</span>}
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ink">Explore <span className="transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section>
            <h2 className="text-center font-mono text-2xl font-bold">More to explore</h2>
            <p className="mx-auto mb-8 mt-2 max-w-md text-center text-sm text-ink/70">Something else might catch your eye.</p>
            <ProductGrid products={more} />
          </section>
        )}

        <section aria-label="Why Cool Stuff" className="grid gap-4 md:grid-cols-3">
          {perks.map((p) => (
            <div key={p.title} className="rounded-card bg-white p-6 text-center shadow-card">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-ink text-white"><p.icon /></span>
              <h3 className="mt-4 font-mono font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{p.text}</p>
            </div>
          ))}
        </section>

        {INSTAGRAM_URL && (
          <section className="overflow-hidden rounded-hero bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 p-8 text-center shadow-hero md:p-12">
            <p className="font-mono text-xs font-bold text-ink/70">New finds every week</p>
            <h2 className="mt-2 font-mono text-3xl font-bold text-ink md:text-4xl">Follow @cool_stuff</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink/80">See new products first and get ideas for what to buy next.</p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-white transition hover:bg-ink/90"
            >
              Open Instagram <span aria-hidden="true">→</span>
            </a>
          </section>
        )}

        <HowItWorks />
      </main>
    </>
  )
}