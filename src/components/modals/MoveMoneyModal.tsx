'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FL, FieldError, MONEY_PLACE_ICON } from '@/components/ui/primitives'
import { MonthBudget, MoneyPlace, MONEY_PLACES, MONEY_PLACE_LABEL, moneyPlaceAmount } from '@/lib/store'
import { validate, amountSchema } from '@/lib/validation'
import { useCurrency } from '@/lib/currency-context'
import { ArrowsDownUp } from '@phosphor-icons/react/dist/ssr'

// Income lands entirely in the bank, so this is how cash gets to Home or
// Wallet. Always conserves the total - what leaves one place arrives in the
// other, never created or destroyed.
export function MoveMoneyModal({
  month, onClose, onMove,
}: {
  month: MonthBudget
  onClose: () => void
  onMove: (from: MoneyPlace, to: MoneyPlace, amount: number) => void
}) {
  const { fmt, symbol } = useCurrency()
  const [from, setFrom] = useState<MoneyPlace>('bank')
  const [to, setTo] = useState<MoneyPlace>('wallet')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const available = moneyPlaceAmount(month, from)

  function pickFrom(p: MoneyPlace) {
    setFrom(p)
    if (p === to) setTo(MONEY_PLACES.find(x => x !== p)!)
    setError('')
  }
  function pickTo(p: MoneyPlace) {
    setTo(p)
    if (p === from) setFrom(MONEY_PLACES.find(x => x !== p)!)
    setError('')
  }

  function submit() {
    const r = validate(amountSchema('Amount'), amount)
    if (!r.ok) return setError(Object.values(r.errors)[0] ?? 'Enter a valid amount.')
    if (r.data > available) return setError(`Only ${fmt(available)} available in ${MONEY_PLACE_LABEL[from]}.`)
    onMove(from, to, r.data)
    onClose()
  }

  const placeRow = (selected: MoneyPlace, onPick: (p: MoneyPlace) => void, dimmed: MoneyPlace) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
      {MONEY_PLACES.map(p => {
        const Ico = MONEY_PLACE_ICON[p]
        const on = selected === p
        const off = dimmed === p
        return (
          <button
            key={p} onClick={() => onPick(p)} aria-pressed={on} className="tap py-2.5 rounded-xl"
            style={{
              fontSize: 11, fontWeight: 700, opacity: off ? 0.4 : 1,
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
  )

  return (
    <Modal title="Move money" onClose={onClose}>
      <div><FL label="From" />{placeRow(from, pickFrom, to)}</div>
      <div aria-hidden style={{ display: 'flex', justifyContent: 'center', color: 'var(--t3)' }}>
        <ArrowsDownUp size={16} weight="bold" />
      </div>
      <div><FL label="To" />{placeRow(to, pickTo, from)}</div>

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
            key={f} onClick={() => { setAmount(String(Math.round(available * f))); setError('') }} className="tap"
            style={{
              flex: 1, padding: '7px 0', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--t2)',
            }}
          >
            {f === 1 ? 'All' : `${f * 100}%`}
          </button>
        ))}
      </div>

      <button className="btn-primary tap" onClick={submit}>
        <ArrowsDownUp size={16} weight="bold" /> Move money
      </button>
    </Modal>
  )
}
