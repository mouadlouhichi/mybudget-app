'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const { signInGoogle, signInEmail, signUpEmail, resetPassword, configError } = useAuth()
  const router = useRouter()
  const [mode, setMode]       = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [name, setName]       = useState('')
  const [error, setError]     = useState('')
  const [notice, setNotice]   = useState('')
  const [loading, setLoading] = useState(false)

  function friendly(e: unknown): string {
    const code = (e as { code?: string })?.code ?? ''
    const map: Record<string, string> = {
      'auth/invalid-credential': 'That email or password is incorrect.',
      'auth/wrong-password': 'That email or password is incorrect.',
      'auth/user-not-found': 'No account found with that email.',
      'auth/email-already-in-use': 'An account with that email already exists. Try signing in.',
      'auth/weak-password': 'Please choose a password of at least 6 characters.',
      'auth/invalid-email': 'That email address doesn\u2019t look right.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/network-request-failed': 'Network problem. Check your connection and try again.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    }
    if (map[code]) return map[code]
    const msg = (e as { message?: string })?.message ?? 'Something went wrong. Please try again.'
    return msg.replace('Firebase: ', '').replace(/\(auth\/[^)]+\)\.?/, '').trim()
  }

  async function handleGoogle() {
    try { setLoading(true); setError(''); await signInGoogle(); router.replace('/dashboard') }
    catch (e: unknown) { setError(friendly(e)); setLoading(false) }
  }
  async function handleEmail() {
    try {
      setLoading(true); setError('')
      if (!email || !pass || (mode === 'signup' && !name)) { setError('Please fill in all fields.'); setLoading(false); return }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError('That email address doesn\u2019t look right.'); setLoading(false); return }
      if (mode === 'signup' && pass.length < 6) { setError('Please choose a password of at least 6 characters.'); setLoading(false); return }
      if (mode === 'signup') await signUpEmail(email, pass, name)
      else await signInEmail(email, pass)
      router.replace('/dashboard')
    } catch (e: unknown) { setError(friendly(e)); setLoading(false) }
  }
  async function handleReset() {
    try {
      setLoading(true); setError(''); setNotice('')
      if (!email) { setError('Enter your email first.'); setLoading(false); return }
      await resetPassword(email)
      setNotice('Password reset email sent — check your inbox.')
    } catch (e: unknown) { setError(friendly(e)) }
    finally { setLoading(false) }
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="glass" style={{maxWidth:380,padding:24,textAlign:'center'}}>
          <p className="f-display" style={{fontWeight:700,fontSize:17,color:'var(--t1)',marginBottom:8}}>Firebase isn&rsquo;t configured</p>
          <p style={{fontSize:13,color:'var(--t2)',lineHeight:1.5}}>
            Add your Firebase project credentials to <code style={{background:'var(--surface-2)',padding:'1px 5px',borderRadius:4}}>.env.local</code> (see <code style={{background:'var(--surface-2)',padding:'1px 5px',borderRadius:4}}>.env.local.example</code>) and restart the app to enable sign-in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-background px-5 py-10">
      <main className="w-full max-w-[420px] bg-surface border border-border shadow-md rounded-[24px] p-6 md:p-8 flex flex-col gap-6 slide-up">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1.5 mb-2">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Flousy</h1>
          <p className="text-sm text-t2">
            {mode === 'login'
              ? 'Welcome back to your financial center'
              : mode === 'signup'
              ? 'Start your financial clarity journey'
              : 'Reset your password'}
          </p>
        </div>

        {/* Inline Error banner if needed */}
        {error && (
          <div className="w-full bg-bad-tint border border-bad rounded-xl p-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-bad text-[20px] mt-[2px]">error</span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-bad">Alert</span>
              <span className="text-xs text-t2 mt-0.5 leading-relaxed">{error}</span>
            </div>
          </div>
        )}

        {notice && (
          <div className="w-full bg-good-tint border border-good rounded-xl p-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-good text-[20px] mt-[2px]">check_circle</span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-good">Success</span>
              <span className="text-xs text-t2 mt-0.5 leading-relaxed">{notice}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-t2 uppercase tracking-wider" htmlFor="name">Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-t3 text-[20px]">person</span>
                <input
                  className="field pl-10"
                  id="name"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-t2 uppercase tracking-wider" htmlFor="email">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-t3 text-[20px]">mail</span>
              <input
                className="field pl-10"
                id="email"
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && mode === 'reset' && handleReset()}
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-t2 uppercase tracking-wider" htmlFor="password">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(''); setNotice('') }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-t3 text-[20px]">lock</span>
                <input
                  className="field pl-10"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmail()}
                />
              </div>
            </div>
          )}

          <button
            onClick={mode === 'reset' ? handleReset : handleEmail}
            disabled={loading}
            className="w-full mt-2 bg-primary text-on-primary font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2 tap"
            style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: 'var(--accent-ink)' }} />
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                {mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </>
            )}
          </button>
        </div>

        {mode !== 'reset' && (
          <>
            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-px bg-border flex-grow" />
              <span className="text-xs font-bold text-t3">OR</span>
              <div className="h-px bg-border flex-grow" />
            </div>

            {/* Google continue */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full bg-surface-container-lowest border border-border text-t1 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 hover:bg-surface-2 transition-all tap text-sm"
              style={{ background: 'var(--surface-container-lowest)' }}
            >
              <svg height="18px" viewBox="0 0 48 48" width="18px" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335"></path>
                <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4"></path>
                <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05"></path>
                <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853"></path>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        {/* Footer Link */}
        <div className="text-center">
          {mode === 'reset' ? (
            <button
              onClick={() => { setMode('login'); setError(''); setNotice('') }}
              className="text-xs text-primary font-bold hover:underline"
            >
              Back to log in
            </button>
          ) : (
            <>
              <span className="text-xs font-semibold text-t2">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                className="text-xs text-primary font-bold hover:underline"
              >
                {mode === 'login' ? 'Create account' : 'Log in'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
