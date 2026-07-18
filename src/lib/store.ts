'use client'

export type ExpenseType =
  | 'Alimentation' | 'Gazoil' | 'Restaurant' | 'Sortie'
  | 'Beauté' | 'Famille' | 'Queen' | 'King' | 'Shopping' | 'Autre'

export type FixedType = 'Facture' | 'Location' | 'Internet' | 'Téléphone' | 'AI' | 'Autre'

export interface VariableExpense {
  id: string; name: string; amount: number; type: ExpenseType; date: string; person?: string
}
export interface FixedExpense {
  id: string; name: string; amount: number; type: FixedType; base: number; date?: string
}
export interface SavingGoal {
  id: string; name: string; target: number; current: number
  source: 'HOME' | 'BANK SAVING' | 'WALLET'; active: boolean
}
export interface MonthBudget {
  id: string; month: string; label: string
  totalBudget: number; homePart: number; walletPart: number
  variableExpenses: VariableExpense[]
  fixedExpenses: FixedExpense[]
  savingGoals: SavingGoal[]
  variableCategoryBases: Record<ExpenseType, number>
  fixedCategoryBases: Record<FixedType, number>
  updatedAt?: unknown
}

export function defaultMonth(monthId?: string): MonthBudget {
  const now   = new Date()
  const id    = monthId ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [y, m] = id.split('-')
  const label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
  return {
    id, month: id, label,
    totalBudget: 8500, homePart: 3100, walletPart: 5400,
    variableExpenses: [
      { id: '1', name: 'Supermarket', amount: 100, type: 'Alimentation', date: `${id}-05` },
      { id: '2', name: 'Gazoil station', amount: 200, type: 'Gazoil', date: `${id}-08` },
      { id: '3', name: 'Restaurant downtown', amount: 150, type: 'Restaurant', date: `${id}-10` },
      { id: '4', name: 'Family outing', amount: 200, type: 'Famille', date: `${id}-12` },
      { id: '5', name: 'Shopping mall', amount: 300, type: 'Shopping', date: `${id}-14` },
    ],
    fixedExpenses: [
      { id: 'f1', name: 'Electricity', amount: 49.4, type: 'Facture', base: 60 },
      { id: 'f2', name: 'Water bill', amount: 37.65, type: 'Facture', base: 60 },
      { id: 'f3', name: 'Rent', amount: 3416, type: 'Location', base: 3500 },
    ],
    savingGoals: [
      { id: 's1', name: 'Emergency fund', target: 8000, current: 8000, source: 'BANK SAVING', active: true },
      { id: 's2', name: 'Voyage', target: 1000, current: 700, source: 'HOME', active: true },
      { id: 's3', name: 'New car', target: 40000, current: 5000, source: 'BANK SAVING', active: true },
    ],
    variableCategoryBases: {
      Alimentation: 3000, Gazoil: 700, Restaurant: 500, Sortie: 500,
      Beauté: 500, Famille: 600, Queen: 800, King: 800, Shopping: 1500, Autre: 500,
    },
    fixedCategoryBases: {
      Facture: 120, Location: 3500, Internet: 500, Téléphone: 250, AI: 50, Autre: 200,
    },
  }
}

export const VARIABLE_TYPES: ExpenseType[] = [
  'Alimentation','Gazoil','Restaurant','Sortie','Beauté','Famille','Queen','King','Shopping','Autre'
]
export const FIXED_TYPES: FixedType[] = ['Facture','Location','Internet','Téléphone','AI','Autre']

// Harmonised, desaturated palette — single accent family (warm tan/gold)
// plus muted semantic hues. No purple, no neon, saturation kept under 80%.
export const CAT_COLOR: Record<string, string> = {
  Alimentation: '#D6A75C', Gazoil: '#7B9E8E', Restaurant: '#C9695A',
  Sortie: '#B9925A', Beauté: '#C98A8F', Famille: '#8FA37E',
  Queen: '#B9925A', King: '#7B9E8E', Shopping: '#C9695A', Autre: '#8A8175',
  Facture: '#D6A75C', Location: '#7B9E8E', Internet: '#5FA97A',
  Téléphone: '#B9925A', AI: '#8A8175',
}
