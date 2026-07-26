import { describe, it, expect } from 'vitest'
import {
  buildMonthFromOnboarding, strategyEnvelopes, bucketOf, transferBetweenPlaces,
  applySpendDelta, fundGoal, withdrawFromGoal, releaseGoalFunds,
  normalizeMonth, rolloverMonth, emptyMonth, moneyPlaceAmount,
  SUGGESTED_VARIABLE_CATEGORIES, SUGGESTED_FIXED_CATEGORIES, MANAGEMENT_STRATEGIES,
  type MonthBudget, type SavingGoal,
} from './store'

const INCOMES = [8500, 12345, 7, 1, 1_000_001]

function baseMonth(over: Partial<MonthBudget> = {}): MonthBudget {
  return { ...emptyMonth('2026-07'), totalBudget: 8500, bankPart: 8500, ...over }
}

describe('strategy shares', () => {
  it('every strategy splits income into exactly three parts summing to 1', () => {
    for (const s of MANAGEMENT_STRATEGIES) {
      expect(s.needsShare + s.wantsShare + s.savingsShare).toBeCloseTo(1, 10)
    }
  })

  it('envelopes always conserve income, with no rounding leak', () => {
    for (const s of MANAGEMENT_STRATEGIES) {
      for (const income of INCOMES) {
        const e = strategyEnvelopes(income, s.id)
        expect(e.needs + e.wants + e.savings).toBe(income)
      }
    }
  })

  it('falls back to the default strategy for an unknown id', () => {
    expect(strategyEnvelopes(1000, 'nope')).toEqual(strategyEnvelopes(1000, MANAGEMENT_STRATEGIES[0].id))
  })
})

describe('bucketOf', () => {
  it('resolves "Autre" differently per kind (it exists in both lists)', () => {
    expect(bucketOf('Autre', 'variable')).toBe('wants')
    expect(bucketOf('Autre', 'fixed')).toBe('needs')
  })

  it('treats unknown custom categories conservatively', () => {
    expect(bucketOf('Whatever', 'variable')).toBe('wants')  // can't inflate essentials
    expect(bucketOf('Whatever', 'fixed')).toBe('needs')     // a recurring bill is a commitment
  })
})

describe('buildMonthFromOnboarding', () => {
  const vc = SUGGESTED_VARIABLE_CATEGORIES.filter(c => c.recommended).map(c => c.type)
  const fc = SUGGESTED_FIXED_CATEGORIES.filter(c => c.recommended).map(c => c.type)

  it('fills each envelope to the exact dirham across strategies and incomes', () => {
    for (const s of MANAGEMENT_STRATEGIES) {
      for (const income of INCOMES) {
        const m = buildMonthFromOnboarding('2026-07', {
          income, variableCategories: vc, fixedCategories: fc, strategyId: s.id,
        })
        const env = strategyEnvelopes(income, s.id)
        let needs = 0, wants = 0
        for (const [t, v] of Object.entries(m.variableCategoryBases)) {
          bucketOf(t, 'variable') === 'needs' ? (needs += v) : (wants += v)
        }
        for (const [t, v] of Object.entries(m.fixedCategoryBases)) {
          bucketOf(t, 'fixed') === 'needs' ? (needs += v) : (wants += v)
        }
        expect(needs).toBe(env.needs)
        expect(wants).toBe(env.wants)
      }
    }
  })

  it('puts all income in the bank - strategy never decides money placement', () => {
    for (const s of MANAGEMENT_STRATEGIES) {
      const m = buildMonthFromOnboarding('2026-07', {
        income: 8500, variableCategories: vc, fixedCategories: fc, strategyId: s.id,
      })
      expect(m.bankPart).toBe(8500)
      expect(m.homePart).toBe(0)
      expect(m.walletPart).toBe(0)
    }
  })

  it('gives fewer categories bigger slices rather than underspending', () => {
    const m = buildMonthFromOnboarding('2026-07', {
      income: 8500, variableCategories: ['Alimentation'], fixedCategories: ['Location'], strategyId: '50-30-20',
    })
    const env = strategyEnvelopes(8500, '50-30-20')
    expect(m.variableCategoryBases['Alimentation'] + m.fixedCategoryBases['Location']).toBe(env.needs)
  })

  it('handles zero categories without producing NaN', () => {
    const m = buildMonthFromOnboarding('2026-07', {
      income: 8500, variableCategories: [], fixedCategories: [], strategyId: '50-30-20',
    })
    expect(Object.values(m.variableCategoryBases).every(v => v === 0)).toBe(true)
    expect(Object.values(m.variableCategoryBases).some(Number.isNaN)).toBe(false)
    expect(m.bankPart).toBe(8500)
  })

  it('records the savings target from the strategy', () => {
    const m = buildMonthFromOnboarding('2026-07', {
      income: 8500, variableCategories: vc, fixedCategories: fc, strategyId: 'pay-yourself-first',
    })
    expect(m.monthlySavingsTarget).toBe(strategyEnvelopes(8500, 'pay-yourself-first').savings)
  })
})

describe('transferBetweenPlaces', () => {
  it('conserves the total', () => {
    const m = baseMonth()
    const p = transferBetweenPlaces(m, 'bank', 'wallet', 2000)
    expect(p.bankPart).toBe(6500)
    expect(p.walletPart).toBe(2000)
  })

  it('clamps to available funds', () => {
    const p = transferBetweenPlaces(baseMonth(), 'bank', 'home', 99999)
    expect(p.bankPart).toBe(0)
    expect(p.homePart).toBe(8500)
  })

  it('is a no-op for same place, zero and negative amounts', () => {
    const m = baseMonth()
    expect(transferBetweenPlaces(m, 'bank', 'bank', 100)).toEqual({})
    expect(transferBetweenPlaces(m, 'bank', 'home', 0)).toEqual({})
    expect(transferBetweenPlaces(m, 'bank', 'home', -50)).toEqual({})
  })
})

