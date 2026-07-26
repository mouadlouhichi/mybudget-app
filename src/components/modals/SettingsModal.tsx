'use client'

import { useState } from 'react'
import type { User } from 'firebase/auth'
import { Modal } from '@/components/ui/Modal'
import { FL, FieldError, Chip } from '@/components/ui/primitives'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import {
  MonthBudget, MANAGEMENT_STRATEGIES, strategyEnvelopes,
  displayVariableCats, displayFixedCats,
} from '@/lib/store'
import { CURRENCIES } from '@/lib/currency'
import { useCurrency } from '@/lib/currency-context'
import { validate, budgetSettingsSchema } from '@/lib/validation'
import {
  Check, CaretRight, CaretDown, SignOut, TrendUp, Sliders,
  DownloadSimple, Trash, ShieldCheck,
} from '@phosphor-icons/react/dist/ssr'

export function SettingsModal({
  month, user, currency, onClose, onSave, onSignOut, onManageCategories,
  onChangeCurrency, onExport, onDeleteAccount,
}: {
  month: MonthBudget
  user: User | null
  currency: string
  onClose: () => void
  onSave: (p: Partial<MonthBudget>) => void
  onSignOut: () => void
  onManageCategories: () => void
  onChangeCurrency: (code: string) => void
  onExport: () => void
  onDeleteAccount: () => void
}) {
  const { fmt } = useCurrency()
  const confirm = useConfirm()
  const varCats = displayVariableCats(month)
  const fixedCats = displayFixedCats(month)

  const [total, setTotal] = useState(String(month.totalBudget))
  const [bank, setBank] = useState(String(month.bankPart))
  const [home, setHome] = useState(String(month.homePart))
  const [wallet, setWallet] = useState(String(month.walletPart))
  const [strategyId, setStrategyId] = useState(month.strategyId ?? MANAGEMENT_STRATEGIES[0].id)
  const [varBases, setVarBases] = useState<Record<string, string>>(
    Object.fromEntries(varCats.map(t => [t, String(month.variableCategoryBases[t] ?? 0)])),
  )
  const [fixedBases, setFixedBases] = useState<Record<string, string>>(
    Object.fromEntries(fixedCats.map(t => [t, String(month.fixedCategoryBases[t] ?? 0)])),
  )
  const [showCats, setShowCats] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function save() {
    const r = validate(budgetSettingsSchema, {
      totalBudget: total, bankPart: bank, homePart: home, walletPart: wallet,
    })
    if (!r.ok) return setErrors(r.errors)

    const nextVarBases = { ...month.variableCategoryBases }
    for (const t of varCats) {
      const v = parseFloat(varBases[t])
      if (Number.isFinite(v) && v >= 0) nextVarBases[t] = v
    }
    const nextFixedBases = { ...month.fixedCategoryBases }
    for (const t of fixedCats) {
      const v = parseFloat(fixedBases[t])
      if (Number.isFinite(v) && v >= 0) nextFixedBases[t] = v
    }

    onSave({
      totalBudget: r.data.totalBudget,
      bankPart: r.data.bankPart,
      homePart: r.data.homePart,
      walletPart: r.data.walletPart,
      strategyId,
      monthlySavingsTarget: strategyEnvelopes(r.data.totalBudget, strategyId).savings,
      variableCategoryBases: nextVarBases,
      fixedCategoryBases: nextFixedBases,
    })
    onClose()
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete your account?',
      message:
        'This permanently erases your profile, every month of budget data and all saving goals. This cannot be undone. Consider exporting your data first.',
      confirmLabel: 'Delete everything',
      destructive: true,
    })
    if (ok) onDeleteAccount()
  }

  return (
    <Modal title="Settings" onClose={onClose}>
      {/* Account */}
      <div className="glass-2 p-4 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: 'var(--accent)' }}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} className="w-12 h-12 rounded-full object-cover" alt="" />
          ) : (
            <span className="f-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-ink)' }}>
              {(user?.displayName || 'U')[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--t1)' }}>{user?.displayName || 'User'}</p>
          <p style={{ fontSize: 12, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
        </div>
        <Chip label="FREE" color="var(--accent)" solid />
      </div>

      {/* Currency */}
      <div>
        <FL label="Currency" />
        <select
          className="field" value={currency} onChange={e => onChangeCurrency(e.target.value)}
          aria-label="Currency"
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <FL label="Total monthly budget" />
        <input
          className="field" type="number" inputMode="decimal" value={total}
          onChange={e => setTotal(e.target.value)} aria-invalid={!!errors.totalBudget}
        />
        <FieldError msg={errors.totalBudget} />
      </div>

      <div>
        <FL label="Money places" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <FL label="Bank" />
            <input className="field" type="number" inputMode="decimal" value={bank} onChange={e => setBank(e.target.value)} />
            <FieldError msg={errors.bankPart} />
          </div>
          <div>
            <FL label="Home" />
            <input className="field" type="number" inputMode="decimal" value={home} onChange={e => setHome(e.target.value)} />
            <FieldError msg={errors.homePart} />
          </div>
          <div>
            <FL label="Wallet" />
            <input className="field" type="number" inputMode="decimal" value={wallet} onChange={e => setWallet(e.target.value)} />
            <FieldError msg={errors.walletPart} />
          </div>
        </div>
      </div>

      {/* Strategy */}
      <div>
        <FL label="Budgeting strategy" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MANAGEMENT_STRATEGIES.map(s => {
            const on = s.id === strategyId
            const env = strategyEnvelopes(parseFloat(total) || month.totalBudget, s.id)
            return (
              <button
                key={s.id} onClick={() => setStrategyId(s.id)} aria-pressed={on} className="tap w-full"
                style={{
                  padding: '10px 12px', borderRadius: 'var(--r-field)', textAlign: 'left',
                  background: on ? 'var(--accent-tint)' : 'var(--surface-2)',
                  border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{s.name}</span>
                  {on && <Check size={14} weight="bold" color="var(--accent)" />}
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>
                  Needs {fmt(env.needs)} · Wants {fmt(env.wants)} · Savings {fmt(env.savings)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        className="tap flex items-center justify-between w-full glass-2"
        style={{ padding: '12px 14px' }} onClick={onManageCategories}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
          <Sliders size={15} />Manage categories
        </span>
        <CaretRight size={14} color="var(--t3)" />
      </button>

      <button
        className="tap flex items-center justify-between w-full glass-2"
        style={{ padding: '12px 14px' }} onClick={() => setShowCats(s => !s)}
        aria-expanded={showCats}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Category budgets</span>
        {showCats ? <CaretDown size={14} color="var(--t3)" /> : <CaretRight size={14} color="var(--t3)" />}
      </button>

      {showCats && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <FL label="Variable categories" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {varCats.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--t2)' }}>{t}</span>
                  <input
                    className="field" type="number" inputMode="decimal" style={{ width: 100, padding: '8px 10px' }}
                    value={varBases[t] ?? '0'} onChange={e => setVarBases(b => ({ ...b, [t]: e.target.value }))}
                    aria-label={`${t} budget`}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <FL label="Fixed categories" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fixedCats.map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--t2)' }}>{t}</span>
                  <input
                    className="field" type="number" inputMode="decimal" style={{ width: 100, padding: '8px 10px' }}
                    value={fixedBases[t] ?? '0'} onChange={e => setFixedBases(b => ({ ...b, [t]: e.target.value }))}
                    aria-label={`${t} budget`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button className="btn-primary tap" onClick={save}>
        <Check size={16} weight="bold" /> Save settings
      </button>

      {/* Data */}
      <button
        className="tap flex items-center justify-between w-full glass-2"
        style={{ padding: '12px 14px' }} onClick={onExport}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
          <DownloadSimple size={15} />Export my data (CSV)
        </span>
        <CaretRight size={14} color="var(--t3)" />
      </button>

      <a
        href="/privacy" className="tap flex items-center justify-between w-full glass-2"
        style={{ padding: '12px 14px', textDecoration: 'none' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
          <ShieldCheck size={15} />Privacy & terms
        </span>
        <CaretRight size={14} color="var(--t3)" />
      </a>

      <div className="glass-2 p-4 flex items-center gap-3" style={{ border: '1px solid var(--border-2)' }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent-tint)' }}
        >
          <TrendUp size={17} weight="bold" color="var(--accent)" />
        </div>
        <div className="flex-1">
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>Upgrade to Pro</p>
          <p style={{ fontSize: 11, color: 'var(--t2)' }}>Insights and multi-account — coming soon</p>
        </div>
        <button
          disabled className="tap" title="Pro plan launching soon"
          style={{
            background: 'var(--accent)', color: 'var(--accent-ink)', padding: '7px 14px', borderRadius: 999,
            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', border: 'none', opacity: 0.55, cursor: 'not-allowed',
          }}
        >
          Soon
        </button>
      </div>

      <button onClick={onSignOut} className="btn-ghost tap w-full">
        <SignOut size={15} weight="bold" /> Sign out
      </button>

      <button
        onClick={handleDelete} className="tap w-full"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 20px', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 700,
          background: 'transparent', border: '1px solid var(--bad)', color: 'var(--bad)', cursor: 'pointer',
        }}
      >
        <Trash size={15} weight="bold" /> Delete account
      </button>
    </Modal>
  )
}
