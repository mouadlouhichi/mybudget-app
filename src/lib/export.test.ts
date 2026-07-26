import { describe, it, expect } from 'vitest'
import { buildExpensesCsv, buildBudgetsCsv, buildGoalsCsv, buildFullExport } from './export'
import { emptyMonth, type MonthBudget, type SavingsData } from './store'

function month(over: Partial<MonthBudget> = {}): MonthBudget {
  return { ...emptyMonth('2026-07'), totalBudget: 8500, bankPart: 8500, ...over }
}

describe('CSV export', () => {
  it('includes a header and one row per transaction', () => {
    const m = month({
      variableExpenses: [
        { id: '1', name: 'Coffee', amount: 35, type: 'Restaurant', date: '2026-07-02', place: 'wallet' },
        { id: '2', name: 'Fuel', amount: 300, type: 'Gazoil', date: '2026-07-05', place: 'bank' },
      ],
      fixedExpenses: [
        { id: '3', name: 'Rent', amount: 3000, base: 3000, type: 'Location', date: '2026-07-01', place: 'bank' },
      ],
    })
    const csv = buildExpensesCsv([m], 'MAD')
    const lines = csv.split('\r\n')
    expect(lines[0]).toContain('Month')
    expect(lines).toHaveLength(4)
    expect(csv).toContain('Coffee')
    expect(csv).toContain('Rent')
  })

  it('escapes embedded quotes and commas', () => {
    const m = month({
      variableExpenses: [
        { id: '1', name: 'Say "hi", loudly', amount: 10, type: 'Autre', date: '2026-07-02', place: 'bank' },
      ],
    })
    const csv = buildExpensesCsv([m], 'MAD')
    expect(csv).toContain('"Say ""hi"", loudly"')
  })

  it('neutralises CSV injection attempts', () => {
    const m = month({
      variableExpenses: [
        { id: '1', name: '=cmd|/c calc', amount: 10, type: 'Autre', date: '2026-07-02', place: 'bank' },
      ],
    })
    expect(buildExpensesCsv([m], 'MAD')).toContain(`"'=cmd|/c calc"`)
  })

  it('orders months chronologically', () => {
    const a = month({ id: '2026-08', month: '2026-08', totalBudget: 100 })
    const b = month({ id: '2026-07', month: '2026-07', totalBudget: 200 })
    const csv = buildBudgetsCsv([a, b], 'MAD')
    const lines = csv.split('\r\n')
    expect(lines[1]).toContain('2026-07')
    expect(lines[2]).toContain('2026-08')
  })

  it('exports goals with their status', () => {
    const s: SavingsData = {
      goals: [
        { id: 'g1', name: 'Vacation', target: 5000, current: 1200, source: 'BANK', active: true },
        { id: 'g2', name: 'Car', target: 90000, current: 0, source: 'HOME', active: false },
      ],
    }
    const csv = buildGoalsCsv(s, 'MAD')
    expect(csv).toContain('Vacation')
    expect(csv).toContain('active')
    expect(csv).toContain('pending')
  })

  it('produces a combined export with all three sections', () => {
    const out = buildFullExport([month()], { goals: [] }, 'MAD')
    expect(out).toContain('## Monthly budgets')
    expect(out).toContain('## Transactions')
    expect(out).toContain('## Saving goals')
  })

  it('handles an account with no data at all', () => {
    const out = buildFullExport([], { goals: [] }, 'EUR')
    expect(out).toContain('# Flousy data export')
    expect(() => out.split('\r\n')).not.toThrow()
  })
})
