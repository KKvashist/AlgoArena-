import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/login', label: 'Login' },
  { to: '/dashboard', label: 'Dashboard' },
]

function Navbar() {
  const location = useLocation()

  return (
    <nav className="relative bg-panel/60 backdrop-blur-sm border-b border-panel-border px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <img
          src="/logo.png"
          alt="AlgoArena logo"
          className="w-9 h-9 rounded-full group-hover:scale-110 transition-transform duration-300"
        />
        <span className="text-cyan font-display font-bold text-xl tracking-tight">
          Algo<span className="text-white">Arena</span>
        </span>
      </Link>

      <div className="flex gap-8">
        {NAV_LINKS.map((link) => {
          const isActive = location.pathname === link.to
          return (
            <Link key={link.to} to={link.to} className="relative py-1 group">
              <span
                className={`font-mono text-sm transition-colors ${
                  isActive ? 'text-cyan' : 'text-fog/70 group-hover:text-white'
                }`}
              >
                {link.label}
              </span>
              <span
                className={`absolute left-0 -bottom-1 h-0.5 bg-cyan rounded-full transition-all duration-300 ${
                  isActive ? 'w-full shadow-[0_0_8px_#2DE2E6]' : 'w-0 group-hover:w-full'
                }`}
              />
            </Link>
          )
        })}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
    </nav>
  )
}

export default Navbar