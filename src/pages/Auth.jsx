import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../lib/api'
import { useApp } from '../lib/AppContext'
import PillButton from '../components/PillButton'
import Seo from '../components/Seo'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { refresh, notify } = useApp()
  const nav = useNavigate()
  const { state } = useLocation()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const u = mode === 'login' ? await signIn(f) : await signUp(f)
      await refresh(); notify(`Welcome, ${u.name}`)
      nav(u.role === 'admin' ? '/admin' : state?.from || '/')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <main className="page-gradient grid min-h-screen place-items-center px-4 pt-24">
      <Seo title={mode === 'login' ? 'Log in' : 'Sign up'} description="Access your Cool Stuff account" />
      <form onSubmit={submit} className="fade-up w-full max-w-sm space-y-3 rounded-hero bg-white p-8 shadow-hero">
        <h1 className="text-center font-mono text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <div className="grid grid-cols-2 gap-1 rounded-full bg-soft p-1" role="tablist">
          {['login', 'signup'].map((m) => <button type="button" key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError('') }} className={`min-h-11 rounded-full text-sm font-bold ${mode === m ? 'bg-white shadow-sm' : ''}`}>{m === 'login' ? 'Log in' : 'Sign up'}</button>)}
        </div>
        {mode === 'signup' && <input className="input bg-soft/60" placeholder="Your name" aria-label="Name" value={f.name} onChange={set('name')} required />}
        <input className="input bg-soft/60" type="email" placeholder="Email" aria-label="Email" value={f.email} onChange={set('email')} required />
        <input className="input bg-soft/60" type="password" placeholder="Password (min 6)" aria-label="Password" value={f.password} onChange={set('password')} required />
        {error && <p role="alert" className="rounded-[16px] bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <PillButton type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</PillButton>
      </form>
    </main>
  )
}
