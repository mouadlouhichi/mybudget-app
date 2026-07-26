'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  Wallet, ArrowRight, ChartPieSlice, PiggyBank, ShieldCheck, DeviceMobile,
} from '@phosphor-icons/react/dist/ssr'

// Signed-in users go straight to the dashboard. Everyone else gets a real
// landing page explaining the product rather than an immediate redirect to
// a login form.
export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (loading) return
    if (user) router.replace('/dashboard')
    else setChecked(true)
  }, [user, loading, router])

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          role="status" aria-label="Loading"
        />
      </div>
    )
  }

  const features = [
    { Icon: ChartPieSlice, title: 'A plan, not just a log', body: 'Pick a strategy like 50/30/20 and your income is split into needs, wants and savings envelopes automatically.' },
    { Icon: Wallet, title: 'Know where your cash is', body: 'Track money across bank, home and wallet. Every expense comes out of a real place, so the balances always match reality.' },
    { Icon: PiggyBank, title: 'Goals that actually move', body: 'Fund a goal and the money leaves your account. Withdraw and it comes back. No make-believe totals.' },
    { Icon: ShieldCheck, title: 'Private by default', body: 'Your data is yours alone, never sold or shared. Export it as CSV or delete everything, any time.' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={16} weight="bold" color="var(--accent-ink)" />
          </div>
          <span className="f-display" style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)' }}>Flousy</span>
        </div>
        <Link
          href="/login"
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', textDecoration: 'none', padding: '8px 16px', borderRadius: 999, border: '1px solid var(--border-2)' }}
        >
          Sign in
        </Link>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '56px 0 44px' }} className="slide-up">
          <div
            className="inline-flex items-center gap-2"
            style={{ padding: '5px 13px', borderRadius: 999, background: 'var(--accent-tint)', marginBottom: 20 }}
          >
            <DeviceMobile size={13} weight="bold" color="var(--accent-dim)" />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent-dim)' }}>Installs like an app</span>
          </div>
          <h1 className="f-display" style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Track every dirham,<br />hit every goal.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--t2)', maxWidth: 520, margin: '18px auto 30px', lineHeight: 1.6 }}>
            A private, mobile-first budget tracker that knows the difference between what your money is
            <em> for</em> and where it actually <em>is</em>.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn-primary tap" style={{ width: 'auto', padding: '14px 28px', textDecoration: 'none' }}>
              Start free <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
          <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 14 }}>Free to use · No card required · No bank connection</p>
        </section>

        {/* Features */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 56 }}>
          {features.map(f => (
            <div key={f.title} className="glass" style={{ padding: 22 }}>
              <div
                style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              >
                <f.Icon size={19} weight="bold" color="var(--accent-dim)" />
              </div>
              <h2 className="f-display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>{f.title}</h2>
              <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="glass" style={{ padding: 36, textAlign: 'center' }}>
          <h2 className="f-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
            Get your month under control
          </h2>
          <p style={{ fontSize: 14, color: 'var(--t2)', maxWidth: 420, margin: '0 auto 22px', lineHeight: 1.6 }}>
            Set up your budget in about a minute. Everything stays private to your account.
          </p>
          <Link href="/login" className="btn-primary tap" style={{ width: 'auto', padding: '14px 28px', textDecoration: 'none', display: 'inline-flex' }}>
            Create your budget <ArrowRight size={16} weight="bold" />
          </Link>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <Link href="/privacy" style={{ fontSize: 12.5, color: 'var(--t2)', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/terms" style={{ fontSize: 12.5, color: 'var(--t2)', textDecoration: 'none' }}>Terms</Link>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--t3)' }}>© {new Date().getFullYear()} Flousy</p>
      </footer>
    </div>
  )
}
