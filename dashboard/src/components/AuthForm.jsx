import { useState } from 'react'
import { signup, login } from '../lib/auth.js'

// Gate in front of the guardian dashboard (CLAUDE.md's Authentication
// section) — a family member needs the household's pairing code (shown once
// on the mirror at first launch, see mirror/src/components/PairingScreen.jsx)
// plus their own name + password.
export default function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [pairingCode, setPairingCode] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const action = mode === 'signup' ? signup : login
      const token = await action({ pairingCode: pairingCode.trim(), name: name.trim(), password })
      onAuthenticated(token)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[28px] shadow-[0_10px_28px_rgba(92,30,46,0.12)] p-8 max-w-[380px] w-full"
      >
        <h2 className="font-serif text-xl text-wine mb-1">
          {mode === 'signup' ? 'Join your household' : 'Welcome back'}
        </h2>
        <p className="text-[13px] text-muted mb-5">
          {mode === 'signup'
            ? 'Enter the pairing code shown on the mirror to connect.'
            : 'Sign in with your household pairing code and name.'}
        </p>

        <label className="block text-xs font-semibold text-wine mb-1" htmlFor="pairingCode">
          Pairing code
        </label>
        <input
          id="pairingCode"
          value={pairingCode}
          onChange={(e) => setPairingCode(e.target.value)}
          placeholder="e.g. 7K4M9P"
          className="w-full border border-line rounded-xl px-3 py-2.5 text-sm mb-3 outline-none focus:border-rose uppercase"
          required
        />

        <label className="block text-xs font-semibold text-wine mb-1" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-line rounded-xl px-3 py-2.5 text-sm mb-3 outline-none focus:border-rose"
          required
        />

        <label className="block text-xs font-semibold text-wine mb-1" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-line rounded-xl px-3 py-2.5 text-sm mb-4 outline-none focus:border-rose"
          required
          minLength={6}
        />

        {error && <p className="text-xs text-urgent mb-3">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-rose text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signup' ? 'login' : 'signup')
            setError('')
          }}
          className="w-full text-xs text-muted mt-3 underline"
        >
          {mode === 'signup' ? 'Already have an account? Log in' : 'New family member? Sign up'}
        </button>
      </form>
    </div>
  )
}
