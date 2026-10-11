import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearCart, createOrder, getCart, setCartQty } from '../lib/api'
import { orderLink } from '../lib/whatsapp'
import { useApp } from '../lib/AppContext'
import RoundIconButton from '../components/RoundIconButton'
import PillButton from '../components/PillButton'
import EmptyState from '../components/EmptyState'
import Seo from '../components/Seo'
import { MinusIcon, PlusIcon, TrashIcon, WhatsAppIcon } from '../components/Icons'

const inr = (n) => `₹${n.toLocaleString('en-IN')}`

export default function Cart() {
  const { user, ready, run, refresh } = useApp()
  const nav = useNavigate()
  const [items, setItems] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '', details: '' })
  const [busy, setBusy] = useState(false)

  const load = () => getCart().then(setItems)
  useEffect(() => { if (ready) user ? load() : setItems([]) }, [ready, user]) // eslint-disable-line
  useEffect(() => { if (user) setForm((f) => ({ ...f, name: f.name || user.name })) }, [user])

  if (ready && !user) return <main className="px-4 pt-40"><EmptyState title="Log in to use your cart" text="Your cart is saved to your account." actionLabel="Log in" actionTo="/login" /></main>
  if (!items) return <main className="mx-auto max-w-4xl px-4 pt-36"><div className="h-64 animate-pulse rounded-card bg-white" /></main>
  if (items.length === 0) return <main className="px-4 pt-40"><Seo title="Cart" description="Your cart" /><EmptyState title="Your cart is empty" text="Find something cool and add it here." actionLabel="Browse products" actionTo="/cool-stuff" /></main>

  const total = items.reduce((a, i) => a + i.product.price * i.qty, 0)
  const setQty = async (id, q) => { await run(() => setCartQty(id, q)); load() }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const checkout = async (e) => {
    e.preventDefault(); setBusy(true)
    // Order is saved first, then WhatsApp opens with the saved order details.
    const r = await run(() => createOrder(form))
    setBusy(false)
    if (r.ok) { window.open(orderLink(r.data), '_blank', 'noopener'); nav('/orders') }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-32">
      <Seo title="Cart & checkout" description="Review your cart and place your order on WhatsApp." />
      <h1 className="text-center font-mono text-3xl font-bold">Your cart</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          {items.map(({ product: p, qty }) => (
            <div key={p.id} className="flex items-center gap-4 rounded-card bg-white p-3 shadow-card">
              <img src={p.images[0]} alt={p.name} className="size-20 rounded-[18px] object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate font-mono text-sm font-bold">{p.name}</p><p className="font-mono text-sm">{inr(p.price)}</p></div>
              <div className="flex items-center gap-1">
                <RoundIconButton label="Decrease quantity" onClick={() => setQty(p.id, qty - 1)}><MinusIcon /></RoundIconButton>
                <span className="w-7 text-center font-mono text-sm">{qty}</span>
                <RoundIconButton label="Increase quantity" onClick={() => setQty(p.id, qty + 1)}><PlusIcon /></RoundIconButton>
                <RoundIconButton label="Remove item" onClick={() => setQty(p.id, 0)}><TrashIcon /></RoundIconButton>
              </div>
            </div>
          ))}
          <PillButton variant="glass" onClick={async () => { await run(clearCart); load() }}>Clear cart</PillButton>
        </div>
        <form onSubmit={checkout} className="space-y-3 rounded-card bg-white p-6 shadow-card">
          <h2 className="font-mono font-bold">Checkout</h2>
          <input className="input bg-soft/60" placeholder="Full name" aria-label="Full name" value={form.name} onChange={set('name')} required />
          <input className="input bg-soft/60" placeholder="Phone number" aria-label="Phone number" inputMode="tel" value={form.phone} onChange={set('phone')} required />
          <textarea className="input bg-soft/60" placeholder="Delivery address" aria-label="Delivery address" value={form.address} onChange={set('address')} required />
          <input className="input bg-soft/60" placeholder="Landmark / extra details (optional)" aria-label="Address details" value={form.details} onChange={set('details')} />
          <div className="flex justify-between border-t border-slate-100 pt-3 font-mono"><span>Total</span><span className="text-xl font-bold">{inr(total)}</span></div>
          <PillButton type="submit" disabled={busy} icon={<WhatsAppIcon />} className="w-full">{busy ? 'Placing order…' : 'Place order on WhatsApp'}</PillButton>
          <p className="text-xs text-ink/60">Your order is saved first. Payment is arranged in the WhatsApp chat.</p>
        </form>
      </div>
    </main>
  )
}
