'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FL, FieldError, today, catIcon, MONEY_PLACE_ICON } from '@/components/ui/primitives'
import {
  MonthBudget, VariableExpense, MoneyPlace, MONEY_PLACES, MONEY_PLACE_LABEL,
  displayVariableCats, categoryColor, moneyPlaceAmount,
} from '@/lib/store'
import { validate, variableExpenseSchema } from '@/lib/validation'
import { useCurrency } from '@/lib/currency-context'
import { PlusCircle, Check } from '@phosphor-icons/react/dist/ssr'

// One component for both create and edit (B1). `initial` decides the mode.
export function ExpenseModal({
  month, initial, onClose, onSubmit,
}: {
  month: MonthBudget
  initial?: VariableExpense | null
  onClose: () => void
  onSubmit: (e: Omit<VariableExpense, 'id'>) => void
}) {
  const cats = displayVariableCats(month)
  const { fmt, symbol } = useCurrency()
  const editing = !!initial

  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [type, setType] = useState<string>(initial?.type ?? cats[0] ?? 'Autre')
  const [date, setDate] = useState(initial?.date ?? today())
  const [place, setPlace] = useState<MoneyPlace>(initial?.place ?? 'bank')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function submit() {
    const r = validate(variableExpenseSchema, { name, amount, type, date, place })
    if (!r.ok) return setErrors(r.errors)
    onSubmit({ ...r.data, place: r.data.place as MoneyPlace })
    onClose()
  }

  // When editing, the original amount is already deducted from its place, so
  // it's still "available" to this expense - show that rather than a
  // misleading lower figure.
  const availableIn = (p: MoneyPlace) =>
    moneyPlaceAmount(month, p) + (editing && initial?.place === p ? initial.amount : 0)

  return (
    <Modal title={editing ? 'Edit expense' : 'New expense'} onClose={onClose}>
      {/* Centered Amount Input */}
      <div className="flex flex-col items-center justify-center py-3 border-b border-border mb-4">
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
          Amount ({symbol})
        </p>
        <div className="flex items-center text-primary font-bold">
          <span className="text-3xl mr-1 text-accent">{symbol}</span>
          <input
            className="bg-transparent border-none text-[44px] leading-tight text-center w-full max-w-[220px] text-t1 focus:ring-0 p-0 placeholder-text-muted focus:outline-none font-bold"
            placeholder="0.00"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={e => { setAmount(e.target.value); if (errors.amount) setErrors(prev => ({ ...prev, amount: '' })) }}
            aria-invalid={!!errors.amount}
            autoFocus
          />
        </div>
        <FieldError msg={errors.amount} />
      </div>

      <div>
        <FL label="Category" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {cats.map(t => {
            const Ico = catIcon(month, t)
            const c = categoryColor(month, t)
            const on = type === t
            return (
              <button
                key={t} type="button" onClick={() => setType(t)} aria-pressed={on}
                className="tap flex flex-col items-center gap-1.5 py-2.5 rounded-xl"
                style={{ background: on ? c + '22' : 'var(--surface-2)', border: `1.5px solid ${on ? c : 'var(--border)'}` }}
              >
                <Ico size={18} weight="bold" color={on ? c : 'var(--t3)'} />
                <span style={{ fontSize: 8, fontWeight: 700, color: on ? c : 'var(--t3)', textAlign: 'center', lineHeight: 1.2 }}>
                  {t}
                </span>
              </button>
            )
          })}
        </div>
        <FieldError msg={errors.type} />
      </div>

      <div>
        <FL label="Description" />
        <input
          className="field" placeholder="What did you spend on" value={name}
          onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: '' })) }}
          aria-invalid={!!errors.name}
        />
        <FieldError msg={errors.name} />
      </div>

      <div>
        <FL label="Date" />
        <input className="field" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <FieldError msg={errors.date} />
      </div>

      <div>
        <FL label="Paid from" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {MONEY_PLACES.map(p => {
            const Ico = MONEY_PLACE_ICON[p]
            const on = place === p
            return (
              <button
                key={p} onClick={() => setPlace(p)} aria-pressed={on} className="tap py-2.5 rounded-xl"
                style={{
                  fontSize: 11, fontWeight: 700,
                  background: on ? 'var(--accent-tint)' : 'var(--surface-2)',
                  border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  color: on ? 'var(--accent)' : 'var(--t2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Ico size={13} weight="bold" />
                  {MONEY_PLACE_LABEL[p]}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--t3)', marginTop: 2 }}>
                  {fmt(availableIn(p))}
                </div>
              </button>
            )
          })}
        </div>
        <FieldError msg={errors.place} />
      </div>

      <button className="btn-primary tap" onClick={submit}>
        {editing ? <><Check size={16} weight="bold" /> Save changes</> : <><PlusCircle size={16} weight="bold" /> Add expense</>}
      </button>
    </Modal>
  )
}
