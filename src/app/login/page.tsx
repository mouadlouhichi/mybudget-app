'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { EnvelopeSimple, LockSimple, User, ArrowRight, Wallet } from '@phosphor-icons/react/dist/ssr'

export default function LoginPage() {
  const { signInGoogle, signInEmail, signUpEmail } = useAuth()
  const router = useRouter()
  const [mode, setMode]       = useState<'login' | 'signup'>('login')
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [name, setName]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    try { setLoading(true); await signInGoogle(); router.replace('/dashboard') }
    catch (e: any) { setError(e.message); setLoading(false) }
  }
  async function handleEmail() {
    try {
      setLoading(true); setError('')
      if (mode === 'signup') await signUpEmail(email, pass, name)
      else await signInEmail(email, pass)
      router.replace('/dashboard')
    } catch (e: any) { setError(e.message.replace('Firebase: ', '')); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm relative slide-up">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-btn)' }}>
            <Wallet size={28} weight="bold" color="#1B1510" />
          </div>
          <h1 className="f-display" style={{ fontSize: 32, fontWeight: 700, color: 'var(--t1)' }}>Flousy</h1>
          <p style={{ color: 'var(--t2)', fontSize: 14, marginTop: 6 }}>
            {mode === 'login' ? 'Welcome back. Track smarter.' : 'Start your financial clarity journey.'}
          </p>
        </div>

        {/* Card */}
        <div className="glass p-6 space-y-4">
          <button onClick={handleGoogle} disabled={loading} className="btn-ghost w-full tap">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.3 13 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
              <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.3 0-11.6-4.2-13.5-10l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div style={{ flex: 1, height: 1, background: 'var(--border-2)' }} />
            <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-2)' }} />
          </div>

          {mode === 'signup' && (
            <div className="relative">
              <User size={16} color="var(--t3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input className="field" style={{ paddingLeft: 40 }} placeholder="Full name"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="relative">
            <EnvelopeSimple size={16} color="var(--t3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input className="field" style={{ paddingLeft: 40 }} placeholder="Email address"
              type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <LockSimple size={16} color="var(--t3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input className="field" style={{ paddingLeft: 40 }} placeholder="Password"
              type="password" value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmail()} />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--bad)', background: 'var(--bad-tint)', padding: '10px 14px',
              borderRadius: 10, border: '1px solid var(--bad-tint)' }}>
              {error}
            </p>
          )}

          <button onClick={handleEmail} disabled={loading} className="btn-primary tap">
            {loading
              ? <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(27,21,16,0.35)', borderTopColor: '#1B1510' }} />
              : <><ArrowRight size={16} weight="bold" /> {mode === 'login' ? 'Sign in' : 'Create account'}</>}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              style={{ color: 'var(--accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          {['Encrypted', 'Cloud sync', 'Installable'].map(b => (
            <span key={b} style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
