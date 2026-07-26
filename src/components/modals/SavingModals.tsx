'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FL, FieldError, MONEY_PLACE_ICON } from '@/components/ui/primitives'
import {
  MonthBudget, SavingGoal, MoneyPlace, MONEY_PLACES, MONEY_PLACE_LABEL,
  SAVING_SOURCES, SOURCE_TO_PLACE, SavingSource, moneyPlaceAmount,
} from '@/lib/store'
import { validate, savingGoalSchema, amountSchema } from '@/lib/validation'
import { useCurrency } from '@/lib/currency-context'
import { PlusCircle, Check, ArrowCircleUp, ArrowCircleDown } from '@phosphor-icons/react/dist/ssr'

/* ── Create / edit a saving goal ── */
export function SavingGoalModal({
  month, initial, onClose, onSubmit,
}: {
  month: MonthBudget
  initial?: SavingGoal | null
  onClose: () => void
  onSubmit: (g: Omit<SavingGoal, 'id'>) => void
}) {
  const { fmt, symbol } = useCurrency()
  const editing = !!initial
  const [name, setName] = useState(initial?.name ?? '')
  const [target, setTarget] = useState(initial ? String(initial.target) : '')
  const [current, setCurrent] = useState(editing ? '' : '')
  const [source, setSource] = useState<SavingSource>(initial?.source ?? 'BANK')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function submit() {
    // When editing we don't re-take the funded amount - moving money is done
    // through Add funds / Withdraw so the accounting stays explicit.
    const payload = { name, target, current: editing ? '0' : current, source }
    const r = validate(savingGoalSchema, payload)
    if (!r.ok) return setErrors(r.errors)

    if (!editing && r.data.current > moneyPlaceAmount(month, SOURCE_TO_PLACE[source])) {
      return setErrors({ current: `Only ${fmt(moneyPlaceAmount(month, SOURCE_TO_PLACE[source]))} available in ${MONEY_PLACE_LABEL[SOURCE_TO_PLACE[source]]}.` })
    }

    onSubmit({
      name: r.data.name,
      target: r.data.target,
      current: editing ? initial!.current : r.data.current,
      source: r.data.source as SavingSource,
      active: editing ? initial!.active : r.data.current > 0,
    })
    onClose()
  }

  return (
    <Modal title={editing ? 'Edit goal' : 'New saving goal'} onClose={onClose}>
      <div>
        <FL label="Goal name" />
        <input
          className="field" placeholder="e.g. Vacation, Emergency fund" value={name}
          onChange={e => setName(e.target.value)} autoFocus aria-invalid={!!errors.name}
        />
        <FieldError msg={errors.name} />
      </div>

      <div>
        <FL label={editing ? 'Linked money place' : 'Fund it from'} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {SAVING_SOURCES.map(s => {
            const place = SOURCE_TO_PLACE[s]
            const Ico = MONEY_PLACE_ICON[place]
            const on = source === s
            return (
              <button
                key={s} onClick={() => setSource(s)} aria-pressed={on} className="tap py-2.5 rounded-xl"
                style={{
                  fontSize: 11, fontWeight: 700,
                  background: on ? 'var(--accent-tint)' : 'var(--surface-2)',
                  border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  color: on ? 'var(--accent)' : 'var(--t2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Ico size={13} weight="bold" />
                  {MONEY_PLACE_LABEL[place]}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--t3)', marginTop: 2 }}>
                  {fmt(moneyPlaceAmount(month, place))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editing ? '1fr' : '1fr 1fr', gap: 12 }}>
        <div>
          <FL label={`Target (${symbol})`} />
          <input
            className="field" type="number" inputMode="decimal" placeholder="0" value={target}
            onChange={e => setTarget(e.target.value)} aria-invalid={!!errors.target}
          />
          <FieldError msg={errors.target} />
        </div>
        {!editing && (
          <div>
            <FL label="Fund now with" />
            <input
              className="field" type="number" inputMode="decimal" placeholder="0" value={current}
              onChange={e => setCurrent(e.target.value)} aria-invalid={!!errors.current}
            />
            <FieldError msg={errors.current} />
          </div>
        )}
      </div>

      {!editing && (
        <p style={{ fontSize: 11, color: 'var(--t3)' }}>
          Whatever you fund now moves out of the money place above and into this goal.
        </p>
      )}

      <button className="btn-primary tap" onClick={submit}>
        {editing ? <><Check size={16} weight="bold" /> Save changes</> : <><PlusCircle size={16} weight="bold" /> Create goal</>}
      </button>
    </Modal>
  )
}

/* ── Add funds to / withdraw from a goal ── */
export function GoalTransferModal({
  month, goal, mode, onClose, onSubmit,
}: {
  month: MonthBudget
  goal: SavingGoal
  mode: 'deposit' | 'withdraw'
  onClose: () => void
  onSubmit: (amount: number, place: MoneyPlace) => void
}) {
  const { fmt, symbol } = useCurrency()
  const depositing = mode === 'deposit'
  const [amount, setAmount] = useState('')
  const [place, setPlace] = useState<MoneyPlace>(SOURCE_TO_PLACE[goal.source])
  const [error, setError] = useState('')

  // Depositing is limited by what's in the money place; withdrawing by what
  // the goal actually holds.
  const ceiling = depositing ? moneyPlaceAmount(month, place) : goal.current

  function submit() {
    const r = validate(amountSchema('Amount'), amount)
    if (!r.ok) return setError(r.errors.Amount ?? Object.values(r.errors)[0] ?? 'Enter a valid amount.')
    if (r.data > ceiling) {
      return setError(
        depositing
          ? `Only ${fmt(ceiling)} available in ${MONEY_PLACE_LABEL[place]}.`
          : `This goal only holds ${fmt(ceiling)}.`,
      )
    }
    onSubmit(r.data, place)
    onClose()
  }

  return (
    <Modal title={`${depositing ? 'Add to' : 'Withdraw from'} "${goal.name}"`} onClose={onClose}>
      <div>
        <FL label={depositing ? 'Take money from' : 'Return money to'} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {MONEY_PLACES.map(p => {
            const Ico = MONEY_PLACE_ICON[p]
            const on = place === p
            return (
              <button
                key={p} onClick={() => { setPlace(p); setError('') }} aria-pressed={on}
                className="tap py-2.5 rounded-xl"
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
                  {fmt(moneyPlaceAmount(month, p))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <FL label={`Amount (${symbol})`} />
        <input
          className="field" type="number" inputMode="decimal" placeholder="0" value={amount}
          onChange={e => { setAmount(e.target.value); setError('') }} autoFocus aria-invalid={!!error}
        />
        <FieldError msg={error} />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {[0.25, 0.5, 1].map(f => (
          <button
            key={f} onClick={() => { setAmount(String(Math.round(ceiling * f))); setError('') }} className="tap"
            style={{
              flex: 1, padding: '7px 0', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--t2)',
            }}
          >
            {f === 1 ? 'Max' : `${f * 100}%`}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'var(--t3)' }}>
        {depositing
          ? `This goal holds ${fmt(goal.current)} of its ${fmt(goal.target)} target.`
          : `Withdrawing returns the money to ${MONEY_PLACE_LABEL[place]} and lowers the goal's balance.`}
      </p>

      <button className="btn-primary tap" onClick={submit}>
        {depositing
          ? <><ArrowCircleUp size={16} weight="bold" /> Add funds</>
          : <><ArrowCircleDown size={16} weight="bold" /> Withdraw</>}
      </button>
    </Modal>
  )
}
