import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCategories, getProducts } from '../lib/api'
import ProductGrid from '../components/ProductGrid'
import EmptyState from '../components/EmptyState'
import PillButton from '../components/PillButton'
import FeatureCard from '../components/FeatureCard'
import Seo from '../components/Seo'

const sorts = [['newest', 'Newest'], ['oldest', 'Oldest'], ['rated', 'Highest rated'], ['reviewed', 'Most reviewed'], ['viewed', 'Most viewed'], ['low', 'Lowest price'], ['high', 'Highest price']]

export default function Products() {
  const [sp, setSp] = useSearchParams()
  const [cats, setCats] = useState([])
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [q, setQ] = useState(sp.get('q') || '')

  const f = {
    q: sp.get('q') || '', category: sp.get('category') || '', sub: sp.get('sub') || '', sort: sp.get('sort') || 'newest',
    maxPrice: Number(sp.get('max')) || 0, minRating: Number(sp.get('rating')) || 0,
    featured: sp.get('featured') === '1', trending: sp.get('trending') === '1',
  }
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k === 'category') n.delete('sub'); setSp(n, { replace: true }); setPage(1) }
  const cat = cats.find((c) => c.slug === f.category)

  useEffect(() => { getCategories().then(setCats).catch(() => {}) }, [])
  useEffect(() => {
    setLoading(true); setError('')
    getProducts({ ...f, subcategory: f.sub, page, pageSize: 8 })
      .then(setData).catch(() => setError('Could not load products. Please try again.')).finally(() => setLoading(false))
  }, [sp, page]) // eslint-disable-line

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-32" style={cat && { '--accent-from': cat.from, '--accent-to': cat.to }}>
      <Seo title={cat ? cat.name : 'All products'} description="Browse, search and filter cool products." />
      <h1 className="text-center font-mono text-3xl font-bold md:text-4xl">{cat ? cat.name : 'All products'}</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ink/70">Search, filter and sort to find your next favourite thing.</p>
      {cat && <div className="page-gradient mx-auto mt-4 h-2 w-40 rounded-full" />}

      <form onSubmit={(e) => { e.preventDefault(); set('q', q.trim()) }} className="mx-auto mt-8 flex max-w-xl gap-2">
        <input className="input" placeholder="Search name, description or tags" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <PillButton type="submit">Search</PillButton>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button className="chip" data-on={!f.category} onClick={() => set('category', '')}>All</button>
        {cats.map((c) => <button key={c.id} className="chip" data-on={f.category === c.slug} onClick={() => set('category', c.slug)}>{c.name}</button>)}
      </div>
      {cat?.subs?.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {cat.subs.map((s) => <button key={s} className="chip" data-on={f.sub === s} onClick={() => set('sub', f.sub === s ? '' : s)}>{s}</button>)}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button className="chip" data-on={f.featured} onClick={() => set('featured', f.featured ? '' : '1')}>Featured</button>
        <button className="chip" data-on={f.trending} onClick={() => set('trending', f.trending ? '' : '1')}>Trending</button>
        <select aria-label="Maximum price" className="chip" value={f.maxPrice} onChange={(e) => set('max', e.target.value === '0' ? '' : e.target.value)}>
          <option value="0">Any price</option><option value="1000">Under ₹1,000</option><option value="3000">Under ₹3,000</option><option value="6000">Under ₹6,000</option>
        </select>
        <select aria-label="Minimum rating" className="chip" value={f.minRating} onChange={(e) => set('rating', e.target.value === '0' ? '' : e.target.value)}>
          <option value="0">Any rating</option><option value="3">3+ stars</option><option value="4">4+ stars</option>
        </select>
        <select aria-label="Sort" className="chip" value={f.sort} onChange={(e) => set('sort', e.target.value)}>
          {sorts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <section className="mt-10">
        {error ? <EmptyState title="Something went wrong" text={error} actionLabel="Try again" onAction={() => setSp(new URLSearchParams(sp))} />
          : !loading && data.items.length === 0 ? <EmptyState title="No results" text="Try a different search or clear the filters." actionLabel="Clear filters" onAction={() => { setQ(''); setSp({}) }} />
          : <ProductGrid products={data.items} loading={loading} />}
        {!loading && data.items.length < data.total && (
          <div className="mt-8 text-center"><PillButton onClick={() => setPage((p) => p + 1)}>Load more</PillButton></div>
        )}
      </section>
      <div className="mt-16"><FeatureCard title="Order on WhatsApp" text="No payment gateway. Add items to your cart, check out and we open WhatsApp with your order ready to send." actionLabel="View cart" actionTo="/cart" tone={cat ? [cat.soft?.[0] || '#fff', cat.from] : undefined} /></div>
    </main>
  )
}
