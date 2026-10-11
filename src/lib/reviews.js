// Reviews with optional photos (max 3). Photos are resized in the browser before upload.
import { supabase } from './supabase'
import { getSession } from './api'

const fail = (m) => { throw new Error(m) }
const BUCKET = 'review-images'
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export const MAX_PHOTOS = 3
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // limit for what is uploaded (after resizing)
export const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024 // limit for what the user picks
const MAX_SIDE = 1600

function check(res, fallback) {
  if (res.error) {
    console.error(res.error)
    const m = res.error.message || ''
    if (/failed to fetch|network/i.test(m)) fail('Network problem. Please check your connection.')
    if (res.error.code === '42501' || /row-level security/i.test(m)) fail('You do not have permission to do that.')
    fail(fallback)
  }
  return res.data
}

// Resizes a picked photo to at most 1600px and saves it as JPEG. Phone photos are often 3 to 8 MB,
// this makes them small, and it also removes hidden data such as the location stored in the photo.
export async function preparePhoto(file) {
  if (!MIME_EXT[file.type]) fail('Photos must be JPG, PNG or WebP')
  if (file.size > MAX_ORIGINAL_BYTES) fail('Each photo must be under 15 MB')
  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    try { bitmap = await createImageBitmap(file) } catch { fail('This photo could not be read. Please try another one.') }
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // JPEG has no transparency
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  if (bitmap.close) bitmap.close()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) fail('This photo could not be processed. Please try another one.')
  if (blob.size > MAX_PHOTO_BYTES) fail('This photo is too large. Please pick another one.')
  return new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
}

export async function getReviews(productId) {
  const rows = check(await supabase.rpc('get_reviews', { p_product_id: productId }), 'Could not load reviews.')
  return rows.map((r) => ({
    id: r.id, productId: r.product_id, userId: r.user_id, userName: r.user_name,
    rating: r.rating, body: r.body, createdAt: r.created_at, images: Array.isArray(r.images) ? r.images : [],
  }))
}

// photos: array of File objects from preparePhoto(). If photos are given they replace the old ones.
// removePhotos: true removes the old photos without adding new ones.
export async function saveReview({ productId, rating, body, photos = [], removePhotos = false }) {
  const u = await getSession()
  if (!u) fail('Please log in first')
  if (rating < 1 || rating > 5) fail('Choose a rating from 1 to 5')
  if (body.trim().length < 5 || body.length > 1000) fail('Review must be 5 to 1000 characters')
  if (photos.length > MAX_PHOTOS) fail('You can add up to 3 photos')
  for (const f of photos) {
    if (!MIME_EXT[f.type]) fail('Photos must be JPG, PNG or WebP')
    if (f.size > MAX_PHOTO_BYTES) fail('Each photo must be under 2 MB')
  }

  const review = check(
    await supabase.from('reviews').upsert({ product_id: productId, user_id: u.id, rating, body: body.trim() }, { onConflict: 'product_id,user_id' }).select('id').single(),
    'Could not save your review.'
  )
  if (!photos.length && !removePhotos) return

  const old = check(await supabase.from('review_images').select('position, storage_path, public_url').eq('review_id', review.id), 'Could not update your photos.')

  // 1. upload the new files first, so old photos stay safe if an upload fails
  const uploaded = []
  for (let i = 0; i < photos.length; i++) {
    const f = photos[i]
    const path = `${u.id}/${review.id}/${Date.now()}-${i + 1}.${MIME_EXT[f.type]}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type })
    if (error) {
      console.error(error)
      if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded.map((x) => x.path))
      fail('Photo upload failed. Your review text was saved. Please try the photos again.')
    }
    uploaded.push({ path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl })
  }

  // 2. swap the database rows
  check(await supabase.from('review_images').delete().eq('review_id', review.id), 'Could not update your photos.')
  if (uploaded.length) {
    const { error } = await supabase.from('review_images').insert(
      uploaded.map((x, i) => ({ review_id: review.id, position: i + 1, storage_path: x.path, public_url: x.url }))
    )
    if (error) {
      console.error(error)
      await supabase.storage.from(BUCKET).remove(uploaded.map((x) => x.path))
      if (old.length) await supabase.from('review_images').insert(old.map((o) => ({ review_id: review.id, position: o.position, storage_path: o.storage_path, public_url: o.public_url })))
      fail('Could not save your photos. Your review text was saved.')
    }
  }

  // 3. remove the old files
  if (old.length) await supabase.storage.from(BUCKET).remove(old.map((o) => o.storage_path))
}

// Works for the review owner and for the admin. Photo files are deleted too, so nothing stays public.
export async function deleteReview(id) {
  const u = await getSession()
  if (!u) fail('Please log in first')
  const imgs = check(await supabase.from('review_images').select('storage_path').eq('review_id', id), 'Could not delete this review.')
  const rows = check(await supabase.from('reviews').delete().eq('id', id).select('id'), 'Could not delete this review.')
  if (!rows.length) fail('You cannot delete this review')
  if (imgs.length) await supabase.storage.from(BUCKET).remove(imgs.map((i) => i.storage_path))
}

// Admin only (the database also enforces this). Includes photos so they can be checked.
export async function adminReviews() {
  const u = await getSession()
  if (u?.role !== 'admin') fail('Admin access only')
  const rows = check(
    await supabase.from('reviews').select('*, profiles(full_name, email), products(name), review_images(position, public_url)').order('created_at', { ascending: false }).limit(200),
    'Could not load reviews.'
  )
  return rows.map((r) => ({
    id: r.id, productId: r.product_id, userId: r.user_id,
    userName: r.profiles?.full_name || r.profiles?.email || 'User',
    rating: r.rating, body: r.body, createdAt: r.created_at, productName: r.products?.name,
    images: (r.review_images || []).slice().sort((a, b) => a.position - b.position).map((i) => i.public_url),
  }))
}