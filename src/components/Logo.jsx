import { Link } from 'react-router-dom'

// White badge with an orange sparkle, the word "cool" and a dark "stuff" tag.
// Works on the orange hero, on category colours and on the grey background.
export default function Logo({ className = '' }) {
  return (
    <Link to="/" aria-label="Cool Stuff home" className={`group flex items-center gap-2 ${className}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-orange-500 shadow-card ring-1 ring-black/5 transition duration-300 group-hover:rotate-12">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
        </svg>
      </span>
      <span className="flex items-center gap-1.5 text-lg font-extrabold leading-none tracking-tight">
        cool
        <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-sm font-bold text-white">stuff</span>
      </span>
    </Link>
  )
}