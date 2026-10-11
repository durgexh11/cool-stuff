import { Link } from 'react-router-dom'
const styles = {
  light: 'bg-white text-ink hover:bg-white/90',
  dark: 'bg-ink text-white hover:bg-ink/90',
  glass: 'bg-white/40 text-ink hover:bg-white/60 backdrop-blur',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}
export default function PillButton({ to, variant = 'dark', icon, children, className = '', ...rest }) {
  const cls = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${className}`
  if (to) return <Link to={to} className={cls} {...rest}>{children}{icon}</Link>
  return <button className={cls} {...rest}>{children}{icon}</button>
}
