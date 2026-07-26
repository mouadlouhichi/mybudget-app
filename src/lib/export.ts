'use client'

import type { MonthBudget, SavingsData } from './store'

// RFC-4180 escaping: wrap in quotes and double any embedded quote. Also
// guards against CSV injection - a leading =, +, - or @ makes Excel treat
// the cell as a formula, so those get prefixed with a single quote.
function cell(v: string | number | undefined | null): string {
  const s = v === undefined || v === null ? '' : String(v)
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

function toCsv(rows: (string | number | undefined)[][]): string {
  return rows.map(r => r.map(cell).join(',')).join('\r\n')
}

export function buildExpensesCsv(months: MonthBudget[], currency: string): string {
  const rows: (string | number | undefined)[][] = [
    ['Month', 'Kind', 'Date', 'Category', 'Description', 'Amount', 'Currency', 'Budget', 'Paid from'],
  ]
  for (const m of [...months].sort((a, b) => a.id.localeCompare(b.id))) {
    for (const e of m.variableExpenses) {
      rows.push([m.id, 'variable', e.date, e.type, e.name, e.amount, currency, '', e.place ?? 'bank'])
    }
    for (const e of m.fixedExpenses) {
      rows.push([m.id, 'fixed', e.date ?? '', e.type, e.name, e.amount, currency, e.base, e.place ?? 'bank'])
    }
  }
  return toCsv(rows)
}

export function buildBudgetsCsv(months: MonthBudget[], currency: string): string {
  const rows: (string | number | undefined)[][] = [
    ['Month', 'Total budget', 'Currency', 'Bank', 'Home', 'Wallet', 'Strategy', 'Savings target'],
  ]
  for (const m of [...months].sort((a, b) => a.id.localeCompare(b.id))) {
    rows.push([m.id, m.totalBudget, currency, m.bankPart, m.homePart, m.walletPart, m.strategyId ?? '', m.monthlySavingsTarget ?? 0])
  }
  return toCsv(rows)
}

export function buildGoalsCsv(savings: SavingsData, currency: string): string {
  const rows: (string | number | undefined)[][] = [
    ['Goal', 'Target', 'Saved', 'Currency', 'Source', 'Status'],
  ]
  for (const g of savings.goals) {
    rows.push([g.name, g.target, g.current, currency, g.source, g.active ? 'active' : 'pending'])
  }
  return toCsv(rows)
}

// One human-readable file containing all three sections. Simpler for the
// user than juggling three downloads, and still opens cleanly in a
// spreadsheet.
export function buildFullExport(months: MonthBudget[], savings: SavingsData, currency: string): string {
  return [
    '# Flousy data export',
    `# Generated ${new Date().toISOString()}`,
    '',
    '## Monthly budgets',
    buildBudgetsCsv(months, currency),
    '',
    '## Transactions',
    buildExpensesCsv(months, currency),
    '',
    '## Saving goals',
    buildGoalsCsv(savings, currency),
    '',
  ].join('\r\n')
}

export function downloadCsv(filename: string, contents: string) {
  // BOM so Excel detects UTF-8 and renders accented category names correctly.
  const blob = new Blob(['\uFEFF' + contents], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
