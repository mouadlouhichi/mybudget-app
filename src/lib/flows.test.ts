import { describe, it, expect } from 'vitest'
import {
  buildMonthFromOnboarding, applySpendDelta, transferBetweenPlaces,
  fundGoal, withdrawFromGoal, releaseGoalFunds,
  moneyPlaceAmount, type MonthBudget, type SavingGoal, type VariableExpense,
} from './store'

// End-to-end simulations of the sequences a real user performs. These guard
// the invariant that matters most in a finance app: money is never silently
// created or destroyed.

const totalCash = (m: MonthBudget) => m.bankPart + m.homePart + m.walletPart

function setup(income = 8500): MonthBudget {
  return buildMonthFromOnboarding('2026-07', {
    income,
    variableCategories: ['Alimentation', 'Restaurant'],
    fixedCategories: ['Location'],
    strategyId: '50-30-20',
  })
}

describe('flow: onboarding → spend → correct → delete', () => {
  it('returns to the starting balance after a full undo cycle', () => {
    let m = setup()
    const opening = totalCash(m)
    expect(opening).toBe(8500)

    const expense: VariableExpense = {
      id: 'e1', name: 'Groceries', amount: 420, type: 'Alimentation', date: '2026-07-03', place: 'bank',
    }

    // Add
    m = { ...m, ...applySpendDelta(m, null, expense), variableExpenses: [expense] }
    expect(m.bankPart).toBe(8080)
    expect(totalCash(m)).toBe(opening - 420)

    // Correct a typo: 420 -> 240
    const fixed = { ...expense, amount: 240 }
    m = { ...m, ...applySpendDelta(m, expense, fixed), variableExpenses: [fixed] }
    expect(m.bankPart).toBe(8260)
    expect(totalCash(m)).toBe(opening - 240)

    // Delete it entirely
    m = { ...m, ...applySpendDelta(m, fixed, null), variableExpenses: [] }
    expect(totalCash(m)).toBe(opening)
    expect(m.bankPart).toBe(8500)
  })

  it('keeps the books balanced when an expense moves between places', () => {
    let m = setup()
    m = { ...m, ...transferBetweenPlaces(m, 'bank', 'wallet', 1000) }
    const opening = totalCash(m)

    const e: VariableExpense = { id: 'e1', name: 'Lunch', amount: 90, type: 'Restaurant', date: '2026-07-04', place: 'wallet' }
    m = { ...m, ...applySpendDelta(m, null, e) }
    expect(m.walletPart).toBe(910)

    // Realise it was actually paid by card
    const moved = { ...e, place: 'bank' as const }
    m = { ...m, ...applySpendDelta(m, e, moved) }
    expect(m.walletPart).toBe(1000)
    expect(m.bankPart).toBe(7500 - 90)
    expect(totalCash(m)).toBe(opening - 90)
  })
})

describe('flow: saving goal lifecycle', () => {
  it('fund → withdraw → delete never creates or destroys money', () => {
    let m = setup()
    const opening = totalCash(m)
    let goal: SavingGoal = { id: 'g1', name: 'Vacation', target: 6000, current: 0, source: 'BANK', active: true }

    // Fund 2000
    m = { ...m, ...fundGoal(m, 'bank', 2000) }
    goal = { ...goal, current: 2000 }
    expect(m.bankPart).toBe(6500)
    expect(totalCash(m) + goal.current).toBe(opening)

    // Withdraw 500 back
    const w = withdrawFromGoal(m, goal, 'bank', 500)
    m = { ...m, ...w.monthPatch }
    goal = w.goal
    expect(goal.current).toBe(1500)
    expect(m.bankPart).toBe(7000)
    expect(totalCash(m) + goal.current).toBe(opening)

    // Delete the goal - the remaining 1500 must come back
    m = { ...m, ...releaseGoalFunds(m, goal) }
    expect(m.bankPart).toBe(8500)
    expect(totalCash(m)).toBe(opening)
  })

  it('deleting a goal funded from wallet returns money to wallet, not bank', () => {
    let m = setup()
    m = { ...m, ...transferBetweenPlaces(m, 'bank', 'wallet', 2000) }
    const goal: SavingGoal = { id: 'g1', name: 'Phone', target: 3000, current: 800, source: 'WALLET', active: true }
    m = { ...m, ...fundGoal(m, 'wallet', 800) }
    expect(m.walletPart).toBe(1200)

    m = { ...m, ...releaseGoalFunds(m, goal) }
    expect(m.walletPart).toBe(2000)
    expect(m.bankPart).toBe(6500)
  })
})

describe('flow: a realistic month', () => {
  it('tracks a full month of activity without drift', () => {
    let m = setup(10000)
    const opening = totalCash(m)

    // Move some cash around
    m = { ...m, ...transferBetweenPlaces(m, 'bank', 'wallet', 1500) }
    m = { ...m, ...transferBetweenPlaces(m, 'bank', 'home', 1000) }
    expect(totalCash(m)).toBe(opening)

    // A month of spending from various places
    const spends: VariableExpense[] = [
      { id: '1', name: 'Groceries', amount: 600, type: 'Alimentation', date: '2026-07-02', place: 'home' },
      { id: '2', name: 'Dinner', amount: 220, type: 'Restaurant', date: '2026-07-08', place: 'wallet' },
      { id: '3', name: 'Groceries', amount: 380, type: 'Alimentation', date: '2026-07-15', place: 'wallet' },
    ]
    for (const s of spends) m = { ...m, ...applySpendDelta(m, null, s) }

    const spent = spends.reduce((a, b) => a + b.amount, 0)
    expect(totalCash(m)).toBe(opening - spent)
    expect(m.homePart).toBe(400)
    expect(m.walletPart).toBe(900)
    expect(m.bankPart).toBe(7500)

    // Save what's left in the wallet
    m = { ...m, ...fundGoal(m, 'wallet', 900) }
    expect(m.walletPart).toBe(0)
    expect(totalCash(m)).toBe(opening - spent - 900)
  })

  it('spending more than a place holds drains it rather than going negative', () => {
    let m = setup()
    m = { ...m, ...transferBetweenPlaces(m, 'bank', 'wallet', 200) }
    const e: VariableExpense = { id: '1', name: 'Big', amount: 900, type: 'Restaurant', date: '2026-07-09', place: 'wallet' }
    m = { ...m, ...applySpendDelta(m, null, e) }
    expect(m.walletPart).toBe(0)
    expect(moneyPlaceAmount(m, 'wallet')).toBeGreaterThanOrEqual(0)
  })
})
