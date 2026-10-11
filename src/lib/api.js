// Data layer. Every function talks to Supabase (Postgres + Auth + Storage).
// Function names and returned shapes are the same as the old temporary version,
// so the UI did not need to change.
import { supabase } from './supabase'
import { art } from './seed'

// ---------- helpers ----------
const fail = (m) => { throw new Error(m) }
const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// Turns a database error into a short message that is safe to show to users.
function friendly(error, fallback) {
  const m = error.message || ''
  if (/failed to fetch|network|load failed/i.test(m)) return 'Network problem. Please check your connection.'
  if (error.code === 'P0001') return m // messages we raise ourselves inside database functions
  if (error.code === '23505') return 'This already exists.'
  if (error.code === '23503') return 'This item is still in use.'
  if (error.code === '23514') return 'Some values are not valid.'
  if (error.code === '42501' || /row-level security/i.test(m)) return 'You do not have permission to do that.'
  if (error.code === 'PGRST301' || /jwt/i.test(m)) return 'Your session expired. Please log in again.'
  return fallback
}
function ok(res, fallback = 'Something went wrong. Please try again.') {
  if (res.error) { console.error(res.error); throw new Error(friendly(res.error, fallback)) }
  return res.data
}

const tint = (hex, amt) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return '#ffedd5'
  const n = parseInt(hex.slice(1), 16)
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * amt).toString(16).padStart(2, '0')).join('')
}

// ---------- mappers (database rows -> UI shapes) ----------
function mapCategory(r) {
  return {
    id: r.id, name: r.name, slug: r.slug, from: r.accent_from, to: r.accent_to,
    soft: [tint(r.accent_from, 0.8), tint(r.accent_to, 0.45)],
    subs: (r.subcategories || []).map((s) => s.name).sort(),
  }
}

const PRODUCT_SELECT = '*, categories(id, name, slug, accent_from, accent_to), subcategories(name), product_images(position, public_url, storage_path), product_tags(tags(name))'

function mapProduct(r) {
  const cat = r.categories ? mapCategory(r.categories) : null
  const real = (r.product_images || []).slice().sort((a, b) => a.position - b.position).map((i) => i.public_url)
  const price = Number(r.price)
  return {
    id: r.id, slug: r.slug, name: r.name, categoryId: r.category_id, category: cat,
    subcategory: r.subcategories?.name || '', brand: r.brand || '',
    shortDescription: r.short_description || '', description: r.description || '',
    price, originalPrice: r.original_price != null ? Number(r.original_price) : price, discount: r.discount_percent || 0,
    tags: (r.product_tags || []).map((t) => t.tags?.name).filter(Boolean),
    pros: r.pros || [], cons: r.cons || [], specs: Array.isArray(r.specifications) ? r.specifications : [],
    realImages: real, // only images that were really uploaded
    images: real.length ? real : [art(cat?.soft[0] || '#ffedd5', cat?.soft[1] || '#fdba74', 'box')], // placeholder when none
    featured: r.is_featured, trending: r.is_trending, status: r.status,
    views: r.view_count, clicks: r.click_count, rating: Number(r.avg_rating) || 0, reviewCount: r.review_count || 0,
    createdAt: r.created_at,
  }
}

const mapOrder = (o) => ({
  id: o.id, number: o.order_number, userId: o.user_id, name: o.customer_name, phone: o.phone,
  address: o.address, details: o.address_details || '', total: Number(o.total_amount), status: o.status, createdAt: o.created_at,
  items: (o.order_items || []).map((i) => ({ productId: i.product_id || i.id, name: i.product_name, price: Number(i.unit_price), qty: i.quantity })),
})

// ---------- auth ----------
let profileCache = null

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    const s = data?.session
    if (error || !s) { profileCache = null; return null }
    if (profileCache?.id === s.user.id) return profileCache
    const { data: p } = await supabase.from('profiles').select('id, full_name, email, role').eq('id', s.user.id).maybeSingle()
    profileCache = { id: s.user.id, name: p?.full_name || (s.user.email || '').split('@')[0], email: s.user.email, role: p?.role || 'user' }
    return profileCache
  } catch { return null }
}
const need = async () => (await getSession()) || fail('Please log in first')
const needAdmin = async () => ((await getSession())?.role === 'admin' ? true : fail('Admin access only'))

