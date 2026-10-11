import { useCallback, useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import * as api from '../lib/api'
import { adminReviews, deleteReview } from '../lib/reviews'
import { useApp } from '../lib/AppContext'
import PillButton from '../components/PillButton'
import EmptyState from '../components/EmptyState'
import RoundIconButton from '../components/RoundIconButton'
import { MenuIcon, CloseIcon } from '../components/Icons'
import { statusStyle } from './Orders'
import Seo from '../components/Seo'

const tabs = [['dashboard', 'Dashboard'], ['products', 'Products'], ['orders', 'Orders'], ['reviews', 'Reviews'], ['categories', 'Categories'], ['users', 'Users'], ['notifications', 'Notifications']]
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`
const Card = ({ children, className = '' }) => <div className={`rounded-card bg-white p-5 shadow-card ${className}`}>{children}</div>
const Skeleton = () => <div className="h-40 animate-pulse rounded-card bg-white" />

function useLoad(fn, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const reload = useCallback(() => fn().then((d) => { setData(d); setError('') }).catch((e) => setError(e.message)), deps) // eslint-disable-line
  useEffect(() => { reload() }, [reload])
  return [data, error, reload]
}

export default function Admin() {
  const { user, ready } = useApp()
  const { tab = 'dashboard' } = useParams()
  const [open, setOpen] = useState(false)
  if (!ready) return <main className="px-4 pt-40"><Skeleton /></main>
  if (user?.role !== 'admin') return <main className="px-4 pt-40"><EmptyState title="Admins only" text="You do not have access to this area." actionLabel="Go home" actionTo="/" /></main>
  const Page = { dashboard: Dashboard, products: Products, orders: Orders, reviews: Reviews, categories: Categories, users: Users, notifications: Notifications }[tab] || Dashboard

  const nav = (
    <nav aria-label="Admin" className="space-y-1">
      {tabs.map(([k, l]) => <NavLink key={k} to={`/admin/${k}`} onClick={() => setOpen(false)} className={({ isActive }) => `block min-h-11 rounded-full px-4 py-3 font-mono text-sm font-bold ${isActive ? 'bg-ink text-white' : 'hover:bg-white'}`}>{l}</NavLink>)}
    </nav>
  )
  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-28">
      <Seo title="Admin" description="Admin panel" />
      <div className="mb-4 flex items-center justify-between md:hidden"><h1 className="font-mono text-xl font-bold">Admin</h1><RoundIconButton label="Admin menu" onClick={() => setOpen(!open)}>{open ? <CloseIcon /> : <MenuIcon />}</RoundIconButton></div>
      {open && <Card className="mb-4 md:hidden">{nav}</Card>}
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">{nav}</aside>
        <section className="min-w-0"><Page /></section>
      </div>
    </main>
  )
}

function Dashboard() {
  const [range, setRange] = useState('all')
  const [s, error] = useLoad(() => api.adminStats(range), [range])
  const [revs] = useLoad(adminReviews)
  if (error) return <EmptyState title="Could not load stats" text={error} />
  if (!s) return <Skeleton />
  const stat = (l, v) => <Card key={l}><p className="font-mono text-xs text-ink/60">{l}</p><p className="mt-1 font-mono text-2xl font-bold">{v}</p></Card>
  const list = (rows) => rows.length ? rows.map((r, i) => <li key={i} className="flex justify-between py-1 text-sm"><span className="truncate">{r.name}</span><span className="font-mono">{r.n}</span></li>) : <li className="text-sm text-ink/60">Nothing yet</li>
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">{[['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All time']].map(([v, l]) => <button key={v} className="chip" data-on={range === v} onClick={() => setRange(v)}>{l}</button>)}</div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[['Total products', s.totalProducts], ['Published', s.published], ['Drafts', s.drafts], ['Archived', s.archived], ['Users', s.users], ['Reviews', s.reviews], ['Orders', s.orders], ['Pending orders', s.pending], ['Product views', s.views], ['Clicks', s.clicks], ['Wishlist adds', s.wishlist], ['Add to cart', s.carts]].map(([l, v]) => stat(l, v))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h2 className="font-mono font-bold">Most viewed</h2><ul className="mt-2">{list(s.mostViewed)}</ul></Card>
        <Card><h2 className="font-mono font-bold">Most ordered</h2><ul className="mt-2">{list(s.mostOrdered)}</ul></Card>
        <Card><h2 className="font-mono font-bold">Recent orders</h2><ul className="mt-2">{s.recentOrders.length ? s.recentOrders.map((o) => <li key={o.id} className="flex justify-between py-1 text-sm"><span className="font-mono">{o.number}</span><span>{inr(o.total)}</span></li>) : <li className="text-sm text-ink/60">No orders</li>}</ul></Card>
        <Card>
          <h2 className="font-mono font-bold">Recent reviews</h2>
          <ul className="mt-2 space-y-3">
            {revs?.length ? revs.slice(0, 5).map((r) => (
              <li key={r.id} className="text-sm">
                <p>{r.rating}/5 · {r.userName}: {r.body.slice(0, 40)}</p>
                {r.images.length > 0 && (
                  <div className="mt-1 flex gap-2">
                    {r.images.map((src, k) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open review photo ${k + 1}`}>
                        <img src={src} alt={`Review photo ${k + 1}`} loading="lazy" className="size-12 rounded-[10px] object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            )) : <li className="text-sm text-ink/60">No reviews</li>}
          </ul>
        </Card>
      </div>
    </div>
  )
}

