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

function monthLabel(id: string) {
  const [y, m] = id.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

// A brand-new, empty month - no sample/placeholder numbers. Used only as a
// last-resort fallback (e.g. onboarding was skipped somehow). Real new
// accounts go through /onboarding, and returning users get rolloverMonth().
export function emptyMonth(monthId?: string): MonthBudget {
  const now = new Date()
  const id  = monthId ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return {
    id, month: id, label: monthLabel(id),
    totalBudget: 0, homePart: 0, walletPart: 0,
    variableExpenses: [], fixedExpenses: [], savingGoals: [],
    variableCategoryBases: {
      Alimentation: 0, Gazoil: 0, Restaurant: 0, Sortie: 0,
      Beauté: 0, Famille: 0, Queen: 0, King: 0, Shopping: 0, Autre: 0,
    },
    fixedCategoryBases: {
      Facture: 0, Location: 0, Internet: 0, Téléphone: 0, AI: 0, Autre: 0,
    },
  }
}

// Carries a returning user's budget plan (income split + category limits +
// ongoing saving goals) into a new calendar month, with a clean slate of
// actual transactions for that month.
export function rolloverMonth(monthId: string, prev: MonthBudget): MonthBudget {
  return {
    id: monthId, month: monthId, label: monthLabel(monthId),
    totalBudget: prev.totalBudget, homePart: prev.homePart, walletPart: prev.walletPart,
    variableExpenses: [], fixedExpenses: [],
    savingGoals: prev.savingGoals.map(g => ({ ...g })),
    variableCategoryBases: { ...prev.variableCategoryBases },
    fixedCategoryBases: { ...prev.fixedCategoryBases },
  }
}

export const VARIABLE_TYPES: ExpenseType[] = [
  'Alimentation','Gazoil','Restaurant','Sortie','Beauté','Famille','Queen','King','Shopping','Autre'
]
export const FIXED_TYPES: FixedType[] = ['Facture','Location','Internet','Téléphone','AI','Autre']

/* ── Onboarding: suggested categories & budgeting strategies ── */
export interface CategorySuggestion<T> { type: T; hint: string; sharePct: number; recommended: boolean }

export const SUGGESTED_VARIABLE_CATEGORIES: CategorySuggestion<ExpenseType>[] = [
  { type: 'Alimentation', hint: 'Groceries & everyday food',         sharePct: 12, recommended: true  },
  { type: 'Gazoil',       hint: 'Fuel & transport',                  sharePct: 5,  recommended: true  },
  { type: 'Restaurant',   hint: 'Eating out',                        sharePct: 4,  recommended: true  },
  { type: 'Famille',      hint: 'Family activities & outings',       sharePct: 5,  recommended: true  },
  { type: 'Shopping',     hint: 'Clothing & other purchases',        sharePct: 6,  recommended: true  },
  { type: 'Autre',        hint: 'Everything else, miscellaneous',    sharePct: 3,  recommended: true  },
  { type: 'Sortie',       hint: 'Nights out & entertainment',        sharePct: 3,  recommended: false },
  { type: 'Beauté',       hint: 'Personal care & beauty',            sharePct: 3,  recommended: false },
  { type: 'Queen',        hint: "Partner's personal spending money", sharePct: 4,  recommended: false },
  { type: 'King',         hint: "Partner's personal spending money", sharePct: 4,  recommended: false },
]

export const SUGGESTED_FIXED_CATEGORIES: CategorySuggestion<FixedType>[] = [
  { type: 'Location',   hint: 'Rent or mortgage',        sharePct: 30, recommended: true  },
  { type: 'Facture',    hint: 'Electricity, water, gas', sharePct: 3,  recommended: true  },
  { type: 'Internet',   hint: 'Home internet',           sharePct: 2,  recommended: true  },
  { type: 'Téléphone',  hint: 'Mobile plan',              sharePct: 2,  recommended: true  },
  { type: 'AI',         hint: 'Subscriptions & AI tools', sharePct: 1,  recommended: false },
  { type: 'Autre',      hint: 'Other recurring bills',    sharePct: 2,  recommended: false },
]

export interface ManagementStrategy {
  id: string; name: string; tagline: string; description: string
  homeShare: number // fraction of income kept as physical/home cash vs. wallet/card
  recommended?: boolean
}

export const MANAGEMENT_STRATEGIES: ManagementStrategy[] = [
  {
    id: '50-30-20', name: '50/30/20 Rule', recommended: true,
    tagline: 'Recommended - balanced & beginner-friendly',
    description: '50% needs, 30% wants, 20% savings. The most tested general-purpose method.',
    homeShare: 0.5,
  },
  {
    id: 'zero-based', name: 'Zero-Based Budgeting',
    tagline: 'Best for tight control',
    description: 'Give every dirham a job so nothing is left unaccounted for at month\u2019s end.',
    homeShare: 0.4,
  },
  {
    id: 'envelope', name: 'Envelope System',
    tagline: 'Best for cash spenders',
    description: 'Keep separate cash "envelopes" per category by moving more of your budget home.',
    homeShare: 0.65,
  },
  {
    id: 'pay-yourself-first', name: 'Pay Yourself First',
    tagline: 'Best for saving goals',
    description: 'Set savings aside the moment you\u2019re paid, then live on what remains.',
    homeShare: 0.35,
  },
]

export interface OnboardingResult {
  income: number
  variableCategories: ExpenseType[]
  fixedCategories: FixedType[]
  strategyId: string
}

// Builds a real first month straight from the onboarding answers - actual
// income, chosen categories with suggested budgets, and the chosen
// management strategy's home/wallet split. No placeholder transactions.
export function buildMonthFromOnboarding(monthId: string, r: OnboardingResult): MonthBudget {
  const strategy   = MANAGEMENT_STRATEGIES.find(s => s.id === r.strategyId) ?? MANAGEMENT_STRATEGIES[0]
  const homePart   = Math.round(r.income * strategy.homeShare)
  const walletPart = Math.max(0, r.income - homePart)

  const variableCategoryBases = {} as Record<ExpenseType, number>
  VARIABLE_TYPES.forEach(t => { variableCategoryBases[t] = 0 })
  r.variableCategories.forEach(t => {
    const s = SUGGESTED_VARIABLE_CATEGORIES.find(c => c.type === t)
    variableCategoryBases[t] = s ? Math.round(r.income * (s.sharePct / 100)) : 0
  })

  const fixedCategoryBases = {} as Record<FixedType, number>
  FIXED_TYPES.forEach(t => { fixedCategoryBases[t] = 0 })
  r.fixedCategories.forEach(t => {
    const s = SUGGESTED_FIXED_CATEGORIES.find(c => c.type === t)
    fixedCategoryBases[t] = s ? Math.round(r.income * (s.sharePct / 100)) : 0
  })

  return {
    id: monthId, month: monthId, label: monthLabel(monthId),
    totalBudget: r.income, homePart, walletPart,
    variableExpenses: [], fixedExpenses: [], savingGoals: [],
    variableCategoryBases, fixedCategoryBases,
  }
}

// Harmonised, desaturated palette — single accent family (warm tan/gold)
// plus muted semantic hues. No purple, no neon, saturation kept under 80%.
export const CAT_COLOR: Record<string, string> = {
  Alimentation: '#D6A75C', Gazoil: '#7B9E8E', Restaurant: '#C9695A',
  Sortie: '#B9925A', Beauté: '#C98A8F', Famille: '#8FA37E',
  Queen: '#B9925A', King: '#7B9E8E', Shopping: '#C9695A', Autre: '#8A8175',
  Facture: '#D6A75C', Location: '#7B9E8E', Internet: '#5FA97A',
  Téléphone: '#B9925A', AI: '#8A8175',
}
