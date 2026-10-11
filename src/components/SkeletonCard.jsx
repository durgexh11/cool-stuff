export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-card bg-white p-3 shadow-card" aria-hidden="true">
      <div className="aspect-square rounded-[20px] bg-slate-200" />
      <div className="mt-4 h-3 w-2/3 rounded-full bg-slate-200" />
      <div className="mb-2 mt-3 h-3 w-1/3 rounded-full bg-slate-200" />
    </div>
  )
}
