import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProduct, getRelated, track } from '../lib/api'
import { deleteReview, getReviews, saveReview, preparePhoto, MAX_PHOTOS } from '../lib/reviews'
import { useApp } from '../lib/AppContext'
import RoundIconButton from '../components/RoundIconButton'
import PillButton from '../components/PillButton'
import ProductGrid from '../components/ProductGrid'
import EmptyState from '../components/EmptyState'
import Seo from '../components/Seo'
import { HeartIcon, ShareIcon, LinkIcon, WhatsAppIcon, MinusIcon, PlusIcon, StarIcon, CartIcon, CloseIcon } from '../components/Icons'

const inr = (n) => `₹${n.toLocaleString('en-IN')}`
const Stars = ({ value }) => (
  <span className="inline-flex text-amber-500" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} filled={n <= Math.round(value)} />)}
  </span>
)

export default function ProductDetail() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { user, wishlist, toggleWishlist, addToCart, notify, run } = useApp()
  const [p, setP] = useState(null)
  const [state, setState] = useState('loading')
  const [img, setImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [related, setRelated] = useState([])
  const [reviews, setReviews] = useState([])
  const [rate, setRate] = useState(5)
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([])
  const [removeOld, setRemoveOld] = useState(false)
  const [posting, setPosting] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const fileRef = useRef(null)

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  useEffect(() => {
    if (!lightbox) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const loadAll = async () => {
    try {
      const prod = await getProduct(slug)
      if (!prod) { setState('missing'); return null }
      setP(prod); setState('ok')
      setReviews(await getReviews(prod.id)); setRelated(await getRelated(prod))
      return prod
    } catch { setState('error'); return null }
  }
  useEffect(() => { setState('loading'); setImg(0); loadAll().then((prod) => prod && track(prod.id, 'view')) }, [slug]) // eslint-disable-line

  if (state === 'loading') return <main className="page-gradient min-h-screen px-4 pt-32"><div className="mx-auto h-[28rem] max-w-6xl animate-pulse rounded-hero bg-white/30" /></main>
  if (state !== 'ok') return <main className="px-4 pt-40"><EmptyState title={state === 'missing' ? 'Product not found' : 'Something went wrong'} text="This product may have been removed." actionLabel="Browse products" actionTo="/cool-stuff" /></main>

  const url = location.href
  const liked = wishlist.includes(p.id)
  const mine = reviews.find((r) => r.userId === user?.id)
  const needLogin = () => { notify('Please log in first', 'error'); nav('/login', { state: { from: location.pathname } }) }

  const share = async (kind) => {
    track(p.id, 'click')
    const t = encodeURIComponent(`${p.name} on Cool Stuff`), u = encodeURIComponent(url)
    if (kind === 'native') return navigator.share?.({ title: p.name, url }).catch(() => {})
    if (kind === 'copy') { await navigator.clipboard.writeText(url); return notify('Link copied') }
    const links = { wa: `https://wa.me/?text=${t}%20${u}`, fb: `https://www.facebook.com/sharer/sharer.php?u=${u}`, x: `https://twitter.com/intent/tweet?text=${t}&url=${u}` }
    return window.open(links[kind], '_blank', 'noopener')
  }
  const orderNow = async () => {
    if (!user) return needLogin()
    track(p.id, 'whatsapp_click')
    const r = await addToCart(p.id, qty)
    if (r.ok) nav('/cart')
    return null
  }

  const onPickPhotos = async (e) => {
    const picked = [...e.target.files]
    e.target.value = ''
    if (!picked.length) return
    const room = Math.max(MAX_PHOTOS - photos.length, 0)
    if (picked.length > room) notify(`You can add up to ${MAX_PHOTOS} photos`, 'error')
    setPreparing(true)
    const ready = []
    for (const f of picked.slice(0, room)) {
      try { ready.push(await preparePhoto(f)) } catch (err) { notify(err.message, 'error') }
    }
    setPreparing(false)
    setPhotos((list) => [...list, ...ready].slice(0, MAX_PHOTOS))
  }
  const dropPhoto = (i) => setPhotos((list) => list.filter((_, k) => k !== i))

  const submitReview = async (e) => {
    e.preventDefault()
    if (!user) return needLogin()
    setPosting(true)
    const r = await run(() => saveReview({ productId: p.id, rating: rate, body: text, photos, removePhotos: removeOld }), 'Review saved')
    setPosting(false)
    if (r.ok) { setText(''); setPhotos([]); setRemoveOld(false); loadAll() }
    return null
  }

  const jsonLd = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.shortDescription, brand: p.brand, offers: { '@type': 'Offer', priceCurrency: 'INR', price: p.price, availability: 'https://schema.org/InStock', url }, ...(p.reviewCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviewCount } } : {}) }

  return (
    <>
      <Seo title={p.name} description={p.shortDescription} image={p.images[0]} jsonLd={jsonLd} />
      <section className="page-gradient px-4 pb-12 pt-28" style={{ '--accent-from': p.category?.from, '--accent-to': p.category?.to }}>
        <div className="mx-auto max-w-6xl rounded-hero bg-white/25 p-6 shadow-hero backdrop-blur-sm md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="text-center">
              <img src={p.images[img]} alt={p.name} className="mx-auto aspect-square w-full max-w-md rounded-[36px] object-cover" />
              <div className="mt-4 flex justify-center gap-2">
                {p.images.map((s, k) => (
                  <button key={k} onClick={() => setImg(k)} aria-label={`Show image ${k + 1}`} aria-pressed={img === k} className={`size-12 overflow-hidden rounded-full border-2 ${img === k ? 'border-ink' : 'border-white/70'}`}>
                    <img src={s} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-xs"><Link to={`/cool-stuff?category=${p.category?.slug}`} className="underline">{p.category?.name}</Link>{p.featured && ' · Featured'}{p.trending && ' · Trending'}</p>
              <h1 className="mt-2 text-4xl font-extrabold leading-tight md:text-5xl">{p.name}</h1>
              <div className="mt-3 flex items-center gap-2 text-sm"><Stars value={p.rating} /><span className="font-mono">{p.reviewCount ? `${p.rating} / 5 (${p.reviewCount})` : 'No reviews yet'}</span></div>
              <p className="mt-4 text-sm leading-relaxed text-ink/80">{p.description}</p>
              <div className="mt-5 flex items-end gap-3">
                <span className="font-mono text-4xl font-bold">{inr(p.price)}</span>
                {p.discount > 0 && <><span className="font-mono text-ink/60 line-through">{inr(p.originalPrice)}</span><span className="chip" data-on="true">-{p.discount}%</span></>}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2" role="group" aria-label="Quantity">
                  <RoundIconButton label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}><MinusIcon /></RoundIconButton>
                  <span className="w-8 text-center font-mono font-bold">{qty}</span>
                  <RoundIconButton label="Increase quantity" onClick={() => setQty((q) => Math.min(99, q + 1))}><PlusIcon /></RoundIconButton>
                </div>
                <PillButton variant="light" icon={<CartIcon />} onClick={() => (user ? addToCart(p.id, qty) : needLogin())}>Add to cart</PillButton>
                <PillButton onClick={orderNow} icon={<WhatsAppIcon />}>Order on WhatsApp</PillButton>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <RoundIconButton label={liked ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={liked} active={liked} onClick={() => (user ? toggleWishlist(p.id) : needLogin())}><HeartIcon filled={liked} /></RoundIconButton>
                <RoundIconButton label="Share on WhatsApp" onClick={() => share('wa')}><WhatsAppIcon /></RoundIconButton>
                <RoundIconButton label="Copy link" onClick={() => share('copy')}><LinkIcon /></RoundIconButton>
                <RoundIconButton label="Share on Facebook" onClick={() => share('fb')}><span className="font-bold">f</span></RoundIconButton>
                <RoundIconButton label="Share on X" onClick={() => share('x')}><span className="font-bold">X</span></RoundIconButton>
                {navigator.share && <RoundIconButton label="Share" onClick={() => share('native')}><ShareIcon /></RoundIconButton>}
              </div>
              <p className="mt-4 font-mono text-xs text-ink/70">Tags: {p.tags.join(', ')}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-card bg-white p-6 shadow-card"><h2 className="font-mono font-bold">Pros</h2><ul className="mt-3 space-y-2 text-sm">{p.pros.map((x) => <li key={x}>＋ {x}</li>)}</ul></div>
          <div className="rounded-card bg-white p-6 shadow-card"><h2 className="font-mono font-bold">Cons</h2><ul className="mt-3 space-y-2 text-sm">{p.cons.map((x) => <li key={x}>－ {x}</li>)}</ul></div>
        </div>
        {p.specs.length > 0 && (
          <div className="rounded-card bg-white p-6 shadow-card"><h2 className="font-mono font-bold">Specifications</h2>
            <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">{p.specs.map((s) => <div key={s.label} className="flex justify-between border-b border-slate-100 py-2"><dt className="text-ink/60">{s.label}</dt><dd className="font-mono">{s.value}</dd></div>)}</dl>
          </div>
        )}

        <section className="rounded-card bg-white p-6 shadow-card">
          <h2 className="font-mono font-bold">Reviews ({reviews.length})</h2>
          <form onSubmit={submitReview} className="mt-4 space-y-3">
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} aria-label={`${n} stars`} onClick={() => setRate(n)} className={`grid size-11 place-items-center rounded-full ${n <= rate ? 'text-amber-500' : 'text-slate-300'}`}><StarIcon /></button>)}
            </div>
            <textarea className="input bg-soft/60" placeholder={mine ? 'Update your review' : 'Share your thoughts'} aria-label="Your review" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} required />

            <div>
              <label className="chip cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-ink">
                <span aria-hidden="true">＋&nbsp;</span>Add photos (max {MAX_PHOTOS})
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={onPickPhotos} disabled={photos.length >= MAX_PHOTOS || preparing} />
              </label>
              <span className="ml-3 text-xs text-ink/60">{preparing ? 'Preparing photos…' : 'JPG, PNG or WebP. Large photos are resized for you.'}</span>
              {previews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {previews.map((src, i) => (
                    <div key={src} className="text-center">
                      <img src={src} alt={`Selected photo ${i + 1}`} className="size-20 rounded-[16px] object-cover" />
                      <button type="button" className="min-h-11 text-xs font-bold underline" onClick={() => dropPhoto(i)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              {mine?.images.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-ink/60">Your current photos{photos.length > 0 ? ' (new photos will replace these)' : ''}:</p>
                  <div className="mt-2 flex flex-wrap gap-2">{mine.images.map((s) => <img key={s} src={s} alt="Your current review" className={`size-14 rounded-[12px] object-cover ${removeOld ? 'opacity-30' : ''}`} />)}</div>
                  <label className="mt-1 flex min-h-11 items-center gap-2 text-xs font-bold"><input type="checkbox" checked={removeOld} onChange={(e) => setRemoveOld(e.target.checked)} /> Remove my current photos</label>
                </div>
              )}
            </div>
            <PillButton type="submit" disabled={posting || preparing}>{posting ? 'Posting…' : mine ? 'Update review' : 'Post review'}</PillButton>
          </form>

          <div className="mt-6 space-y-4">
            {reviews.length === 0 && <p className="text-sm text-ink/60">No reviews yet. Be the first one.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-[20px] bg-soft/60 p-4">
                <div className="flex items-center justify-between"><span className="font-mono text-sm font-bold">{r.userName}</span><Stars value={r.rating} /></div>
                <p className="mt-2 text-sm">{r.body}</p>
                {r.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.images.map((s, k) => (
                      <button key={s} type="button" onClick={() => setLightbox(s)} aria-label={`Open review photo ${k + 1}`} className="overflow-hidden rounded-[16px]">
                        <img src={s} alt={`Review photo ${k + 1} by ${r.userName}`} loading="lazy" className="size-20 object-cover transition hover:scale-105" />
                      </button>
                    ))}
                  </div>
                )}
                {r.userId === user?.id && <button className="mt-2 min-h-11 text-xs font-bold underline" onClick={async () => { const x = await run(() => deleteReview(r.id), 'Review deleted'); if (x.ok) loadAll() }}>Delete my review</button>}
              </div>
            ))}
          </div>
        </section>
        {related.length > 0 && <section><h2 className="mb-6 text-center font-mono text-2xl font-bold">Related products</h2><ProductGrid products={related} /></section>}
      </main>

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label="Review photo" className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Review" className="max-h-[85vh] max-w-full rounded-card object-contain" onClick={(e) => e.stopPropagation()} />
          <RoundIconButton label="Close photo" className="absolute right-4 top-4" onClick={() => setLightbox(null)}><CloseIcon /></RoundIconButton>
        </div>
      )}
    </>
  )
}