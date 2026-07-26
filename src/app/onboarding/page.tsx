'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { saveMonth, getSavings, saveSavings } from '@/lib/db'
import {
  ExpenseType, FixedType, SUGGESTED_VARIABLE_CATEGORIES, SUGGESTED_FIXED_CATEGORIES,
  MANAGEMENT_STRATEGIES, buildMonthFromOnboarding, getStrategy, strategyEnvelopes,
  DEFAULT_SAVINGS_GOAL_NAME, SavingGoal,
} from '@/lib/store'
import { CAT_ICON } from '@/lib/category-icons'
import { Wallet, ArrowRight, ArrowLeft, Check, Sparkle, Bank, CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { validate, incomeSchema } from '@/lib/validation'
import { CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currency'

function currentMonthId() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

const STEPS = ['Income', 'Expense categories', 'Fixed bills', 'Strategy', 'Review'] as const

export default function OnboardingPage() {
  const { user, profile, loading: authLoading, signOut, completeOnboarding, setCurrency } = useAuth()
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
  const [currency, setCurrencyCode] = useState(DEFAULT_CURRENCY)
  const [incomeError, setIncomeError] = useState('')
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
      if (currency !== DEFAULT_CURRENCY) {
        try { await setCurrency(currency) } catch (e) { console.error('currency save failed', e) }
      }

      // Turn the strategy's savings share into a real, trackable goal.
      if (envelopes.savings > 0) {
        const existing = await getSavings(user.uid)
        if (!existing?.goals?.length) {
          const goal: SavingGoal = {
            id: Math.random().toString(36).slice(2, 10),
            name: DEFAULT_SAVINGS_GOAL_NAME,
            target: envelopes.savings,
            current: 0,
            source: 'BANK',
            active: true,
          }
          await saveSavings(user.uid, { goals: [goal] })
        }
      }

      await completeOnboarding()
      router.replace('/dashboard')
    } catch (e) {
      console.error(e)
      setError("Couldn't save your setup. Check your connection and try again.")
      setSaving(false)
    }
  }

  function handleNext() {
    if (step === 0) {
      const r = validate(incomeSchema, income)
      if (!r.ok) { setIncomeError(Object.values(r.errors)[0] ?? 'Enter a valid income.'); return }
    }
    if (canNext) setStep(s => s + 1)
  }

  const canNext =
    step === 0 ? incomeNum > 0 :
    step === 1 ? variableCats.length > 0 :
    step === 2 ? true :
    step === 3 ? !!strategyId : true

  const strategy  = getStrategy(strategyId)
  const envelopes = strategyEnvelopes(incomeNum, strategyId)

  // Step calculations for Donut SVG chart in Step 5 (Review)
  const needsShare = strategy?.needsShare ?? 0.5
  const wantsShare = strategy?.wantsShare ?? 0.3
  const savingsShare = strategy?.savingsShare ?? 0.2

  const needsDash = 502 * needsShare
  const wantsDash = 502 * wantsShare
  const savingsDash = 502 * savingsShare

  const wantsOffset = -needsDash
  const savingsOffset = -(needsDash + wantsDash)

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-start pb-24 font-body-md antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full flex justify-between items-center px-4 h-16 bg-surface border-b border-border z-50">
        <button
          aria-label="Go back"
          onClick={() => step > 0 && setStep(s => s - 1)}
          disabled={step === 0 || saving}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft size={20} color="var(--t1)" />
        </button>
        <span className="font-headline-md text-headline-md font-bold text-primary">Flousy</span>
        <div className="w-10" />
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[540px] px-4 pt-24 pb-8 flex-grow flex flex-col justify-start">
        {/* Progress Indicator */}
        <div className="mb-6 w-full">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-t2 uppercase tracking-wider">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs font-semibold text-primary">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="glass p-6 space-y-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-t1 mb-1.5">What is your monthly income?</h1>
                <p className="text-sm text-t2">We use this to set up your baseline budget and recommend saving goals.</p>
              </div>

              {/* Bento style card */}
              <div className="space-y-4 pt-2">
                <div className="relative flex items-center gap-2">
                  <select
                    className="field font-bold" style={{ width: 100, flexShrink: 0 }} value={currency}
                    onChange={e => setCurrencyCode(e.target.value)} aria-label="Currency"
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                  <input
                    className="field text-right text-xl font-bold"
                    placeholder="0.00" inputMode="decimal" type="number" min={0}
                    value={income} onChange={e => { setIncome(e.target.value); setIncomeError('') }}
                    aria-invalid={!!incomeError} autoFocus
                  />
                </div>
                {incomeError && <p role="alert" className="text-xs text-bad">{incomeError}</p>}
                
                {/* Suggestions */}
                <div className="flex gap-2 justify-center md:justify-start pt-1">
                  {['5000', '10000', '15000'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setIncome(val); setIncomeError('') }}
                      className="px-4 py-1.5 rounded-full border border-border text-t2 font-medium text-xs hover:border-primary hover:text-primary transition-colors focus:outline-none"
                    >
                      {parseFloat(val).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-t1 mb-1.5">Select your budget categories</h1>
                <p className="text-sm text-t2">Choose the main areas where you spend your money to tailor your dashboard.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {SUGGESTED_VARIABLE_CATEGORIES.map(c => {
                  const Icon = CAT_ICON[c.type]
                  const active = variableCats.includes(c.type)
                  return (
                    <button
                      key={c.type}
                      type="button"
                      onClick={() => toggle(variableCats, setVariableCats, c.type)}
                      className="tap w-full flex items-center justify-between p-3 rounded-xl border transition-colors duration-200 text-left focus:outline-none"
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--border-2)',
                        background: active ? 'var(--accent-tint)' : 'var(--surface-2)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon size={18} color={active ? 'var(--accent)' : 'var(--t2)'} />}
                        <div>
                          <p className="text-xs font-bold text-t1">
                            {c.type}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--t3)' }}>{c.hint}</p>
                        </div>
                      </div>
                      {active && <CheckCircle size={18} weight="fill" color="var(--accent)" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-t1 mb-1.5">Which recurring bills do you pay?</h1>
                <p className="text-sm text-t2">We&rsquo;ve preselected the bills most people pay. Untick any you don&rsquo;t pay.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {SUGGESTED_FIXED_CATEGORIES.map(c => {
                  const Icon = CAT_ICON[c.type]
                  const active = fixedCats.includes(c.type)
                  return (
                    <button
                      key={c.type}
                      type="button"
                      onClick={() => toggle(fixedCats, setFixedCats, c.type)}
                      className="tap w-full flex items-center justify-between p-3 rounded-xl border transition-colors duration-200 text-left focus:outline-none"
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--border-2)',
                        background: active ? 'var(--accent-tint)' : 'var(--surface-2)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon size={18} color={active ? 'var(--accent)' : 'var(--t2)'} />}
                        <div>
                          <p className="text-xs font-bold text-t1">
                            {c.type}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--t3)' }}>{c.hint}</p>
                        </div>
                      </div>
                      {active && <CheckCircle size={18} weight="fill" color="var(--accent)" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-t1 mb-1.5">Select budgeting strategy</h1>
                <p className="text-sm text-t2">How should your income be divided between needs, wants and savings?</p>
              </div>

              <div className="space-y-3 pt-2">
                {MANAGEMENT_STRATEGIES.map(s => {
                  const active = s.id === strategyId
                  const env = strategyEnvelopes(incomeNum, s.id)
                  const split: { key: 'needs' | 'wants' | 'savings'; label: string; color: string }[] = [
                    { key: 'needs',   label: 'Needs',   color: 'var(--accent-dim)' },
                    { key: 'wants',   label: 'Wants',   color: 'var(--accent)' },
                    { key: 'savings', label: 'Savings', color: 'var(--good)' },
                  ]
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStrategyId(s.id)}
                      className="tap w-full p-4 rounded-xl border transition-all text-left focus:outline-none"
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--border-2)',
                        background: active ? 'var(--accent-tint)' : 'var(--surface-2)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-t1">{s.name}</p>
                        {active && <CheckCircle size={18} weight="fill" color="var(--accent)" />}
                      </div>
                      <p className="text-xs font-semibold text-accent-dim mt-0.5">{s.tagline}</p>
                      <p className="text-xs text-t3 mt-1.5 leading-relaxed">{s.description}</p>

                      {/* Proportional Split Bar */}
                      <div className="flex h-1.5 rounded-full overflow-hidden mt-3 bg-surface-3">
                        {split.map(p => (
                          <div key={p.key} style={{ width: `${s[`${p.key}Share` as const] * 100}%`, background: p.color }} />
                        ))}
                      </div>

                      <div className="flex gap-4 mt-3">
                        {split.map(p => (
                          <div key={p.key} className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {p.label} {Math.round(s[`${p.key}Share` as const] * 100)}%
                              </span>
                            </div>
                            {incomeNum > 0 && (
                              <p className="num text-xs font-bold text-t1 mt-0.5">
                                {env[p.key].toLocaleString('fr-MA')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-t1 mb-1.5">Your Budget Overview</h1>
                <p className="text-sm text-t2">Here is your calculated monthly plan based on the {strategy.name} rule.</p>
              </div>

              {/* Spectacular Donut SVG Chart */}
              <div className="relative w-48 h-48 flex items-center justify-center mx-auto my-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Background Track */}
                  <circle className="stroke-surface-3" cx="100" cy="100" fill="none" r="80" strokeWidth="12" style={{ stroke: 'var(--surface-3)' }} />
                  {/* Needs Segment */}
                  {needsShare > 0 && (
                    <circle
                      className="stroke-accent transition-all duration-1000 ease-in-out"
                      cx="100" cy="100" fill="none" r="80" strokeWidth="12"
                      strokeDasharray={`${needsDash} 502`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  )}
                  {/* Wants Segment */}
                  {wantsShare > 0 && (
                    <circle
                      className="stroke-secondary transition-all duration-1000 ease-in-out"
                      cx="100" cy="100" fill="none" r="80" strokeWidth="12"
                      strokeDasharray={`${wantsDash} 502`}
                      strokeDashoffset={wantsOffset}
                      strokeLinecap="round"
                      style={{ stroke: 'var(--accent-dim)' }}
                    />
                  )}
                  {/* Savings Segment */}
                  {savingsShare > 0 && (
                    <circle
                      className="stroke-tertiary transition-all duration-1000 ease-in-out"
                      cx="100" cy="100" fill="none" r="80" strokeWidth="12"
                      strokeDasharray={`${savingsDash} 502`}
                      strokeDashoffset={savingsOffset}
                      strokeLinecap="round"
                      style={{ stroke: 'var(--good)' }}
                    />
                  )}
                </svg>
                {/* Center Text */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-t3 uppercase tracking-widest font-semibold">Monthly</span>
                  <span className="text-2xl font-extrabold text-t1">{incomeNum.toLocaleString(undefined)} <span className="text-xs text-t3">{currency}</span></span>
                </div>
              </div>

              {/* Summary Items List */}
              <div className="w-full flex flex-col gap-2.5 pt-2">
                {[
                  { label: 'Fixed Needs', desc: `${Math.round(needsShare * 100)}% of income`, val: envelopes.needs, color: 'var(--accent-dim)' },
                  { label: 'Variable Wants', desc: `${Math.round(wantsShare * 100)}% of income`, val: envelopes.wants, color: 'var(--accent)' },
                  { label: 'Future Savings', desc: `${Math.round(savingsShare * 100)}% of income`, val: envelopes.savings, color: 'var(--good)' },
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border-2 bg-surface-2 transition-colors hover:bg-surface-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: item.color, boxShadow: `0 0 0 4px ${item.color}22` }} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-t1">{item.label}</span>
                        <span className="text-[10px] text-t3 font-medium">{item.desc}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-t1">{item.val.toLocaleString(undefined)} {currency}</span>
                  </div>
                ))}
              </div>

              <div className="banner banner-info text-xs leading-relaxed">
                <Bank size={15} weight="bold" className="flex-shrink-0" />
                <span>Your full income starts in your <strong>Bank</strong> money place. Use <strong>Move money</strong> on the dashboard to take cash to Home or Wallet.</span>
              </div>
            </div>
          )}

          {error && <p className="banner banner-error">{error}</p>}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                disabled={saving}
                className="btn-ghost tap"
                style={{ width: 'auto', padding: '12px 18px' }}
              >
                <ArrowLeft size={16} weight="bold" />
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canNext}
                className="btn-primary tap"
              >
                Continue <ArrowRight size={16} weight="bold" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="btn-primary tap"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,0,0,0.25)', borderTopColor: 'var(--accent-ink)' }} />
                ) : (
                  <>
                    Confirm &amp; Finish <Check size={16} weight="bold" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="tap block mx-auto mt-6 text-xs text-t3 hover:text-t1 font-semibold underline underline-offset-4"
        >
          Sign out
        </button>
      </main>
    </div>
  )
}
