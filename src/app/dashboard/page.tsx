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

  // Saving goals are global - subscribed once per session.
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

  // Optimistic write with rollback (M6)
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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'fixed', label: 'Fixed' },
    { id: 'variable', label: 'Variable' },
    { id: 'savings', label: 'Savings' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Desktop Sidebar/Nav (Hidden on Mobile) */}
      <nav
        className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface border-r border-border z-50 pt-8 px-4"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        <div className="font-headline-lg text-headline-lg font-bold text-primary mb-12 px-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>account_balance_wallet</span>
          <span>Flousy</span>
        </div>
        <div className="flex flex-col gap-2">
          {tabs.map(t => {
            const active = tab === t.id
            const iconName = t.id === 'overview' ? 'dashboard' : t.id === 'variable' ? 'shopping_cart' : t.id === 'fixed' ? 'event_repeat' : 'savings'
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left tap ${
                  active
                    ? 'bg-accent text-on-primary font-bold shadow-md'
                    : 'text-t2 hover:bg-surface-2'
                }`}
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--accent-ink)' : 'var(--t2)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? '"FILL" 1' : '"FILL" 0' }}>
                  {iconName}
                </span>
                {t.label}
              </button>
            )
          })}
        </div>
        <div style={{ flex: 1 }} />
        <div className="flex flex-col gap-2 pb-6">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-t2 hover:bg-surface-2 transition-colors text-sm font-bold text-left tap"
          >
            <span className="material-symbols-outlined">settings</span>
            Settings
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-t2 hover:bg-surface-2 transition-colors text-sm font-bold text-left tap"
          >
            <span className="material-symbols-outlined">logout</span>
            Sign out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen md:pl-64" style={{ background: 'var(--bg)' }}>
        {/* Mobile Top App Bar */}
        <header
          className="safe-top sticky top-0 z-40 bg-surface flex justify-between items-center px-4 h-16 border-b border-border md:hidden"
          style={{ background: 'var(--chrome)', backdropFilter: 'blur(20px)' }}
        >
          <button
            onClick={() => setMonthId(prevMonth(monthId))}
            aria-label="Previous month"
            className="text-t2 hover:bg-surface-2 transition-opacity flex items-center justify-center p-2 rounded-full tap"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold text-t3 uppercase tracking-widest">Budget</p>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">{month.label}</h1>
          </div>
          <div className="flex items-center gap-1">
            {saving && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping mr-1" />}
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              className="text-t2 hover:bg-surface-2 transition-opacity flex items-center justify-center p-2 rounded-full tap"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Views */}
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

        {/* Mobile Glass Bottom Navigation Bar */}
        <nav
          aria-label="Sections"
          className="safe-bottom fixed bottom-6 left-4 right-4 z-50 flex justify-around items-center px-4 py-2 bg-surface/80 backdrop-blur-md shadow-lg border border-border-2 rounded-full md:hidden"
          style={{ background: 'var(--chrome-strong)', backdropFilter: 'blur(24px)' }}
        >
          {tabs.map(t => {
            const active = tab === t.id
            const iconName = t.id === 'overview' ? 'dashboard' : t.id === 'variable' ? 'shopping_cart' : t.id === 'fixed' ? 'event_repeat' : 'savings'
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-label={t.label}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all tap ${
                  active ? 'bg-primary/10 text-primary font-bold w-16' : 'text-t3 hover:bg-surface-2/40 w-16'
                }`}
                style={{
                  color: active ? 'var(--accent)' : 'var(--t3)',
                  background: active ? 'var(--accent-tint)' : 'transparent',
                }}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: active ? '"FILL" 1, "wght" 600' : '"FILL" 0, "wght" 400' }}
                >
                  {iconName}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Floating Action Button (FAB) */}
        <button
          onClick={() => setExpenseModal({ open: true, edit: null })}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-opacity-90 transition-all z-40 tap hover:scale-105 active:scale-95 duration-200"
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: '16px' }}
          aria-label="Add transaction"
        >
          <span className="material-symbols-outlined text-[28px] font-bold">add</span>
        </button>
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