export async function signUp({ name, email, password }) {
  if (name.trim().length < 2) fail('Please enter your name')
  if (!/^\S+@\S+\.\S+$/.test(email)) fail('Please enter a valid email')
  if (password.length < 6) fail('Password must be at least 6 characters')
  const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: name.trim() } } })
  if (error) {
    if (/already registered/i.test(error.message)) fail('This email is already registered')
    if (/fetch|network/i.test(error.message)) fail('Network problem. Please check your connection.')
    console.error(error); fail('Could not create your account. Please try again.')
  }
  if (!data.session) fail('Account created. Please confirm your email, then log in.')
  profileCache = null
  return getSession()
}
export async function signIn({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) {
    if (/invalid login/i.test(error.message)) fail('Wrong email or password')
    if (/not confirmed/i.test(error.message)) fail('Please confirm your email first')
    if (/fetch|network/i.test(error.message)) fail('Network problem. Please check your connection.')
    console.error(error); fail('Could not log in. Please try again.')
  }
  profileCache = null
  return getSession()
}
export async function signOut() { await supabase.auth.signOut(); profileCache = null }

// ---------- catalog ----------
export async function getCategories() {
  const rows = ok(await supabase.from('categories').select('id, name, slug, accent_from, accent_to, subcategories(name)').order('name'))
  return rows.map(mapCategory)
}

export async function getProducts({ q = '', category = '', subcategory = '', sort = 'newest', maxPrice = 0, minRating = 0, featured = false, trending = false, page = 1, pageSize = 8 } = {}) {
  let categoryId = null
  if (category) {
    const c = ok(await supabase.from('categories').select('id').eq('slug', category).maybeSingle())
    if (!c) return { items: [], total: 0 }
    categoryId = c.id
  }
  let subId = null
  if (subcategory && categoryId) {
    const s = ok(await supabase.from('subcategories').select('id').eq('category_id', categoryId).eq('name', subcategory).maybeSingle())
    if (!s) return { items: [], total: 0 }
    subId = s.id
  }

  let query = supabase.from('products').select(PRODUCT_SELECT, { count: 'exact' }).eq('status', 'published')
  if (categoryId) query = query.eq('category_id', categoryId)
  if (subId) query = query.eq('subcategory_id', subId)
  if (maxPrice) query = query.lte('price', maxPrice)
  if (minRating) query = query.gte('avg_rating', minRating)
  if (featured) query = query.eq('is_featured', true)
  if (trending) query = query.eq('is_trending', true)

  const s = q.trim().replace(/[,()%*\\]/g, ' ').trim()
  if (s) {
    // search name + descriptions + tags
    const tags = ok(await supabase.from('tags').select('id').ilike('name', `%${s}%`))
    let ids = []
    if (tags.length) {
      const pt = ok(await supabase.from('product_tags').select('product_id').in('tag_id', tags.map((t) => t.id)))
      ids = [...new Set(pt.map((x) => x.product_id))]
    }
    const parts = [`name.ilike.%${s}%`, `short_description.ilike.%${s}%`, `description.ilike.%${s}%`]
    if (ids.length) parts.push(`id.in.(${ids.join(',')})`)
    query = query.or(parts.join(','))
  }

  const order = {
    newest: ['created_at', false], oldest: ['created_at', true], rated: ['avg_rating', false], reviewed: ['review_count', false],
    viewed: ['view_count', false], low: ['price', true], high: ['price', false],
  }[sort] || ['created_at', false]
  query = query.order(order[0], { ascending: order[1] })
  if (sort === 'rated') query = query.order('review_count', { ascending: false })

  const { data, error, count } = await query.range(0, page * pageSize - 1)
  if (error) { console.error(error); throw new Error(friendly(error, 'Could not load products.')) }
  return { items: data.map(mapProduct), total: count ?? data.length }
}

export async function getProduct(slug) {
  const row = ok(await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).maybeSingle(), 'Could not load this product.')
  return row ? mapProduct(row) : null // drafts/archived are hidden from the public by RLS
}

