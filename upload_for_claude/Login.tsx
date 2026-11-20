import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell, { Field } from '../components/AuthShell'
import { authButton, authInput } from '../components/authStyles'

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [touched, setTouched] = useState<{ email?: boolean }>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from} replace />

  const emailErr = touched.email && email && !emailOk(email.trim()) ? 'Enter a valid email address.' : ''

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="// auth.login()"
      title="Welcome back"
      subtitle="Log in to continue your DSA journey."
      footer={<>Don't have an account? <Link to="/signup" className="text-cyan hover:underline">Sign up</Link></>}
    >
      <form onSubmit={onSubmit} noValidate={false}>
        <Field label="Email" htmlFor="login-email" error={emailErr}>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched({ email: true })}
            aria-invalid={!!emailErr}
            aria-describedby={emailErr ? 'login-email-err' : undefined}
            placeholder="you@example.com"
            className={authInput}
          />
        </Field>

        <Field label="Password" htmlFor="login-password">
          <div className="relative">
            <input
              id="login-password"
              type={show ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${authInput} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="text-cyan/70 hover:text-cyan absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs"
            >
              {show ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </Field>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <button type="submit" disabled={busy} className={authButton}>
          {busy ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </AuthShell>
  )
}
