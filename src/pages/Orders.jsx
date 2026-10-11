import { useEffect, useState } from 'react'
import { getMyOrders } from '../lib/api'
import { orderLink } from '../lib/whatsapp'
import { useApp } from '../lib/AppContext'
import EmptyState from '../components/EmptyState'
import Seo from '../components/Seo'

export const statusStyle = { pending: 'bg-amber-100', confirmed: 'bg-blue-100', processing: 'bg-indigo-100', shipped: 'bg-purple-100', delivered: 'bg-green-100', cancelled: 'bg-red-100' }

export default function Orders() {
  const { user, ready } = useApp()
  const [orders, setOrders] = useState(null)
  useEffect(() => { if (ready && user) getMyOrders().then(setOrders); else if (ready) setOrders([]) }, [ready, user])

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-32">
      <Seo title="My orders" description="Your orders and their status" />
      <h1 className="text-center font-mono text-3xl font-bold">My orders</h1>
      <div className="mt-8 space-y-4">
        {ready && !user ? <EmptyState title="Log in to see your orders" text="Orders are linked to your account." actionLabel="Log in" actionTo="/login" />
          : !orders ? <div className="h-40 animate-pulse rounded-card bg-white" />
          : orders.length === 0 ? <EmptyState title="No orders yet" text="Your orders will appear here." actionLabel="Browse products" actionTo="/cool-stuff" />
          : orders.map((o) => (
            <article key={o.id} className="rounded-card bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-mono font-bold">{o.number}</h2>
                <span className={`rounded-full px-3 py-1 font-mono text-xs font-bold capitalize ${statusStyle[o.status]}`}>{o.status}</span>
              </div>
              <ul className="mt-3 space-y-1 font-mono text-sm">{o.items.map((i) => <li key={i.productId} className="flex justify-between"><span>{i.name} × {i.qty}</span><span>₹{(i.price * i.qty).toLocaleString('en-IN')}</span></li>)}</ul>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 font-mono text-sm">
                <span>{new Date(o.createdAt).toLocaleDateString()}</span><strong>₹{o.total.toLocaleString('en-IN')}</strong>
              </div>
              <a href={orderLink(o)} target="_blank" rel="noopener" className="mt-2 inline-block min-h-11 py-3 text-xs font-bold underline">Open WhatsApp chat again</a>
            </article>
          ))}
      </div>
    </main>
  )
}