const blank = { name: '', shortDescription: '', description: '', price: '', originalPrice: '', brand: '', categoryId: '', subcategory: '', tags: [], pros: [], cons: [], specs: [], images: [], featured: false, trending: false, status: 'draft' }
const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean)

function Products() {
  const { run, notify } = useApp()
  const [list, error, reload] = useLoad(api.adminProducts)
  const [cats] = useLoad(api.getCategories)
  const [q, setQ] = useState(''); const [st, setSt] = useState('')
  const [edit, setEdit] = useState(null)

  if (error) return <EmptyState title="Could not load products" text={error} />
  if (!list || !cats) return <Skeleton />
  const shown = list.filter((p) => (!st || p.status === st) && p.name.toLowerCase().includes(q.toLowerCase()))
  const act = async (fn, msg) => { await run(fn, msg); reload() }

  if (edit) return <ProductForm initial={edit} cats={cats} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload() }} notify={notify} run={run} />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search products" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="chip" aria-label="Status filter" value={st} onChange={(e) => setSt(e.target.value)}><option value="">All status</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        <PillButton onClick={() => setEdit({ ...blank, categoryId: cats[0]?.id || '' })}>Add product</PillButton>
      </div>
      {shown.length === 0 && <EmptyState title="No products" text="Add your first product." />}
      {shown.map((p) => (
        <Card key={p.id} className="flex flex-wrap items-center gap-4">
          <img src={p.images[0]} alt="" className="size-16 rounded-[16px] object-cover" />
          <div className="min-w-0 flex-1"><p className="truncate font-mono text-sm font-bold">{p.name}</p><p className="font-mono text-xs text-ink/60">{inr(p.price)} · {p.category?.name} · {p.status}{p.featured ? ' · featured' : ''}{p.trending ? ' · trending' : ''}</p></div>
          <div className="flex flex-wrap gap-2">
            <PillButton variant="glass" onClick={() => setEdit({ ...p, tags: p.tags, images: p.realImages })}>Edit</PillButton>
            {p.status !== 'published' && <PillButton variant="glass" onClick={() => act(() => api.adminSetProductStatus(p.id, 'published'), 'Published')}>Publish</PillButton>}
            {p.status !== 'archived' && <PillButton variant="glass" onClick={() => act(() => api.adminSetProductStatus(p.id, 'archived'), 'Archived')}>Archive</PillButton>}
            <PillButton variant="danger" onClick={() => confirm(`Delete ${p.name}?`) && act(() => api.adminDeleteProduct(p.id), 'Deleted')}>Delete</PillButton>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ProductForm({ initial, cats, onClose, onSaved, notify, run }) {
  const [f, setF] = useState({ ...initial, tagsText: initial.tags.join(', '), prosText: initial.pros.join('\n'), consText: initial.cons.join('\n'), specsText: initial.specs.map((s) => `${s.label}: ${s.value}`).join('\n') })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const cat = cats.find((c) => c.id === f.categoryId)

  const pick = (slot, file) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return notify('Use a JPG, PNG or WebP image', 'error')
    if (file.size > 2 * 1024 * 1024) return notify('Image must be under 2 MB', 'error')
    const r = new FileReader()
    r.onload = () => { const imgs = [...f.images]; imgs[slot] = r.result; setF((x) => ({ ...x, images: imgs })) }
    r.onerror = () => notify('Could not read the image', 'error')
    r.readAsDataURL(file)
  }
  const removeImg = (slot) => setF({ ...f, images: f.images.filter((_, i) => i !== slot) })

  const save = async (e) => {
    e.preventDefault(); setBusy(true)
    const specs = lines(f.specsText).map((l) => { const [label, ...v] = l.split(':'); return { label: label.trim(), value: v.join(':').trim() } })
    const { tagsText, prosText, consText, specsText, ...rest } = f // eslint-disable-line
    const r = await run(() => api.adminSaveProduct({ ...rest, images: f.images.filter(Boolean), tags: tagsText.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean), pros: lines(prosText), cons: lines(consText), specs }), 'Product saved')
    setBusy(false); if (r.ok) onSaved()
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-card bg-white p-6 shadow-card">
      <h2 className="font-mono text-lg font-bold">{f.id ? 'Edit product' : 'Add product'}</h2>
      <input className="input bg-soft/60" placeholder="Product name" aria-label="Product name" value={f.name} onChange={set('name')} required />
      <input className="input bg-soft/60" placeholder="Short description" aria-label="Short description" value={f.shortDescription} onChange={set('shortDescription')} />
      <textarea className="input bg-soft/60" placeholder="Full description" aria-label="Full description" value={f.description} onChange={set('description')} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className="input bg-soft/60" type="number" min="0" placeholder="Price" aria-label="Price" value={f.price} onChange={set('price')} required />
        <input className="input bg-soft/60" type="number" min="0" placeholder="Original price" aria-label="Original price" value={f.originalPrice} onChange={set('originalPrice')} />
        <input className="input bg-soft/60" placeholder="Brand" aria-label="Brand" value={f.brand} onChange={set('brand')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select className="input bg-soft/60" aria-label="Category" value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value, subcategory: '' })}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className="input bg-soft/60" aria-label="Subcategory" value={f.subcategory} onChange={set('subcategory')}><option value="">No subcategory</option>{cat?.subs?.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="input bg-soft/60" aria-label="Status" value={f.status} onChange={set('status')}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
      </div>
      <input className="input bg-soft/60" placeholder="Tags, comma separated" aria-label="Tags" value={f.tagsText} onChange={set('tagsText')} />
      <div className="grid gap-3 sm:grid-cols-3">
        <textarea className="input bg-soft/60" placeholder="Pros (one per line)" aria-label="Pros" value={f.prosText} onChange={set('prosText')} />
        <textarea className="input bg-soft/60" placeholder="Cons (one per line)" aria-label="Cons" value={f.consText} onChange={set('consText')} />
        <textarea className="input bg-soft/60" placeholder="Specs (Label: value, one per line)" aria-label="Specifications" value={f.specsText} onChange={set('specsText')} />
      </div>
      <div className="flex gap-4 text-sm font-bold">
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Featured</label>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={f.trending} onChange={set('trending')} /> Trending</label>
      </div>
      <div>
        <p className="font-mono text-sm font-bold">Images (max 3)</p>
        <p className="mb-2 text-xs text-ink/60">Tip: square or 4:5, clean background, at least 800×800 px. JPG, PNG or WebP.</p>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((slot) => (
            <div key={slot} className="rounded-[20px] bg-soft/60 p-2 text-center">
              {f.images[slot] ? <img src={f.images[slot]} alt={`Image ${slot + 1}`} className="aspect-square w-full rounded-[14px] object-cover" /> : <div className="grid aspect-square place-items-center text-xs text-ink/50">Empty</div>}
              <label className="mt-2 inline-block min-h-11 cursor-pointer py-3 text-xs font-bold underline">{f.images[slot] ? 'Replace' : 'Upload'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(Math.min(slot, f.images.length), e.target.files[0])} /></label>
              {f.images[slot] && <button type="button" className="ml-2 min-h-11 text-xs font-bold text-red-600" onClick={() => removeImg(slot)}>Delete</button>}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2"><PillButton type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</PillButton><PillButton type="button" variant="glass" onClick={onClose}>Cancel</PillButton></div>
    </form>
  )
}

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
function Orders() {
  const { run } = useApp()
  const [list, error, reload] = useLoad(api.adminOrders)
  const [filter, setFilter] = useState('')
  if (error) return <EmptyState title="Could not load orders" text={error} />
  if (!list) return <Skeleton />
  const shown = list.filter((o) => !filter || o.status === filter)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2"><button className="chip" data-on={!filter} onClick={() => setFilter('')}>All</button>{ORDER_STATUSES.map((s) => <button key={s} className="chip capitalize" data-on={filter === s} onClick={() => setFilter(s)}>{s}</button>)}</div>
      {shown.length === 0 && <EmptyState title="No orders" text="Orders will show up here." />}
      {shown.map((o) => (
        <Card key={o.id}>
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-mono font-bold">{o.number}</h3>
            <select aria-label="Order status" className={`rounded-full px-3 py-2 font-mono text-xs font-bold capitalize ${statusStyle[o.status]}`} value={o.status} onChange={async (e) => { await run(() => api.adminSetOrderStatus(o.id, e.target.value), 'Status updated'); reload() }}>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <p className="mt-2 text-sm">{o.name} · {o.phone}</p><p className="text-sm text-ink/70">{o.address}{o.details ? `, ${o.details}` : ''}</p>
          <ul className="mt-2 font-mono text-xs">{o.items.map((i) => <li key={i.productId}>{i.name} × {i.qty} = {inr(i.price * i.qty)}</li>)}</ul>
          <p className="mt-2 font-mono font-bold">{inr(o.total)}</p>
        </Card>
      ))}
    </div>
  )
}

function Reviews() {
  const { run } = useApp()
  const [list, error, reload] = useLoad(adminReviews)
  const [q, setQ] = useState(''); const [rating, setRating] = useState('')
  if (error) return <EmptyState title="Could not load reviews" text={error} />
  if (!list) return <Skeleton />
  const shown = list.filter((r) => (!rating || r.rating === Number(rating)) && `${r.body} ${r.userName} ${r.productName}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="space-y-4">
      <div className="flex gap-2"><input className="input max-w-xs" placeholder="Search reviews" aria-label="Search reviews" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="chip" aria-label="Rating filter" value={rating} onChange={(e) => setRating(e.target.value)}><option value="">All ratings</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></div>
      {shown.length === 0 && <EmptyState title="No reviews" text="Reviews from customers appear here." />}
      {shown.map((r) => (
        <Card key={r.id} className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-sm font-bold">{r.productName} · {r.rating}/5</p>
            <p className="text-xs text-ink/60">{r.userName}</p>
            <p className="mt-1 text-sm">{r.body}</p>
            {r.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {r.images.map((s, k) => (
                  <a key={s} href={s} target="_blank" rel="noopener noreferrer" aria-label={`Open review photo ${k + 1}`}>
                    <img src={s} alt={`Review photo ${k + 1}`} loading="lazy" className="size-16 rounded-[12px] object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <PillButton variant="danger" onClick={() => confirm('Delete this review and its photos?') && run(() => deleteReview(r.id), 'Review deleted').then(reload)}>Delete</PillButton>
        </Card>
      ))}
    </div>
  )
}

function Categories() {
  const { run } = useApp()
  const [list, error, reload] = useLoad(api.getCategories)
  const [edit, setEdit] = useState(null)
  if (error) return <EmptyState title="Could not load categories" text={error} />
  if (!list) return <Skeleton />
  const save = async (e) => { e.preventDefault(); const r = await run(() => api.adminSaveCategory({ ...edit, subs: edit.subsText.split(',').map((s) => s.trim()).filter(Boolean) }), 'Category saved'); if (r.ok) { setEdit(null); reload() } }
  return (
    <div className="space-y-4">
      <PillButton onClick={() => setEdit({ name: '', from: '#fb923c', to: '#fbbf24', soft: ['#ffedd5', '#fdba74'], subsText: '' })}>Add category</PillButton>
      {edit && (
        <form onSubmit={save} className="space-y-3 rounded-card bg-white p-5 shadow-card">
          <input className="input bg-soft/60" placeholder="Category name" aria-label="Category name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required />
          <input className="input bg-soft/60" placeholder="Subcategories, comma separated" aria-label="Subcategories" value={edit.subsText} onChange={(e) => setEdit({ ...edit, subsText: e.target.value })} />
          <div className="flex items-center gap-4 text-sm font-bold"><label className="flex items-center gap-2">Accent from <input type="color" value={edit.from} onChange={(e) => setEdit({ ...edit, from: e.target.value })} /></label><label className="flex items-center gap-2">to <input type="color" value={edit.to} onChange={(e) => setEdit({ ...edit, to: e.target.value })} /></label><span className="h-8 w-24 rounded-full" style={{ background: `linear-gradient(135deg, ${edit.from}, ${edit.to})` }} /></div>
          <div className="flex gap-2"><PillButton type="submit">Save</PillButton><PillButton type="button" variant="glass" onClick={() => setEdit(null)}>Cancel</PillButton></div>
        </form>
      )}
      {list.map((c) => (
        <Card key={c.id} className="flex flex-wrap items-center gap-4">
          <span className="size-10 rounded-full" style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }} />
          <div className="flex-1"><p className="font-mono font-bold">{c.name}</p><p className="text-xs text-ink/60">{c.subs?.join(', ') || 'No subcategories'}</p></div>
          <PillButton variant="glass" onClick={() => setEdit({ ...c, subsText: (c.subs || []).join(', ') })}>Edit</PillButton>
          <PillButton variant="danger" onClick={() => confirm(`Delete ${c.name}?`) && run(() => api.adminDeleteCategory(c.id), 'Category deleted').then(reload)}>Delete</PillButton>
        </Card>
      ))}
    </div>
  )
}

function Users() {
  const [list, error] = useLoad(api.adminUsers)
  if (error) return <EmptyState title="Could not load users" text={error} />
  if (!list) return <Skeleton />
  return <div className="space-y-3">{list.map((u) => <Card key={u.id} className="flex flex-wrap justify-between gap-2 font-mono text-sm"><span><strong>{u.name}</strong> · {u.email}</span><span className="text-ink/60">Joined {new Date(u.createdAt).toLocaleDateString()} · {u.orders} orders · {u.reviews} reviews</span></Card>)}</div>
}

function Notifications() {
  const [list, error, reload] = useLoad(api.adminNotifications)
  if (error) return <EmptyState title="Could not load notifications" text={error} />
  if (!list) return <Skeleton />
  if (list.length === 0) return <EmptyState title="No notifications" text="New orders and reviews will show up here." />
  return (
    <div className="space-y-3">
      <PillButton variant="glass" onClick={async () => { await api.adminReadNotifications(); reload() }}>Mark all as read</PillButton>
      {list.map((n) => <Card key={n.id} className={`flex items-center justify-between gap-3 ${n.read ? 'opacity-60' : ''}`}><div><p className="text-sm font-bold">{!n.read && '● '}{n.message}</p><p className="font-mono text-xs text-ink/60">{new Date(n.createdAt).toLocaleString()}</p></div>{n.link && <NavLink className="chip" to={n.link}>Open</NavLink>}</Card>)}
    </div>
  )
}