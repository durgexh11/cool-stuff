import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as api from './api'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [wishlist, setWishlist] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [toast, setToast] = useState(null)

  const notify = useCallback((message, type = 'ok') => {
    setToast({ message, type, id: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const refresh = useCallback(async () => {
    const u = await api.getSession()
    setUser(u)
    setWishlist(u ? await api.getWishlistIds() : [])
    setCartCount(u ? (await api.getCart()).reduce((a, i) => a + i.qty, 0) : 0)
    setReady(true)
  }, [])
  useEffect(() => { refresh() }, [refresh])

  // Runs an action, shows friendly errors, then refreshes shared state.
  const run = useCallback(async (fn, okMsg) => {
    try {
      const r = await fn()
      if (okMsg) notify(okMsg)
      await refresh()
      return { ok: true, data: r }
    } catch (e) {
      notify(e.message || 'Something went wrong', 'error')
      return { ok: false }
    }
  }, [notify, refresh])

  const toggleWishlist = (id) => run(() => api.toggleWishlist(id))
  const addToCart = (id, qty = 1) => run(() => api.addToCart(id, qty), 'Added to cart')

  return (
    <Ctx.Provider value={{ user, ready, wishlist, cartCount, notify, refresh, run, toggleWishlist, addToCart }}>
      {children}
      {toast && (
        <div role="status" className={`fade-up fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-hover ${toast.type === 'error' ? 'bg-red-600' : 'bg-ink'}`}>
          {toast.message}
        </div>
      )}
    </Ctx.Provider>
  )
}