describe('applySpendDelta (B4 - expenses move real money)', () => {
  it('debits the chosen place when an expense is added', () => {
    const p = applySpendDelta(baseMonth(), null, { amount: 300, place: 'bank' })
    expect(p.bankPart).toBe(8200)
  })

  it('refunds the place when an expense is deleted', () => {
    const m = baseMonth({ bankPart: 8200 })
    const p = applySpendDelta(m, { amount: 300, place: 'bank' }, null)
    expect(p.bankPart).toBe(8500)
  })

  it('applies only the difference when an amount is edited', () => {
    const m = baseMonth({ bankPart: 8200 })
    const p = applySpendDelta(m, { amount: 300, place: 'bank' }, { amount: 500, place: 'bank' })
    expect(p.bankPart).toBe(8000)
  })

  it('refunds the old place and debits the new one when the place changes', () => {
    const m = baseMonth({ bankPart: 8200, walletPart: 1000 })
    const p = applySpendDelta(m, { amount: 300, place: 'bank' }, { amount: 300, place: 'wallet' })
    expect(p.bankPart).toBe(8500)
    expect(p.walletPart).toBe(700)
  })

  it('round-trips exactly: add then delete restores the original balance', () => {
    const start = baseMonth()
    for (const place of ['bank', 'home', 'wallet'] as const) {
      const seeded = baseMonth({ bankPart: 3000, homePart: 3000, walletPart: 2500 })
      const afterAdd = { ...seeded, ...applySpendDelta(seeded, null, { amount: 450, place }) }
      const afterDel = { ...afterAdd, ...applySpendDelta(afterAdd, { amount: 450, place }, null) }
      expect(moneyPlaceAmount(afterDel, place)).toBe(moneyPlaceAmount(seeded, place))
    }
    expect(start.bankPart).toBe(8500)
  })

  it('never drives a place negative', () => {
    const m = baseMonth({ walletPart: 100 })
    const p = applySpendDelta(m, null, { amount: 500, place: 'wallet' })
    expect(p.walletPart).toBe(0)
  })

  it('defaults a missing place to bank (legacy rows)', () => {
    const p = applySpendDelta(baseMonth(), null, { amount: 200 })
    expect(p.bankPart).toBe(8300)
  })
})

describe('saving goal money movement (B2/B3)', () => {
  const goal: SavingGoal = { id: 'g1', name: 'Vacation', target: 5000, current: 1200, source: 'BANK', active: true }

  it('funding debits the source place', () => {
    const p = fundGoal(baseMonth(), 'bank', 1000)
    expect(p.bankPart).toBe(7500)
  })

  it('withdrawing returns money and reduces the goal', () => {
    const m = baseMonth({ bankPart: 7300 })
    const r = withdrawFromGoal(m, goal, 'bank', 500)
    expect(r.monthPatch.bankPart).toBe(7800)
    expect(r.goal.current).toBe(700)
    expect(r.moved).toBe(500)
  })

  it('cannot withdraw more than the goal holds', () => {
    const r = withdrawFromGoal(baseMonth(), goal, 'bank', 99999)
    expect(r.moved).toBe(1200)
    expect(r.goal.current).toBe(0)
  })

  it('deleting a funded goal returns its balance instead of vaporising it', () => {
    const m = baseMonth({ bankPart: 7300 })
    const p = releaseGoalFunds(m, goal)
    expect(p.bankPart).toBe(8500)   // 7300 + 1200 back
  })

  it('deleting an empty goal is a no-op', () => {
    expect(releaseGoalFunds(baseMonth(), { ...goal, current: 0 })).toEqual({})
  })

  it('fund then release round-trips to the original balance', () => {
    const m = baseMonth()
    const funded = { ...m, ...fundGoal(m, 'bank', 1200) }
    const released = { ...funded, ...releaseGoalFunds(funded, goal) }
    expect(released.bankPart).toBe(m.bankPart)
  })
})

describe('normalizeMonth', () => {
  it('backfills missing fields on legacy documents', () => {
    const legacy = { id: '2026-07', month: '2026-07', label: 'July 2026' } as MonthBudget
    const m = normalizeMonth(legacy)
    expect(m.bankPart).toBe(0)
    expect(m.variableExpenses).toEqual([])
    expect(m.categoryColors).toEqual({})
    expect(m.strategyId).toBeTruthy()
  })

  it('backfills expense place to bank', () => {
    const legacy = {
      ...emptyMonth('2026-07'),
      variableExpenses: [{ id: 'a', name: 'x', amount: 10, type: 'Autre', date: '2026-07-01' }],
    } as MonthBudget
    expect(normalizeMonth(legacy).variableExpenses[0].place).toBe('bank')
  })
})

describe('rolloverMonth', () => {
  it('carries the plan but clears transactions', () => {
    const prev = baseMonth({
      variableExpenses: [{ id: 'a', name: 'x', amount: 10, type: 'Autre', date: '2026-06-01', place: 'bank' }],
      strategyId: 'envelope', monthlySavingsTarget: 850,
    })
    const next = rolloverMonth('2026-08', prev)
    expect(next.variableExpenses).toEqual([])
    expect(next.fixedExpenses).toEqual([])
    expect(next.totalBudget).toBe(prev.totalBudget)
    expect(next.strategyId).toBe('envelope')
    expect(next.monthlySavingsTarget).toBe(850)
  })
})
