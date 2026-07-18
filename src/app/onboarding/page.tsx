'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { saveMonth } from '@/lib/db'
import {
  ExpenseType, FixedType, SUGGESTED_VARIABLE_CATEGORIES, SUGGESTED_FIXED_CATEGORIES,
  MANAGEMENT_STRATEGIES, buildMonthFromOnboarding,
} from '@/lib/store'
import { CAT_ICON } from '@/lib/category-icons'
import { Wallet, ArrowRight, ArrowLeft, Check, Sparkle } from '@phosphor-icons/react/dist/ssr'

function currentMonthId() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

const STEPS = ['Income', 'Expense categories', 'Fixed bills', 'Strategy', 'Review'] as const

export default function OnboardingPage() {
  const { user, profile, loading: authLoading, signOut, completeOnboarding } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [income, setIncome] = useState('')
  const [variableCats, setVariableCats] = useState<ExpenseType[]>(
    SUGGESTED_VARIABLE_CATEGORIES.filter(c => c.recommended).map(c => c.type)
  )
  const [fixedCats, setFixedCats] = useState<FixedType[]>(
    SUGGESTED_FIXED_CATEGORIES.filter(c => c.recommended).map(c => c.type)
  )
  const [strategyId, setStrategyId] = useState(MANAGEMENT_STRATEGIES.find(s => s.recommended)?.id ?? MANAGEMENT_STRATEGIES[0].id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (profile?.onboardingComplete) router.replace('/dashboard')
  }, [profile, router])

  const incomeNum = parseFloat(income) || 0

  function toggle<T>(list: T[], setList: (v: T[]) => void, val: T) {
    setList(list.includes(val) ? list.filter(v => v !== val) : [...list, val])
  }

  async function finish() {
    if (!user) return
    setSaving(true); setError('')
    try {
      const monthId = currentMonthId()
      const month = buildMonthFromOnboarding(monthId, {
        income: incomeNum, variableCategories: variableCats, fixedCategories: fixedCats, strategyId,
      })
      await saveMonth(user.uid, month)
      await completeOnboarding()
      router.replace('/dashboard')
    } catch (e) {
      console.error(e)
      setError("Couldn't save your setup. Check your connection and try again.")
      setSaving(false)
    }
  }

  const canNext =
    step === 0 ? incomeNum > 0 :
    step === 1 ? variableCats.length > 0 :
    step === 2 ? true :
    step === 3 ? !!strategyId : true

  const strategy = MANAGEMENT_STRATEGIES.find(s => s.id === strategyId) ?? MANAGEMENT_STRATEGIES[0]
  const homePart = Math.round(incomeNum * strategy.homeShare)
  const bankPart = Math.round(incomeNum * strategy.bankShare)
  const walletPart = Math.max(0, incomeNum - homePart - bankPart)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm relative slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-btn)' }}>
            <Wallet size={28} weight="bold" color="var(--accent-ink)" />
          </div>
          <h1 className="f-display" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>Set up your budget</h1>
          <p style={{ color: 'var(--t2)', fontSize: 13, marginTop: 6 }}>
            Step {step + 1} of {STEPS.length} - {STEPS[step]}
          </p>
        </div>

        <div className="glass p-6 space-y-4">
          {step === 0 && (
            <div className="space-y-3">
              <p style={{ fontSize: 13, color: 'var(--t2)' }}>What's your monthly income? We'll use it to suggest budgets for each category.</p>
              <input
                className="field" style={{ fontSize: 18, fontWeight: 700 }}
                placeholder="e.g. 8500" inputMode="decimal" type="number" min={0}
                value={income} onChange={e => setIncome(e.target.value)}
                autoFocus
              />
              <p style={{ fontSize: 11, color: 'var(--t3)' }}>Amount in MAD, before any deductions.</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 4 }}>
                Pick the categories you spend on day to day. We've preselected the ones most people need.
              </p>
              {SUGGESTED_VARIABLE_CATEGORIES.map(c => {
                const Icon = CAT_ICON[c.type]
                const active = variableCats.includes(c.type)
                return (
                  <button key={c.type} onClick={() => toggle(variableCats, setVariableCats, c.type)}
                    className="tap w-full" style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                      borderRadius: 'var(--r-field)', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
                      background: active ? 'var(--accent-tint)' : 'var(--surface-2)', textAlign: 'left',
                    }}>
                    {Icon && <Icon size={18} color="var(--t1)" />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
                        {c.type} {c.recommended && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-dim)' }}> · suggested</span>}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--t3)' }}>{c.hint}</p>
                    </div>
                    {active && <Check size={16} weight="bold" color="var(--t1)" />}
                  </button>
                )
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 4 }}>
                Which recurring bills do you pay each month?
              </p>
              {SUGGESTED_FIXED_CATEGORIES.map(c => {
                const Icon = CAT_ICON[c.type]
                const active = fixedCats.includes(c.type)
                return (
                  <button key={c.type} onClick={() => toggle(fixedCats, setFixedCats, c.type)}
                    className="tap w-full" style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                      borderRadius: 'var(--r-field)', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
                      background: active ? 'var(--accent-tint)' : 'var(--surface-2)', textAlign: 'left',
                    }}>
                    {Icon && <Icon size={18} color="var(--t1)" />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
                        {c.type} {c.recommended && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-dim)' }}> · suggested</span>}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--t3)' }}>{c.hint}</p>
                    </div>
                    {active && <Check size={16} weight="bold" color="var(--t1)" />}
                  </button>
                )
              })}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 4 }}>
                How do you want to manage your money? Pick a strategy, you can change this anytime.
              </p>
              {MANAGEMENT_STRATEGIES.map(s => {
                const active = s.id === strategyId
                return (
                  <button key={s.id} onClick={() => setStrategyId(s.id)}
                    className="tap w-full" style={{
                      padding: '12px 14px', borderRadius: 'var(--r-field)',
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
                      background: active ? 'var(--accent-tint)' : 'var(--surface-2)', textAlign: 'left',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', flex: 1 }}>{s.name}</p>
                      {active && <Check size={16} weight="bold" color="var(--t1)" />}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--accent-dim)', fontWeight: 700, marginTop: 2 }}>{s.tagline}</p>
                    <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, lineHeight: 1.4 }}>{s.description}</p>
                  </button>
                )
              })}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="glass-2" style={{ padding: 14 }}>
                <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700 }}>MONTHLY INCOME</p>
                <p className="f-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)' }}>{incomeNum.toLocaleString('fr-MA')} MAD</p>
              </div>
              <div className="glass-2" style={{ padding: 14, display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700 }}>BANK</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{bankPart.toLocaleString('fr-MA')} MAD</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700 }}>HOME</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{homePart.toLocaleString('fr-MA')} MAD</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700 }}>WALLET</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{walletPart.toLocaleString('fr-MA')} MAD</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--t2)' }}>
                <Sparkle size={13} style={{ verticalAlign: -2 }} /> Strategy: <strong>{strategy.name}</strong>
              </p>
              <p style={{ fontSize: 12, color: 'var(--t2)' }}>
                {variableCats.length} expense categor{variableCats.length === 1 ? 'y' : 'ies'} and {fixedCats.length} fixed bill{fixedCats.length === 1 ? '' : 's'} set up, with suggested budgets you can fine-tune anytime.
              </p>
            </div>
          )}

          {error && <p className="banner banner-error">{error}</p>}

          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} disabled={saving} className="btn-ghost tap" style={{ width: 'auto', padding: '12px 18px' }}>
                <ArrowLeft size={16} weight="bold" />
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => canNext && setStep(s => s + 1)} disabled={!canNext} className="btn-primary tap">
                Continue <ArrowRight size={16} weight="bold" />
              </button>
            ) : (
              <button onClick={finish} disabled={saving} className="btn-primary tap">
                {saving
                  ? <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,0,0,0.25)', borderTopColor: 'var(--accent-ink)' }} />
                  : <>Start budgeting <ArrowRight size={16} weight="bold" /></>}
              </button>
            )}
          </div>
        </div>

        <button onClick={() => signOut()} className="tap" style={{ display: 'block', margin: '16px auto 0', fontSize: 12, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
