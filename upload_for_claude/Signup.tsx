import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell, { Field } from '../components/AuthShell'
import { authButton, authInput } from '../components/authStyles'

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

// 0..4: length, mixed case, digit, symbol. Only a hint; the server enforces the real rule (6+ chars).
function strength(p: string) {
  let s = 0
  if (p.length >= 6) s++
  if (p.length >= 10) s++
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++
  return p.length ? Math.max(1, s) : 0
}
const STRENGTH = ['', 'Weak', 'Okay', 'Good', 'Strong']
const BAR = ['', 'bg-red-400', 'bg-amber', 'bg-cyan', 'bg-emerald-400']

export default function Signup() {
  const { user, signup } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const touch = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }))
  const errs = {
    name: touched.name && name.trim().length < 2 ? 'Name must be at least 2 characters.' : '',
    email: touched.email && email && !emailOk(email.trim()) ? 'Enter a valid email address.' : '',
    password: touched.password && password && password.length < 6 ? 'Use at least 6 characters.' : '',
    confirm: touched.confirm && confirm && confirm !== password ? 'Passwords do not match.' : '',
  }
  const score = strength(password)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await signup(name, email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setBusy(false)
    }
  }

  const bind = (k: keyof typeof errs) => ({ onBlur: touch(k), 'aria-invalid': !!errs[k], 'aria-describedby': errs[k] ? `su-${k}-err` : undefined })

  return (
    <AuthShell
      eyebrow="// auth.signup()"
      title="Join the Arena"
      subtitle="Create an account and start your personal DSA journey."
      footer={<>Already have an account? <Link to="/login" className="text-cyan hover:underline">Login</Link></>}
    >
      <form onSubmit={onSubmit}>
        <Field label="Name" htmlFor="su-name" error={errs.name}>
          <input id="su-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={authInput} {...bind('name')} />
        </Field>

        <Field label="Email" htmlFor="su-email" error={errs.email}>
          <input id="su-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={authInput} {...bind('email')} />
        </Field>

        <Field
          label="Password"
          htmlFor="su-password"
          error={errs.password}
          hint={
            password ? (
              <div className="mt-2 flex items-center gap-2" aria-live="polite">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= score ? BAR[score] : 'bg-white/10'}`} />
                  ))}
                </div>
                <span className="text-fog/50 font-mono text-[11px]">{STRENGTH[score]}</span>
              </div>
            ) : null
          }
        >
          <input id="su-password" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className={authInput} {...bind('password')} />
        </Field>

        <Field label="Confirm password" htmlFor="su-confirm" error={errs.confirm}>
          <input id="su-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" className={authInput} {...bind('confirm')} />
        </Field>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <button type="submit" disabled={busy} className={authButton}>
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