export async function getRelated(product) {
  try {
    let shareIds = []
    if (product.tags.length) {
      const tagRows = ok(await supabase.from('tags').select('id').in('name', product.tags))
      if (tagRows.length) {
        const pt = ok(await supabase.from('product_tags').select('product_id').in('tag_id', tagRows.map((t) => t.id)))
        shareIds = [...new Set(pt.map((x) => x.product_id))]
      }
    }
    const filter = [`category_id.eq.${product.categoryId}`, shareIds.length ? `id.in.(${shareIds.join(',')})` : null].filter(Boolean).join(',')
    const rows = ok(await supabase.from('products').select(PRODUCT_SELECT).eq('status', 'published').neq('id', product.id).or(filter).limit(30))
    return rows.map(mapProduct)
      .map((p) => ({ p, score: (p.categoryId === product.categoryId ? 2 : 0) + p.tags.filter((t) => product.tags.includes(t)).length }))
      .sort((a, b) => b.score - a.score).slice(0, 4).map((x) => x.p)
  } catch { return [] } // related products are optional, never break the page
}

export async function track(productId, type) {
  try { await supabase.rpc('track_event', { p_product_id: productId, p_event: type }) } catch { /* analytics must never break the UI */ }
}

// ---------- reviews ----------
export async function getReviews(productId) {
  const rows = ok(await supabase.rpc('get_reviews', { p_product_id: productId }), 'Could not load reviews.')
  return rows.map((r) => ({ id: r.id, productId: r.product_id, userId: r.user_id, userName: r.user_name, rating: r.rating, body: r.body, createdAt: r.created_at }))
}
export async function saveReview({ productId, rating, body }) {
  const u = await need()
  if (rating < 1 || rating > 5) fail('Choose a rating from 1 to 5')
  if (body.trim().length < 5 || body.length > 1000) fail('Review must be 5 to 1000 characters')
  ok(await supabase.from('reviews').upsert({ product_id: productId, user_id: u.id, rating, body: body.trim() }, { onConflict: 'product_id,user_id' }), 'Could not save your review.')
}
export async function deleteReview(id) {
  await need()
  const rows = ok(await supabase.from('reviews').delete().eq('id', id).select('id'), 'Could not delete this review.')
  if (!rows.length) fail('You cannot delete this review')
}

// ---------- wishlist & cart ----------
export async function getWishlistIds() {
  const u = await getSession(); if (!u) return []
  return ok(await supabase.from('wishlists').select('product_id').eq('user_id', u.id)).map((r) => r.product_id)
}
export async function toggleWishlist(productId) {
  const u = await need()
  const has = ok(await supabase.from('wishlists').select('product_id').eq('user_id', u.id).eq('product_id', productId).maybeSingle())
  if (has) { ok(await supabase.from('wishlists').delete().eq('user_id', u.id).eq('product_id', productId)); return false }
  ok(await supabase.from('wishlists').insert({ user_id: u.id, product_id: productId }))
  track(productId, 'wishlist_add')
  return true
}
export async function getWishlistProducts() {
  const ids = await getWishlistIds()
  if (!ids.length) return []
  return ok(await supabase.from('products').select(PRODUCT_SELECT).in('id', ids)).map(mapProduct)
}
export async function getCart() {
  const u = await getSession(); if (!u) return []
  const rows = ok(await supabase.from('cart_items').select(`quantity, products(${PRODUCT_SELECT})`).eq('user_id', u.id).order('updated_at'))
  return rows.filter((r) => r.products).map((r) => ({ qty: r.quantity, product: mapProduct(r.products) }))
}
export async function setCartQty(productId, qty) {
  const u = await need()
  qty = Math.max(0, Math.min(99, Math.floor(Number(qty) || 0)))
  if (qty === 0) { ok(await supabase.from('cart_items').delete().eq('user_id', u.id).eq('product_id', productId)); return }
  const p = ok(await supabase.from('products').select('id').eq('id', productId).eq('status', 'published').maybeSingle())
  if (!p) fail('This product is not available')
  ok(await supabase.from('cart_items').upsert({ user_id: u.id, product_id: productId, quantity: qty, updated_at: new Date().toISOString() }, { onConflict: 'user_id,product_id' }))
}
export async function addToCart(productId, qty = 1) {
  const u = await need()
  const cur = ok(await supabase.from('cart_items').select('quantity').eq('user_id', u.id).eq('product_id', productId).maybeSingle())
  await setCartQty(productId, (cur?.quantity || 0) + qty)
  track(productId, 'add_to_cart')
}
export async function clearCart() {
  const u = await need()
  ok(await supabase.from('cart_items').delete().eq('user_id', u.id))
}

