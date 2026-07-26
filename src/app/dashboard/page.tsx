'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  saveMonth, subscribeMonth, getMonth, saveSavings, subscribeSavings, listMonths,
} from '@/lib/db'
import {
  emptyMonth, rolloverMonth, MonthBudget, VariableExpense, FixedExpense, SavingGoal,
  SavingsData, MoneyPlace, SOURCE_TO_PLACE, moneyPlaceAmount,
  transferBetweenPlaces, applySpendDelta, fundGoal, withdrawFromGoal, releaseGoalFunds,
} from '@/lib/store'
import { CurrencyProvider, useCurrency } from '@/lib/currency-context'
import { ConfirmProvider, useConfirm } from '@/components/ui/ConfirmDialog'
import { buildFullExport, downloadCsv } from '@/lib/export'
import { newId, prevMonth, nextMonth, currentMonthId } from '@/components/ui/primitives'
import { OverviewTab } from '@/components/tabs/OverviewTab'
import { VariableTab } from '@/components/tabs/VariableTab'
import { FixedTab } from '@/components/tabs/FixedTab'
import { SavingsTab } from '@/components/tabs/SavingsTab'
import { ExpenseModal } from '@/components/modals/ExpenseModal'
import { FixedModal } from '@/components/modals/FixedModal'
import { SavingGoalModal, GoalTransferModal } from '@/components/modals/SavingModals'
import { MoveMoneyModal } from '@/components/modals/MoveMoneyModal'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { ManageCategoriesModal } from '@/components/modals/ManageCategoriesModal'
import {
  House, ChartBar, PiggyBank, Receipt, Gear, SignOut, CaretLeft, CaretRight, Wallet,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import {
  Home as LucideHome, Wallet as LucideWallet, Receipt as LucideReceipt,
  PiggyBank as LucidePiggyBank, type LucideIcon,
} from 'lucide-react'

type Tab = 'overview' | 'variable' | 'fixed' | 'savings'

export default function DashboardPage() {
  const { profile } = useAuth()
  return (
    <CurrencyProvider code={profile?.currency}>
      <ConfirmProvider>
        <Dashboard />
      </ConfirmProvider>
    </CurrencyProvider>
  )
}

function Dashboard() {
  const {
    user, profile, loading: authLoading, configError, signOut, setCurrency, deleteAccount,
  } = useAuth()
  const router = useRouter()
  const confirm = useConfirm()
  const { code: currencyCode } = useCurrency()

  const [month, setMonth] = useState<MonthBudget | null>(null)
  const monthRef = useRef<MonthBudget | null>(null)
  useEffect(() => { monthRef.current = month }, [month])

  const [monthId, setMonthId] = useState(currentMonthId())
  const [savings, setSavings] = useState<SavingsData | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Modal state
  const [showSettings, setShowSettings] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showMoveMoney, setShowMoveMoney] = useState(false)
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; edit: VariableExpense | null }>({ open: false, edit: null })
  const [fixedModal, setFixedModal] = useState<{ open: boolean; edit: FixedExpense | null }>({ open: false, edit: null })
  const [goalModal, setGoalModal] = useState<{ open: boolean; edit: SavingGoal | null }>({ open: false, edit: null })
  const [goalTransfer, setGoalTransfer] = useState<{ goal: SavingGoal; mode: 'deposit' | 'withdraw' } | null>(null)

  useEffect(() => {
    if (!authLoading && !user && !configError) router.replace('/login')
  }, [user, authLoading, configError, router])

  useEffect(() => {
    if (!authLoading && user && !configError && profile && !profile.onboardingComplete) router.replace('/onboarding')
  }, [user, profile, authLoading, configError, router])

  useEffect(() => {
    if (!user) return
    if (profile && !profile.onboardingComplete) return
    const unsub = subscribeMonth(
      user.uid, monthId,
      async m => {
        setError('')
        if (m) {
          setMonth(m)
        } else {
          let fresh: MonthBudget
          try {
            const prev = await getMonth(user.uid, prevMonth(monthId))
            fresh = prev ? rolloverMonth(monthId, prev) : emptyMonth(monthId)
          } catch (e) {
            console.error(e)
            fresh = emptyMonth(monthId)
          }
          try {
            await saveMonth(user.uid, fresh)
          } catch (e) {
            console.error(e)
            setError("Couldn't create this month's budget. Check your connection and try again.")
          }
          setMonth(fresh)
        }
      },
      () => setError("Couldn't load your budget - check your connection or Firestore setup."),
    )
    return () => unsub()
  }, [user, profile, monthId])

  // Saving goals are global - subscribed once per session. On first load
  // after the upgrade there's no global doc yet, so migrate from whatever
  // goals lived on the most recently viewed month (old per-month storage).
  useEffect(() => {
    if (!user) return
    if (profile && !profile.onboardingComplete) return
    let migrated = false
    const unsub = subscribeSavings(
      user.uid,
      async s => {
        if (s.goals.length === 0 && !migrated && monthRef.current?.savingGoals?.length) {
          migrated = true
          const seeded: SavingsData = { goals: monthRef.current.savingGoals }
          try { await saveSavings(user.uid, seeded) } catch (e) { console.error(e) }
          setSavings(seeded)
        } else {
          setSavings(s)
        }
      },
      () => setError("Couldn't load your saving goals - check your connection or Firestore setup."),
    )
    return () => unsub()
  }, [user, profile])

  // Optimistic write with rollback (M6): remember the previous state and
  // restore it if Firestore rejects, so the UI never keeps a value the
  // server refused.
  const persist = useCallback(async (updated: MonthBudget) => {
    if (!user) return
    const previous = monthRef.current
    setMonth(updated)
    setSaving(true)
    try {
      await saveMonth(user.uid, updated)
      setError('')
    } catch (e) {
      console.error(e)
      if (previous) setMonth(previous)
      setError("Couldn't save your changes - they've been rolled back. Check your connection.")
    } finally {
      setSaving(false)
    }
  }, [user])

  const savingsRef = useRef<SavingsData | null>(null)
  useEffect(() => { savingsRef.current = savings }, [savings])

  const persistSavings = useCallback(async (updated: SavingsData) => {
    if (!user) return
    const previous = savingsRef.current
    setSavings(updated)
    setSaving(true)
    try {
      await saveSavings(user.uid, updated)
      setError('')
    } catch (e) {
      console.error(e)
      if (previous) setSavings(previous)
      setError("Couldn't save your changes - they've been rolled back. Check your connection.")
    } finally {
      setSaving(false)
    }
  }, [user])

  const updateMonth = (patch: Partial<MonthBudget>) => {
    if (!month) return
    persist({ ...month, ...patch })
  }

  /* ── Variable expenses ── */
  const submitExpense = (data: Omit<VariableExpense, 'id'>) => {
    if (!month) return
    const editing = expenseModal.edit
    if (editing) {
      const next = { ...editing, ...data }
      persist({
        ...month,
        ...applySpendDelta(month, editing, next),
        variableExpenses: month.variableExpenses.map(e => (e.id === editing.id ? next : e)),
      })
    } else {
      const created = { ...data, id: newId() }
      persist({
        ...month,
        ...applySpendDelta(month, null, created),
        variableExpenses: [...month.variableExpenses, created],
      })
    }
  }

  const deleteExpense = async (id: string) => {
    if (!month) return
    const target = month.variableExpenses.find(e => e.id === id)
    if (!target) return
    const ok = await confirm({
      title: 'Delete this expense?',
      message: `"${target.name}" will be removed and its amount returned to ${target.place ?? 'bank'}.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    persist({
      ...month,
      ...applySpendDelta(month, target, null),
      variableExpenses: month.variableExpenses.filter(e => e.id !== id),
    })
  }

  /* ── Fixed charges ── */
  const submitFixed = (data: Omit<FixedExpense, 'id'>) => {
    if (!month) return
    const editing = fixedModal.edit
    if (editing) {
      const next = { ...editing, ...data }
      persist({
        ...month,
        ...applySpendDelta(month, editing, next),
        fixedExpenses: month.fixedExpenses.map(e => (e.id === editing.id ? next : e)),
      })
    } else {
      const created = { ...data, id: newId() }
      persist({
        ...month,
        ...applySpendDelta(month, null, created),
        fixedExpenses: [...month.fixedExpenses, created],
      })
    }
  }

  const deleteFixed = async (id: string) => {
    if (!month) return
    const target = month.fixedExpenses.find(e => e.id === id)
    if (!target) return
    const ok = await confirm({
      title: 'Delete this charge?',
      message: `"${target.name}" will be removed and its amount returned to ${target.place ?? 'bank'}.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    persist({
      ...month,
      ...applySpendDelta(month, target, null),
      fixedExpenses: month.fixedExpenses.filter(e => e.id !== id),
    })
  }

  /* ── Saving goals ── */
  const submitGoal = (data: Omit<SavingGoal, 'id'>) => {
    if (!month || !savings) return
    const editing = goalModal.edit
    if (editing) {
      persistSavings({ goals: savings.goals.map(g => (g.id === editing.id ? { ...editing, ...data } : g)) })
    } else {
      if (data.current > 0) persist({ ...month, ...fundGoal(month, SOURCE_TO_PLACE[data.source], data.current) })
      persistSavings({ goals: [...savings.goals, { ...data, id: newId() }] })
    }
  }

  // Deleting a funded goal returns the money to its place instead of
  // vaporising it (B2).
  const deleteGoal = async (goal: SavingGoal) => {
    if (!month || !savings) return
    const ok = await confirm({
      title: `Delete "${goal.name}"?`,
      message:
        goal.current > 0
          ? `The ${goal.current.toLocaleString()} currently saved will be returned to ${SOURCE_TO_PLACE[goal.source]}.`
          : 'This goal has no money in it.',
      confirmLabel: 'Delete goal',
      destructive: true,
    })
    if (!ok) return
    if (goal.current > 0) persist({ ...month, ...releaseGoalFunds(month, goal) })
    persistSavings({ goals: savings.goals.filter(g => g.id !== goal.id) })
  }

  const toggleGoal = (id: string) => {
    if (!savings) return
    persistSavings({ goals: savings.goals.map(g => (g.id === id ? { ...g, active: !g.active } : g)) })
  }

  const goalDeposit = (goal: SavingGoal, amount: number, place: MoneyPlace) => {
    if (!month || !savings) return
    persist({ ...month, ...fundGoal(month, place, amount) })
    persistSavings({
      goals: savings.goals.map(g => (g.id === goal.id ? { ...g, current: g.current + amount, active: true } : g)),
    })
  }

  // Withdrawing returns money to a place and lowers the goal (B3).
  const goalWithdraw = (goal: SavingGoal, amount: number, place: MoneyPlace) => {
    if (!month || !savings) return
    const r = withdrawFromGoal(month, goal, place, amount)
    if (!r.moved) return
    persist({ ...month, ...r.monthPatch })
    persistSavings({ goals: savings.goals.map(g => (g.id === goal.id ? r.goal : g)) })
  }

  const moveMoney = (from: MoneyPlace, to: MoneyPlace, amount: number) => {
    if (!month) return
    const patch = transferBetweenPlaces(month, from, to, amount)
    if (Object.keys(patch).length) persist({ ...month, ...patch })
  }

  /* ── Account actions ── */
  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  async function handleExport() {
    if (!user || !savings) return
    try {
      const months = await listMonths(user.uid)
      const data = months.length ? months : month ? [month] : []
      downloadCsv(`flousy-export-${new Date().toISOString().slice(0, 10)}.csv`, buildFullExport(data, savings, currencyCode))
    } catch (e) {
      console.error(e)
      setError("Couldn't build your export. Check your connection and try again.")
    }
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount()
      router.replace('/login')
    } catch (e) {
      console.error(e)
      setError(
        (e as { code?: string })?.code === 'auth/requires-recent-login'
          ? 'For security, please sign out and back in, then delete your account again.'
          : "Couldn't delete your account. Please try again.",
      )
      setShowSettings(false)
    }
  }

  async function handleCurrencyChange(code: string) {
    try {
      await setCurrency(code)
    } catch (e) {
      console.error(e)
      setError("Couldn't change your currency. Check your connection.")
    }
  }

  /* ── Render guards ── */
  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="glass" style={{ maxWidth: 380, padding: 24, textAlign: 'center' }}>
          <p className="f-display" style={{ fontWeight: 700, fontSize: 17, color: 'var(--t1)', marginBottom: 8 }}>
            Firebase isn&rsquo;t configured
          </p>
          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>
            Add your Firebase project credentials to{' '}
            <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>.env.local</code> and restart the app.
          </p>
        </div>
      </div>
    )
  }

  if (authLoading || !month || !savings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>Loading your budget</p>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; Icon: Icon }[] = [
    { id: 'overview', label: 'Overview', Icon: House },
    { id: 'variable', label: 'Expenses', Icon: ChartBar },
    { id: 'fixed', label: 'Fixed', Icon: Receipt },
    { id: 'savings', label: 'Savings', Icon: PiggyBank },
  ]
  const mobileTabs: { id: Tab; label: string; Icon: LucideIcon }[] = [
    { id: 'overview', label: 'Overview', Icon: LucideHome },
    { id: 'variable', label: 'Expenses', Icon: LucideWallet },
    { id: 'fixed', label: 'Fixed', Icon: LucideReceipt },
    { id: 'savings', label: 'Savings', Icon: LucidePiggyBank },
  ]

  return (
    <div className="min-h-screen md:flex" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen"
        style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 22px 18px' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={17} weight="bold" color="var(--accent-ink)" />
          </div>
          <span className="f-display" style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)' }}>Flousy</span>
        </div>
        <nav aria-label="Sections" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id} onClick={() => setTab(t.id)} className="tap" aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12,
                  color: active ? 'var(--t1)' : 'var(--t2)',
                  background: active ? 'var(--accent-tint)' : 'transparent',
                  fontWeight: 700, fontSize: 13, textAlign: 'left',
                }}
              >
                <t.Icon size={17} weight={active ? 'fill' : 'regular'} />{t.label}
              </button>
            )
          })}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            onClick={() => setShowSettings(true)} className="tap"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, color: 'var(--t2)', fontWeight: 700, fontSize: 13, textAlign: 'left' }}
          >
            <Gear size={17} />Settings
          </button>
          <button
            onClick={handleSignOut} className="tap"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, color: 'var(--t2)', fontWeight: 700, fontSize: 13, textAlign: 'left' }}
          >
            <SignOut size={17} />Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 max-w-md md:max-w-none mx-auto md:mx-0" style={{ background: 'var(--bg)' }}>
        {/* Top bar */}
        <div
          className="safe-top sticky top-0 z-40 md:static"
          style={{ background: 'var(--chrome)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }} className="md:px-8 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="tap" onClick={() => setMonthId(prevMonth(monthId))} aria-label="Previous month"
                style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CaretLeft size={15} color="var(--t2)" />
              </button>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Budget</p>
                <h1 className="f-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>{month.label}</h1>
              </div>
              <button
                className="tap" onClick={() => setMonthId(nextMonth(monthId))} aria-label="Next month"
                style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CaretRight size={15} color="var(--t2)" />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {saving && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} aria-label="Saving" role="status" />}
              <button
                onClick={() => setShowSettings(true)} className="tap md:hidden" aria-label="Settings"
                style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Gear size={16} color="var(--t2)" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-28 md:px-8 md:pt-6 md:pb-10">
          <div className="md:max-w-5xl md:mx-auto">
            {error && <div className="banner banner-error fade-in" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
            {tab === 'overview' && <OverviewTab month={month} savings={savings} onMoveMoney={() => setShowMoveMoney(true)} />}
            {tab === 'variable' && (
              <VariableTab
                month={month}
                onAdd={() => setExpenseModal({ open: true, edit: null })}
                onEdit={e => setExpenseModal({ open: true, edit: e })}
                onDelete={deleteExpense}
              />
            )}
            {tab === 'fixed' && (
              <FixedTab
                month={month}
                onAdd={() => setFixedModal({ open: true, edit: null })}
                onEdit={e => setFixedModal({ open: true, edit: e })}
                onDelete={deleteFixed}
              />
            )}
            {tab === 'savings' && (
              <SavingsTab
                month={month} savings={savings}
                onAdd={() => setGoalModal({ open: true, edit: null })}
                onEdit={g => setGoalModal({ open: true, edit: g })}
                onDelete={deleteGoal}
                onToggle={toggleGoal}
                onDeposit={g => setGoalTransfer({ goal: g, mode: 'deposit' })}
                onWithdraw={g => setGoalTransfer({ goal: g, mode: 'withdraw' })}
              />
            )}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav
          aria-label="Sections"
          className="safe-bottom fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md z-40 md:hidden"
          style={{ background: 'var(--chrome-strong)', backdropFilter: 'blur(24px)', borderTop: '1px solid var(--border)' }}
        >
          <div style={{ display: 'flex', padding: '2px 12px' }}>
            {mobileTabs.map(t => {
              const active = tab === t.id
              return (
                <button
                  key={t.id} onClick={() => setTab(t.id)} className="tap" aria-label={t.label}
                  aria-current={active ? 'page' : undefined}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', background: 'transparent', border: 'none' }}
                >
                  <t.Icon
                    size={26} strokeWidth={active ? 2.25 : 1.6}
                    color={active ? 'var(--t1)' : 'var(--t3)'}
                    fill={active ? 'var(--t1)' : 'none'} fillOpacity={active ? 0.12 : 0}
                  />
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Modals */}
      {expenseModal.open && (
        <ExpenseModal
          month={month} initial={expenseModal.edit}
          onClose={() => setExpenseModal({ open: false, edit: null })}
          onSubmit={submitExpense}
        />
      )}
      {fixedModal.open && (
        <FixedModal
          month={month} initial={fixedModal.edit}
          onClose={() => setFixedModal({ open: false, edit: null })}
          onSubmit={submitFixed}
        />
      )}
      {goalModal.open && (
        <SavingGoalModal
          month={month} initial={goalModal.edit}
          onClose={() => setGoalModal({ open: false, edit: null })}
          onSubmit={submitGoal}
        />
      )}
      {goalTransfer && (
        <GoalTransferModal
          month={month} goal={goalTransfer.goal} mode={goalTransfer.mode}
          onClose={() => setGoalTransfer(null)}
          onSubmit={(amount, place) =>
            goalTransfer.mode === 'deposit'
              ? goalDeposit(goalTransfer.goal, amount, place)
              : goalWithdraw(goalTransfer.goal, amount, place)
          }
        />
      )}
      {showMoveMoney && <MoveMoneyModal month={month} onClose={() => setShowMoveMoney(false)} onMove={moveMoney} />}
      {showSettings && (
        <SettingsModal
          month={month} user={user} currency={currencyCode}
          onClose={() => setShowSettings(false)}
          onSave={updateMonth}
          onSignOut={handleSignOut}
          onManageCategories={() => { setShowSettings(false); setShowCategories(true) }}
          onChangeCurrency={handleCurrencyChange}
          onExport={handleExport}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
      {showCategories && (
        <ManageCategoriesModal month={month} onClose={() => setShowCategories(false)} onSave={updateMonth} />
      )}
    </div>
  )
}
