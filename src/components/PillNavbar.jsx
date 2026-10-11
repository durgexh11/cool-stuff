import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import RoundIconButton from './RoundIconButton'
import Logo from './Logo'
import { CartIcon, HeartIcon, MenuIcon, CloseIcon, SearchIcon, UserIcon } from './Icons'
import { useApp } from '../lib/AppContext'
import { signOut } from '../lib/api'

const linkClass = ({ isActive }) => `rounded-full px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`

export default function PillNavbar() {
  const [open, setOpen] = useState(false)
  const { user, cartCount, refresh } = useApp()
  const nav = useNavigate()
  const links = [
    { to: '/', label: 'Home' }, { to: '/cool-stuff', label: 'Products' },
    { to: '/wishlist', label: 'Wishlist' }, { to: '/orders', label: 'Orders' },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ]
  const logout = async () => { await signOut(); await refresh(); setOpen(false); nav('/') }

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white/60 p-2 pl-2 shadow-card backdrop-blur-md">
        <Logo />
        <div className="hidden items-center gap-1 rounded-full bg-white/40 p-1 md:flex">
          {links.map((l) => <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>{l.label}</NavLink>)}
        </div>
        <div className="flex items-center gap-2">
          <RoundIconButton label="Search" onClick={() => nav('/cool-stuff')}><SearchIcon /></RoundIconButton>
          <RoundIconButton label="Wishlist" className="hidden sm:grid" onClick={() => nav('/wishlist')}><HeartIcon /></RoundIconButton>
          <RoundIconButton label="Cart" onClick={() => nav('/cart')}>
            <CartIcon />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-bold text-white">{cartCount}</span>}
          </RoundIconButton>
          <RoundIconButton label={user ? 'Log out' : 'Log in'} className="hidden md:grid" onClick={user ? logout : () => nav('/login')}><UserIcon /></RoundIconButton>
          <RoundIconButton label={open ? 'Close menu' : 'Open menu'} className="md:hidden" onClick={() => setOpen((o) => !o)}>
            {open ? <CloseIcon /> : <MenuIcon />}
          </RoundIconButton>
        </div>
      </nav>
      {open && (
        <div className="fade-up mx-auto mt-2 max-w-6xl rounded-card bg-white/95 p-3 shadow-card backdrop-blur-md md:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `block min-h-11 rounded-full px-4 py-3 text-sm font-bold ${isActive ? 'bg-ink text-white' : ''}`}>{l.label}</NavLink>
          ))}
          {user
            ? <button onClick={logout} className="block min-h-11 w-full rounded-full px-4 py-3 text-left text-sm font-bold">Log out</button>
            : <NavLink to="/login" onClick={() => setOpen(false)} className="block min-h-11 rounded-full px-4 py-3 text-sm font-bold">Log in / Sign up</NavLink>}
        </div>
      )}
    </header>
  )
}