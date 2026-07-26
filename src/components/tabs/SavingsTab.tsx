'use client'

import { MonthBudget, SavingsData, SavingGoal } from '@/lib/store'
import { pct, PBar, Chip } from '@/components/ui/primitives'
import { useCurrency } from '@/lib/currency-context'
import {
  PlusCircle, Trash, Check, Target, PiggyBank,
  ArrowCircleUp, ArrowCircleDown, PencilSimple,
} from '@phosphor-icons/react/dist/ssr'

export function SavingsTab({
  savings, onAdd, onEdit, onDelete, onToggle, onDeposit, onWithdraw,
}: {
  month: MonthBudget
  savings: SavingsData
  onAdd: () => void
  onEdit: (g: SavingGoal) => void
  onDelete: (g: SavingGoal) => void
  onToggle: (id: string) => void
  onDeposit: (g: SavingGoal) => void
  onWithdraw: (g: SavingGoal) => void
}) {
  const { fmt, symbol } = useCurrency()
  const active = savings.goals.filter(g => g.active)
  const inactive = savings.goals.filter(g => !g.active)
  const totalSaved = active.reduce((s, g) => s + g.current, 0)
  const totalTarget = savings.goals.reduce((s, g) => s + g.target, 0)

  return (
    <div className="space-y-4 slide-up">
      <div className="glass" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Saving goals
          </p>
          <p className="f-display num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--good)', marginTop: 2 }}>
            {fmt(totalSaved)}
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--t3)', marginLeft: 4 }}>/ {fmt(totalTarget)} {symbol}</span>
          </p>
          <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>
            {active.length} active · {inactive.length} pending
          </p>
        </div>
        <button className="btn-primary tap" style={{ width: 'auto', padding: '10px 18px', fontSize: 13 }} onClick={onAdd}>
          <PlusCircle size={15} weight="bold" />Add
        </button>
      </div>

      {active.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 4px', marginBottom: 10 }}>
            Active
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {active.map(goal => {
              const p = pct(goal.current, goal.target)
              return (
                <div key={goal.id} className="glass" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <button
                      onClick={() => onToggle(goal.id)} className="tap"
                      aria-label={`Mark "${goal.name}" as pending`}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: 'var(--good)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, border: 'none',
                      }}
                    >
                      <Check size={13} color="var(--color-text-inverse)" weight="bold" />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{goal.name}</p>
                        <Chip label={goal.source} color="var(--good)" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span className="f-display num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--good)' }}>
                          {fmt(goal.current)}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--t3)' }}>/ {fmt(goal.target)} {symbol}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--good)' }}>{p}%</span>
                      </div>
                      <PBar value={p} color="var(--good)" h={6} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                      <button className="tap" onClick={() => onDeposit(goal)} style={{ color: 'var(--good)', padding: 4 }} aria-label={`Add funds to ${goal.name}`} title="Add funds">
                        <ArrowCircleUp size={16} weight="bold" />
                      </button>
                      <button
                        className="tap" onClick={() => onWithdraw(goal)} disabled={goal.current <= 0}
                        style={{ color: goal.current > 0 ? 'var(--accent-dim)' : 'var(--t3)', padding: 4, opacity: goal.current > 0 ? 1 : 0.4 }}
                        aria-label={`Withdraw from ${goal.name}`} title="Withdraw"
                      >
                        <ArrowCircleDown size={16} weight="bold" />
                      </button>
                      <button className="tap" onClick={() => onEdit(goal)} style={{ color: 'var(--t3)', padding: 4 }} aria-label={`Edit ${goal.name}`} title="Edit">
                        <PencilSimple size={14} />
                      </button>
                      <button className="tap" onClick={() => onDelete(goal)} style={{ color: 'var(--t3)', padding: 4 }} aria-label={`Delete ${goal.name}`} title="Delete">
                        <Trash size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 4px', marginBottom: 10 }}>
            Pending
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inactive.map(goal => (
              <div key={goal.id} className="glass" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.7 }}>
                <button
                  onClick={() => onToggle(goal.id)} className="tap" aria-label={`Activate "${goal.name}"`}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-2)', background: 'var(--surface-2)',
                  }}
                >
                  <Target size={12} color="var(--t3)" />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{goal.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--t3)' }}>
                    {goal.source} · {fmt(goal.target)} {symbol} target
                    {goal.current > 0 && ` · ${fmt(goal.current)} saved`}
                  </p>
                </div>
                <button className="tap" onClick={() => onEdit(goal)} style={{ color: 'var(--t3)', padding: 4 }} aria-label={`Edit ${goal.name}`}>
                  <PencilSimple size={14} />
                </button>
                <button className="tap" onClick={() => onDelete(goal)} style={{ color: 'var(--t3)', padding: 4 }} aria-label={`Delete ${goal.name}`}>
                  <Trash size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {savings.goals.length === 0 && (
        <div className="glass" style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>
          <PiggyBank size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>No saving goals yet</p>
        </div>
      )}
    </div>
  )
}