// ---------- orders ----------
export async function createOrder({ name, phone, address, details }) {
  await need()
  if (name.trim().length < 2) fail('Please enter your name')
  if (!/^[0-9+\- ]{8,15}$/.test(phone)) fail('Please enter a valid phone number')
  if (address.trim().length < 10) fail('Please enter your full address')
  // Prices and totals are calculated inside the database function, never in the browser.
  const res = ok(await supabase.rpc('create_order', { p_name: name, p_phone: phone, p_address: address, p_address_details: details || null }), 'Could not place your order.')
  const created = Array.isArray(res) ? res[0] : res
  const order = ok(await supabase.from('orders').select('*, order_items(*)').eq('id', created.order_id).single())
  return mapOrder(order)
}
export async function getMyOrders() {
  const u = await need()
  const rows = ok(await supabase.from('orders').select('*, order_items(*)').eq('user_id', u.id).order('created_at', { ascending: false }))
  return rows.map(mapOrder)
}

// ---------- admin ----------
export async function adminOrders() {
  await needAdmin()
  return ok(await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })).map(mapOrder)
}
export async function adminSetOrderStatus(id, status) {
  await needAdmin()
  if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) fail('Invalid status')
  const rows = ok(await supabase.from('orders').update({ status }).eq('id', id).select('id'))
  if (!rows.length) fail('You cannot update this order')
}

export async function adminProducts() {
  await needAdmin()
  return ok(await supabase.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false })).map(mapProduct)
}

const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
async function uploadImage(productId, dataUrl, slot) {
  const blob = await (await fetch(dataUrl)).blob()
  if (!MIME_EXT[blob.type]) fail('Use a JPG, PNG or WebP image')
  if (blob.size > 2 * 1024 * 1024) fail('Image must be under 2 MB')
  const path = `${productId}/${Date.now()}-${slot}.${MIME_EXT[blob.type]}`
  const { error } = await supabase.storage.from('product-images').upload(path, blob, { contentType: blob.type })
  if (error) { console.error(error); fail('Image upload failed. Please try again.') }
  return { path, url: supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl }
}

