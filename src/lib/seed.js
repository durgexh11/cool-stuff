// Sample data for local development only. Replaced by Supabase data later.
const shapes = {
  lamp: '<rect x="185" y="140" width="30" height="190" rx="10" fill="#fff"/><path d="M130 150 L270 150 L240 80 L160 80Z" fill="#fff"/>',
  box: '<rect x="110" y="150" width="180" height="160" rx="28" fill="#fff"/><rect x="145" y="190" width="110" height="14" rx="7" fill="#e2e8f0"/><circle cx="200" cy="260" r="22" fill="#e2e8f0"/>',
  orb: '<circle cx="200" cy="220" r="95" fill="#fff"/><circle cx="168" cy="188" r="24" fill="#e2e8f0"/>',
  bar: '<rect x="80" y="200" width="240" height="90" rx="26" fill="#fff"/><g fill="#e2e8f0"><rect x="105" y="225" width="30" height="16" rx="6"/><rect x="145" y="225" width="30" height="16" rx="6"/><rect x="185" y="225" width="30" height="16" rx="6"/><rect x="225" y="225" width="30" height="16" rx="6"/></g>',
}
export const art = (from, to, shape) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><ellipse cx="200" cy="335" rx="95" ry="14" fill="rgba(0,0,0,.14)"/>${shapes[shape]}</svg>`
  )}`

const cats = [
  { id: 'c-tech', name: 'Tech', slug: 'tech', from: '#60a5fa', to: '#2563eb', soft: ['#dbeafe', '#93c5fd'], subs: ['Audio', 'Desk setup'] },
  { id: 'c-home', name: 'Home', slug: 'home', from: '#86efac', to: '#16a34a', soft: ['#dcfce7', '#86efac'], subs: ['Lighting', 'Decor'] },
  { id: 'c-gadgets', name: 'Gadgets', slug: 'gadgets', from: '#fb923c', to: '#fbbf24', soft: ['#ffedd5', '#fdba74'], subs: ['Fun', 'Travel'] },
]

const P = (n, name, slug, cat, price, orig, shape, tags, extra = {}) => {
  const c = cats.find((x) => x.id === cat)
  const order = [shape, 'orb', 'box']
  return {
    id: `p-${n}`, name, slug, categoryId: cat, subcategory: c.subs[0], brand: 'CoolBrand',
    shortDescription: `${name}: small, smart and surprisingly useful.`,
    description: `${name} is one of those finds you did not know you needed. Simple to use, nicely built, and a great conversation starter on any desk or shelf.`,
    price, originalPrice: orig, tags,
    pros: ['Compact and light', 'Easy to set up', 'Good value'],
    cons: ['Limited colour options', 'Ships in 5 to 7 days'],
    specs: [{ label: 'Warranty', value: '6 months' }, { label: 'Weight', value: '250 g' }, { label: 'Power', value: 'USB-C' }],
    images: order.map((s, i) => art(c.soft[0], i === 1 ? c.from : c.soft[1], s)),
    featured: n <= 4, trending: n % 2 === 0, status: 'published', views: 20 * n, clicks: 4 * n,
    createdAt: new Date(Date.now() - n * 864e5).toISOString(), ...extra,
  }
}

export function seed() {
  const products = [
    P(1, 'Mini Projector', 'mini-projector', 'c-tech', 5999, 8999, 'box', ['tech', 'movies', 'unique']),
    P(2, 'Glow Desk Lamp', 'desk-lamp', 'c-home', 1299, 1799, 'lamp', ['desk', 'useful', 'home']),
    P(3, 'Magic Orb Speaker', 'magic-orb', 'c-gadgets', 2499, 3299, 'orb', ['gadget', 'trending', 'unique']),
    P(4, 'Smart Bulb', 'smart-bulb', 'c-home', 599, 899, 'orb', ['home', 'budget', 'useful']),
    P(5, 'Pocket Scanner', 'pocket-scanner', 'c-tech', 3499, 4499, 'box', ['tech', 'useful']),
    P(6, 'Fidget Cube', 'fidget-cube', 'c-gadgets', 399, 599, 'box', ['budget', 'gadget', 'fun']),
    P(7, 'LED Strip Kit', 'led-strip', 'c-home', 799, 1199, 'bar', ['home', 'budget']),
    P(8, 'Tiny Keyboard', 'tiny-keyboard', 'c-tech', 1899, 2399, 'bar', ['tech', 'desk']),
    P(9, 'Draft Idea Gadget', 'draft-idea', 'c-gadgets', 999, 999, 'orb', ['unique'], { status: 'draft', featured: false }),
  ]
  const now = new Date().toISOString()
  return {
    categories: cats, products, orderSeq: 0, events: [],
    users: [{ id: 'u-admin', name: 'Admin', email: 'admin@coolstuff.com', password: 'admin123', role: 'admin', createdAt: now }],
    reviews: [
      { id: 'r-1', productId: 'p-1', userId: 'u-admin', userName: 'Riya', rating: 5, body: 'Great picture for the price. Setup took two minutes.', createdAt: now },
      { id: 'r-2', productId: 'p-1', userId: 'u-x', userName: 'Aman', rating: 4, body: 'Very handy, a bit loud fan but fine.', createdAt: now },
      { id: 'r-3', productId: 'p-2', userId: 'u-x', userName: 'Sana', rating: 5, body: 'Looks lovely on my desk.', createdAt: now },
    ],
    orders: [], notifications: [], wishlist: {}, cart: {}, session: null,
  }
}
