import { useEffect } from 'react'
const setMeta = (attr, key, value) => {
  if (!value) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', value)
}
export default function Seo({ title, description, image, jsonLd }) {
  useEffect(() => {
    const full = title ? `${title} | Cool Stuff` : 'Cool Stuff'
    document.title = full
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', full)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', jsonLd ? 'product' : 'website')
    setMeta('property', 'og:url', location.href)
    if (image && !image.startsWith('data:')) setMeta('property', 'og:image', image)
    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = location.origin + location.pathname
    let script = document.getElementById('ld-json')
    if (jsonLd) {
      if (!script) { script = document.createElement('script'); script.id = 'ld-json'; script.type = 'application/ld+json'; document.head.appendChild(script) }
      script.textContent = JSON.stringify(jsonLd)
    } else script?.remove()
  }, [title, description, image, jsonLd])
  return null
}