export async function adminSaveProduct(input) {
  await needAdmin()
  const name = (input.name || '').trim()
  if (name.length < 2) fail('Product name is required')
  const price = Number(input.price)
  if (input.price === '' || !(price >= 0)) fail('Enter a valid price')
  const original = input.originalPrice ? Number(input.originalPrice) : null
  if (original !== null && original < price) fail('Original price must be at least the price')
  if (!input.categoryId) fail('Choose a category')
  const images = (input.images || []).filter(Boolean)
  if (images.length > 3) fail('Maximum 3 images')

  let subcategoryId = null
  if (input.subcategory) {
    const s = ok(await supabase.from('subcategories').select('id').eq('category_id', input.categoryId).eq('name', input.subcategory).maybeSingle())
    subcategoryId = s?.id || null
  }
  const row = {
    name, short_description: input.shortDescription || null, description: input.description || null,
    price, original_price: original, brand: input.brand || null, category_id: input.categoryId, subcategory_id: subcategoryId,
    pros: input.pros || [], cons: input.cons || [], specifications: input.specs || [],
    is_featured: !!input.featured, is_trending: !!input.trending, status: input.status || 'draft',
  }

  const id = input.id || crypto.randomUUID()
  if (input.id) {
    const rows = ok(await supabase.from('products').update(row).eq('id', id).select('id'), 'Could not save the product.')
    if (!rows.length) fail('You cannot edit this product')
  } else {
    const base = slugify(name) || 'product'
    const taken = ok(await supabase.from('products').select('slug').like('slug', `${base}%`)).map((r) => r.slug)
    let slug = base, n = 1
    while (taken.includes(slug)) slug = `${base}-${++n}`
    ok(await supabase.from('products').insert({ ...row, id, slug }), 'Could not save the product.')
  }

  // images: keep existing ones, upload new ones, remove the ones that were deleted
  const existing = ok(await supabase.from('product_images').select('storage_path, public_url').eq('product_id', id))
  const byUrl = new Map(existing.map((r) => [r.public_url, r]))
  const finalImgs = []
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    if (byUrl.has(img)) finalImgs.push({ path: byUrl.get(img).storage_path, url: img })
    else if (/^data:image\/(jpeg|png|webp);/.test(img)) finalImgs.push(await uploadImage(id, img, i + 1))
  }
  ok(await supabase.from('product_images').delete().eq('product_id', id))
  if (finalImgs.length) ok(await supabase.from('product_images').insert(finalImgs.map((x, i) => ({ product_id: id, position: i + 1, storage_path: x.path, public_url: x.url }))), 'Could not save the images.')
  const keep = new Set(finalImgs.map((x) => x.path))
  const stale = existing.map((r) => r.storage_path).filter((p) => !keep.has(p))
  if (stale.length) await supabase.storage.from('product-images').remove(stale)

  // tags
  const names = [...new Set((input.tags || []).map((t) => t.trim().toLowerCase()).filter((t) => slugify(t)))]
  ok(await supabase.from('product_tags').delete().eq('product_id', id))
  if (names.length) {
    const tags = ok(await supabase.from('tags').upsert(names.map((n) => ({ name: n, slug: slugify(n) })), { onConflict: 'slug' }).select('id'))
    ok(await supabase.from('product_tags').insert(tags.map((t) => ({ product_id: id, tag_id: t.id }))))
  }
}
export async function adminSetProductStatus(id, status) {
  await needAdmin()
  const rows = ok(await supabase.from('products').update({ status }).eq('id', id).select('id'))
  if (!rows.length) fail('You cannot update this product')
}
export async function adminDeleteProduct(id) {
  await needAdmin()
  const imgs = ok(await supabase.from('product_images').select('storage_path').eq('product_id', id))
  const rows = ok(await supabase.from('products').delete().eq('id', id).select('id'), 'Could not delete this product.')
  if (!rows.length) fail('You cannot delete this product')
  if (imgs.length) await supabase.storage.from('product-images').remove(imgs.map((i) => i.storage_path))
}

export async function adminReviews() {
  await needAdmin()
  const rows = ok(await supabase.from('reviews').select('*, profiles(full_name, email), products(name)').order('created_at', { ascending: false }).limit(200))
  return rows.map((r) => ({ id: r.id, productId: r.product_id, userId: r.user_id, userName: r.profiles?.full_name || r.profiles?.email || 'User', rating: r.rating, body: r.body, createdAt: r.created_at, productName: r.products?.name }))
}

export async function adminUsers() {
  await needAdmin()
  const [profiles, orders, reviews] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }),
    supabase.from('orders').select('user_id'), supabase.from('reviews').select('user_id'),
  ])
  const tally = (rows) => rows.reduce((m, r) => ((m[r.user_id] = (m[r.user_id] || 0) + 1), m), {})
  const o = tally(ok(orders)), r = tally(ok(reviews))
  return ok(profiles).map((u) => ({ id: u.id, name: u.full_name || '-', email: u.email, createdAt: u.created_at, orders: o[u.id] || 0, reviews: r[u.id] || 0 }))
}

