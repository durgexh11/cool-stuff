import { useEffect, useState } from 'react'
import { getWishlistProducts } from '../lib/api'
import { useApp } from '../lib/AppContext'
import ProductGrid from '../components/ProductGrid'
import PillButton from '../components/PillButton'
import EmptyState from '../components/EmptyState'
import Seo from '../components/Seo'

export default function Wishlist() {
  const { user, ready, wishlist, addToCart } = useApp()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!ready) return
    if (!user) return setLoading(false)
    getWishlistProducts().then(setItems).finally(() => setLoading(false))
  }, [ready, user, wishlist])

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-32">
      <Seo title="Wishlist" description="Your saved products" />
      <h1 className="text-center font-mono text-3xl font-bold">Wishlist</h1>
      <div className="mt-8">
        {ready && !user ? <EmptyState title="Log in to see your wishlist" text="Your wishlist is private and saved to your account." actionLabel="Log in" actionTo="/login" />
          : !loading && items.length === 0 ? <EmptyState title="Nothing saved yet" text="Tap the heart on any product to save it." actionLabel="Browse products" actionTo="/cool-stuff" />
          : <>
              <ProductGrid products={items} loading={loading} count={4} />
              {items.length > 0 && <div className="mt-8 text-center"><PillButton onClick={async () => { for (const p of items) await addToCart(p.id, 1) }}>Add all to cart</PillButton></div>}
            </>}
      </div>
    </main>
  )
}
