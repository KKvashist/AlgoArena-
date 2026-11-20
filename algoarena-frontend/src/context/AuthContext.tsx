import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type User = {
  id: string
  name: string
  email: string
  xp: number
  level: number
  /** 1 = first session ever; more = returning. Persisted by the backend. */
  loginCount?: number
  lastLoginAt?: string | null
}

type AuthCtx = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  /** Re-read the account from the backend (XP and level change when missions complete). */
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthCtx | null>(null)
const TOKEN_KEY = 'algoarena_token'

async function request(url: string, body: object) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data as { token: string; user: User }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        setUser(data.user)
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const data = await request('/api/auth/login', { email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }

  async function signup(name: string, email: string, password: string) {
    const data = await request('/api/auth/signup', { name, email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }

  async function refreshUser() {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setUser((await res.json()).user)
    } catch {
      /* the next page load picks it up */
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
