import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useArena } from '../context/ArenaContext'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { open, toggleArena } = useArena()
  const isAuthenticated = !!user

  function handleLogout() {
    logout()
    navigate('/')
  }

  const navLinks = isAuthenticated
    ? [
        { to: '/', label: 'Home' },
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/notes', label: 'Notes' },
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/login', label: 'Login' },
      ]

  return (
    <nav className="relative bg-panel/60 backdrop-blur-sm border-b border-panel-border px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <span className="text-cyan text-xl font-mono group-hover:animate-pulse">{'</>'}</span>
        <span className="text-cyan font-display font-bold text-xl tracking-tight">
          Algo<span className="text-white">Arena</span>
        </span>
      </Link>

      <div className="flex items-center gap-8">
        {navLinks.map((link) => {
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

        {isAuthenticated && (
          <button
            onClick={toggleArena}
            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs transition-all duration-300 ${
              open
                ? 'border-cyan bg-cyan/15 text-cyan shadow-[0_0_14px_rgba(45,226,230,0.35)]'
                : 'border-cyan/40 text-cyan hover:bg-cyan/10 hover:shadow-[0_0_14px_rgba(45,226,230,0.25)]'
            }`}
          >
            <span>✦</span>
            <span>Ask Arena</span>
            <kbd className="border-cyan/30 text-cyan/60 hidden rounded border px-1.5 text-[10px] md:inline">
              Ctrl K
            </kbd>
          </button>
        )}

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-violet">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-mono text-fog/60 hover:text-amber border border-panel-border hover:border-amber/40 rounded-md px-3 py-1.5 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/signup"
            className="text-xs font-mono bg-cyan text-void font-bold px-4 py-1.5 rounded-md hover:shadow-lg hover:shadow-cyan/30 transition-all duration-300"
          >
            Sign Up
          </Link>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
    </nav>
  )
}

export default Navbar