export async function adminSaveCategory(c) {
  await needAdmin()
  const name = (c.name || '').trim()
  if (name.length < 2) fail('Category name is required')
  if (!/^#[0-9a-f]{6}$/i.test(c.from) || !/^#[0-9a-f]{6}$/i.test(c.to)) fail('Choose valid accent colours')
  const row = { name, slug: slugify(name), accent_from: c.from, accent_to: c.to }
  let id = c.id
  if (id) ok(await supabase.from('categories').update(row).eq('id', id), 'Could not save the category.')
  else id = ok(await supabase.from('categories').insert(row).select('id').single(), 'Could not save the category.').id

  const names = [...new Set((c.subs || []).map((s) => s.trim()).filter(Boolean))]
  const existing = ok(await supabase.from('subcategories').select('id, name').eq('category_id', id))
  const remove = existing.filter((e) => !names.includes(e.name)).map((e) => e.id)
  const add = names.filter((n) => !existing.some((e) => e.name === n))
  if (remove.length) ok(await supabase.from('subcategories').delete().in('id', remove))
  if (add.length) ok(await supabase.from('subcategories').insert(add.map((n) => ({ category_id: id, name: n, slug: slugify(n) || n.toLowerCase() }))))
}
export async function adminDeleteCategory(id) {
  await needAdmin()
  const { count, error } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id)
  if (error) fail('Could not check this category.')
  if (count) fail('Move or delete the products in this category first')
  ok(await supabase.from('categories').delete().eq('id', id), 'Could not delete the category.')
}

export async function adminNotifications() {
  await needAdmin()
  const rows = ok(await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100))
  return rows.map((n) => ({ id: n.id, type: n.type, message: n.message, link: n.link, read: n.is_read, createdAt: n.created_at }))
}
export async function adminReadNotifications() {
  await needAdmin()
  ok(await supabase.from('notifications').update({ is_read: true }).eq('is_read', false))
}

export async function adminStats(range = 'all') {
  await needAdmin()
  const since = range === 'today' ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    : range === '7' ? new Date(Date.now() - 7 * 864e5).toISOString()
    : range === '30' ? new Date(Date.now() - 30 * 864e5).toISOString() : null
  const inRange = (q) => (since ? q.gte('created_at', since) : q)
  const count = async (q) => { const { count: c, error } = await q; if (error) { console.error(error); throw new Error('Could not load stats.') } return c || 0 }
  const head = (t) => supabase.from(t).select('*', { count: 'exact', head: true })
  const ev = (type) => count(inRange(head('product_events').eq('event_type', type)))

  const [totalProducts, published, drafts, archived, users, reviews, orders, pending, views, clicks, waClicks, wishlist, carts, topViewed, orderEvents, recentOrders, recentReviews] = await Promise.all([
    count(head('products')), count(head('products').eq('status', 'published')), count(head('products').eq('status', 'draft')), count(head('products').eq('status', 'archived')),
    count(head('profiles')), count(head('reviews')),
    count(inRange(head('orders'))), count(inRange(head('orders').eq('status', 'pending'))),
    ev('view'), ev('click'), ev('whatsapp_click'), ev('wishlist_add'), ev('add_to_cart'),
    supabase.from('products').select('name, view_count').order('view_count', { ascending: false }).limit(5),
    inRange(supabase.from('product_events').select('product_id').eq('event_type', 'order')).limit(5000),
    inRange(supabase.from('orders').select('id, order_number, total_amount')).order('created_at', { ascending: false }).limit(5),
    inRange(supabase.from('reviews').select('id, rating, body, profiles(full_name)')).order('created_at', { ascending: false }).limit(5),
  ])

  const counts = ok(orderEvents).reduce((m, e) => ((m[e.product_id] = (m[e.product_id] || 0) + 1), m), {})
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  let mostOrdered = []
  if (top.length) {
    const names = ok(await supabase.from('products').select('id, name').in('id', top.map((t) => t[0])))
    mostOrdered = top.map(([id, n]) => ({ name: names.find((x) => x.id === id)?.name || 'Deleted', n }))
  }
  return {
    totalProducts, published, drafts, archived, users, reviews, orders, pending, views, clicks: clicks + waClicks, wishlist, carts,
    mostViewed: ok(topViewed).map((p) => ({ name: p.name, n: p.view_count })), mostOrdered,
    recentOrders: ok(recentOrders).map((o) => ({ id: o.id, number: o.order_number, total: Number(o.total_amount) })),
    recentReviews: ok(recentReviews).map((r) => ({ id: r.id, rating: r.rating, body: r.body, userName: r.profiles?.full_name || 'User' })),
  }
}