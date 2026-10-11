import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import PillNavbar from './components/PillNavbar'
import Footer from './components/Footer'
import EmptyState from './components/EmptyState'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Wishlist from './pages/Wishlist'
import Orders from './pages/Orders'
import Auth from './pages/Auth'
import Admin from './pages/Admin'
import Policy from './pages/Policy'

export default function App() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 150)
      return () => clearTimeout(t)
    }
    window.scrollTo(0, 0)
    return undefined
  }, [pathname, hash])

  const hideFooter = pathname.startsWith('/admin') || pathname === '/login'
  return (
    <>
      <PillNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cool-stuff" element={<Products />} />
        <Route path="/cool-stuff/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/policy/:slug" element={<Policy />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/:tab" element={<Admin />} />
        <Route path="*" element={<main className="px-4 pt-40"><EmptyState title="Page not found" text="This page does not exist." actionLabel="Back home" actionTo="/" /></main>} />
      </Routes>
      {!hideFooter && <Footer />}
    </>
  )
}