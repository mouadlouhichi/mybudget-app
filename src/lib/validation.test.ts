import { describe, it, expect } from 'vitest'
import {
  validate, amountSchema, nonNegativeAmountSchema, variableExpenseSchema,
  savingGoalSchema, MAX_AMOUNT,
} from './validation'

describe('amountSchema', () => {
  const s = amountSchema('Amount')

  it('accepts a normal positive number', () => {
    expect(validate(s, '250')).toEqual({ ok: true, data: 250 })
  })

  it('rejects empty, non-numeric and whitespace input', () => {
    for (const bad of ['', '   ', 'abc', '12abc']) {
      expect(validate(s, bad).ok).toBe(false)
    }
  })

  it('rejects zero and negatives', () => {
    expect(validate(s, '0').ok).toBe(false)
    expect(validate(s, '-50').ok).toBe(false)
  })

  it('rejects Infinity and NaN', () => {
    expect(validate(s, 'Infinity').ok).toBe(false)
    expect(validate(s, 'NaN').ok).toBe(false)
  })

  it('rejects absurdly large values', () => {
    expect(validate(s, String(MAX_AMOUNT + 1)).ok).toBe(false)
  })

  it('accepts decimals', () => {
    expect(validate(s, '12.75')).toEqual({ ok: true, data: 12.75 })
  })
})

describe('nonNegativeAmountSchema', () => {
  const s = nonNegativeAmountSchema('Budget')

  it('treats empty as zero', () => {
    expect(validate(s, '')).toEqual({ ok: true, data: 0 })
  })

  it('accepts zero but not negatives', () => {
    expect(validate(s, '0')).toEqual({ ok: true, data: 0 })
    expect(validate(s, '-1').ok).toBe(false)
  })
})

describe('variableExpenseSchema', () => {
  const good = { name: 'Coffee', amount: '35', type: 'Restaurant', date: '2026-07-26', place: 'wallet' }

  it('accepts a well-formed expense', () => {
    const r = validate(variableExpenseSchema, good)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.amount).toBe(35)
  })

  it('reports the offending field', () => {
    const r = validate(variableExpenseSchema, { ...good, name: '', amount: '-5' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.name).toBeTruthy()
      expect(r.errors.amount).toBeTruthy()
    }
  })

  it('rejects a malformed date', () => {
    expect(validate(variableExpenseSchema, { ...good, date: '26/07/2026' }).ok).toBe(false)
  })

  it('rejects an unknown money place', () => {
    expect(validate(variableExpenseSchema, { ...good, place: 'mattress' }).ok).toBe(false)
  })

  it('trims surrounding whitespace from names', () => {
    const r = validate(variableExpenseSchema, { ...good, name: '  Coffee  ' })
    if (r.ok) expect(r.data.name).toBe('Coffee')
  })
})

describe('savingGoalSchema', () => {
  it('allows a goal that starts unfunded', () => {
    const r = validate(savingGoalSchema, { name: 'Car', target: '50000', current: '', source: 'BANK' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.current).toBe(0)
  })

  it('requires a positive target', () => {
    expect(validate(savingGoalSchema, { name: 'Car', target: '0', current: '0', source: 'BANK' }).ok).toBe(false)
  })
})
