'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          role="status" aria-label="Loading"
        />
      </div>
    )
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md antialiased selection:bg-primary/20 selection:text-primary">
      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col justify-center items-center px-4 md:px-12 py-10">
        <div className="max-w-3xl w-full text-center flex flex-col items-center gap-6">
          {/* Brand Element */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 bg-[#008378] rounded-3xl flex items-center justify-center shadow-[0_8px_24px_rgba(0,131,120,0.15)] mb-4">
              <span className="material-symbols-outlined text-[48px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
              Flousy
            </h1>
            <p className="text-base text-t2 max-w-md mx-auto leading-relaxed mt-2">
              Separate what money is <em>for</em> from where it actually <em>is</em>.
            </p>
          </div>

          {/* Features Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
            {/* Feature 1 */}
            <div className="bg-surface p-6 rounded-[24px] border border-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col items-center text-center gap-3 transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                  mail
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-t1 mb-1">Budget Envelopes</h3>
                <p className="text-xs text-t2">Categorize into Needs, Wants, and Savings with absolute precision.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface p-6 rounded-[24px] border border-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col items-center text-center gap-3 transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                  account_balance
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-t1 mb-1">Money Places</h3>
                <p className="text-xs text-t2">Track exactly where your cash lives: Bank, Home, or Wallet.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface p-6 rounded-[24px] border border-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col items-center text-center gap-3 transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                  flag
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-t1 mb-1">Savings Goals</h3>
                <p className="text-xs text-t2">Set clear milestones and watch your progress grow safely.</p>
              </div>
            </div>
          </div>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-sm justify-center">
            <Link
              href="/login"
              className="bg-primary hover:opacity-95 text-white font-bold py-3.5 px-8 rounded-full shadow-[0_4px_12px_rgba(0,104,95,0.2)] transition-all duration-200 active:scale-95 text-center flex-1"
              style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-transparent border border-border hover:bg-surface-2 text-t1 font-bold py-3.5 px-8 rounded-full transition-all duration-200 active:scale-95 text-center flex-1"
            >
              Log In
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center">
        <div className="flex gap-6 justify-center flex-wrap mb-2">
          <Link href="/privacy" className="text-xs text-t2 hover:underline">Privacy</Link>
          <Link href="/terms" className="text-xs text-t2 hover:underline">Terms</Link>
        </div>
        <p className="text-[10px] text-t3">© {new Date().getFullYear()} Flousy</p>
      </footer>
    </div>
  )
}
