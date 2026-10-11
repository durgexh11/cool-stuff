import ProductCard from './ProductCard'
import SkeletonCard from './SkeletonCard'
export default function ProductGrid({ products, loading, count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {loading ? Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />) : products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
