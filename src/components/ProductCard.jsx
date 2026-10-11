import { Link } from 'react-router-dom'
import { HeartIcon } from './Icons'
import { useApp } from '../lib/AppContext'
import { track } from '../lib/api'

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist, user, notify } = useApp()
  const liked = wishlist.includes(product.id)
  const like = () => (user ? toggleWishlist(product.id) : notify('Please log in to use your wishlist', 'error'))
  return (
    <article className="fade-up group rounded-card bg-white p-3 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-hover">
      <Link to={`/cool-stuff/${product.slug}`} onClick={() => track(product.id, 'click')} className="block overflow-hidden rounded-[20px]">
        <img src={product.images[0]} alt={product.name} loading="lazy" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
      </Link>
      <div className="flex items-start justify-between gap-2 px-2 pb-1 pt-3">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm font-bold">{product.name}</h3>
          <p className="mt-1 font-mono text-sm">₹{product.price.toLocaleString('en-IN')}
            {product.discount > 0 && <span className="ml-2 text-xs text-ink/40 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
          </p>
        </div>
        <button onClick={like} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={liked}
          className={`grid size-11 shrink-0 place-items-center rounded-full transition active:scale-90 ${liked ? 'text-red-500' : 'text-ink/50 hover:text-ink'}`}>
          <HeartIcon filled={liked} />
        </button>
      </div>
    </article>
  )
}
