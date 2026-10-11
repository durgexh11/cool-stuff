import { Link } from 'react-router-dom'
import Logo from './Logo'
import { WHATSAPP_NUMBER } from '../lib/whatsapp'
import { INSTAGRAM_URL } from '../lib/site'

const link = 'inline-flex min-h-11 items-center text-sm text-ink/70 hover:text-ink hover:underline'
const btn = 'inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition'

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
)

export default function Footer() {
  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, I have a question about Cool Stuff.')}`
  return (
    <footer className="px-4 pb-6 pt-16">
      <div className="mx-auto max-w-6xl rounded-hero bg-white p-8 shadow-card md:p-10">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink/70">
              Interesting, useful and unusual products from around the internet. Save what you love and order on WhatsApp.
            </p>
          </div>
          <nav aria-label="Shop">
            <h2 className="font-mono text-sm font-bold">Shop</h2>
            <ul className="mt-2">
              <li><Link className={link} to="/cool-stuff">All products</Link></li>
              <li><Link className={link} to="/wishlist">Wishlist</Link></li>
              <li><Link className={link} to="/orders">My orders</Link></li>
              <li><Link className={link} to="/#how-it-works">How ordering works</Link></li>
            </ul>
          </nav>
          <nav aria-label="Policies">
            <h2 className="font-mono text-sm font-bold">Policies</h2>
            <ul className="mt-2">
              <li><Link className={link} to="/policy/shipping">Shipping and delivery</Link></li>
              <li><Link className={link} to="/policy/returns">Returns and refunds</Link></li>
              <li><Link className={link} to="/policy/privacy">Privacy policy</Link></li>
              <li><Link className={link} to="/policy/terms">Terms of service</Link></li>
            </ul>
          </nav>
          <div>
            <h2 className="font-mono text-sm font-bold">Contact</h2>
            <p className="mt-2 text-sm text-ink/70">Questions about an order or a product? Message us on WhatsApp.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn} bg-ink text-white hover:bg-ink/90`}>
                Chat on WhatsApp
              </a>
              {INSTAGRAM_URL && (
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${btn} bg-soft text-ink hover:bg-soft/70`}>
                  <InstagramIcon />Instagram
                </a>
              )}
            </div>
          </div>
        </div>
        <p className="mt-8 border-t border-slate-100 pt-4 font-mono text-xs text-ink/50">© {new Date().getFullYear()} Cool Stuff. All rights reserved.</p>
      </div>
    </footer>
  )
}