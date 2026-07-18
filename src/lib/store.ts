'use client'

// Category types are open strings so users can add their own custom
// categories via "Manage categories" - the literal lists below (VARIABLE_TYPES /
// FIXED_TYPES) are just the built-in defaults every account starts with.
export type ExpenseType = string
export type FixedType = string

export interface VariableExpense {
  id: string; name: string; amount: number; type: ExpenseType; date: string; person?: string
}
export interface FixedExpense {
  id: string; name: string; amount: number; type: FixedType; base: number; date?: string
}

/* ── Money places: every dirham lives in one of three places ── */
export type MoneyPlace = 'bank' | 'home' | 'wallet'
export const MONEY_PLACES: MoneyPlace[] = ['bank', 'home', 'wallet']
export const MONEY_PLACE_LABEL: Record<MoneyPlace, string> = { bank: 'Bank', home: 'Home', wallet: 'Wallet' }
export const MONEY_PLACE_FIELD: Record<MoneyPlace, 'bankPart' | 'homePart' | 'walletPart'> = {
  bank: 'bankPart', home: 'homePart', wallet: 'walletPart',
}

export const SAVING_SOURCES = ['BANK', 'HOME', 'WALLET'] as const
export type SavingSource = typeof SAVING_SOURCES[number]
export const SOURCE_TO_PLACE: Record<SavingSource, MoneyPlace> = { BANK: 'bank', HOME: 'home', WALLET: 'wallet' }

export interface SavingGoal {
  id: string; name: string; target: number; current: number
  source: SavingSource; active: boolean
}
export interface MonthBudget {
  id: string; month: string; label: string
  totalBudget: number; homePart: number; walletPart: number; bankPart: number
  variableExpenses: VariableExpense[]
  fixedExpenses: FixedExpense[]
  savingGoals: SavingGoal[]
  variableCategoryBases: Record<string, number>
  fixedCategoryBases: Record<string, number>
  // Which categories show up in "Add expense" / "Add fixed" / budget editors.
  // Defaults to every built-in category - hide ones you don't use via
  // "Manage categories". Custom categories a user creates are added here too.
  activeVariableCategories: string[]
  activeFixedCategories: string[]
  categoryColors: Record<string, string>
  updatedAt?: unknown
}

function monthLabel(id: string) {
  const [y, m] = id.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

export function moneyPlaceAmount(month: MonthBudget, place: MoneyPlace): number {
  return month[MONEY_PLACE_FIELD[place]]
}

// Firestore documents saved before bank/home/wallet + custom categories
// existed won't have these fields - reading them straight would leave
// bankPart etc. as `undefined` and crash the first .toLocaleString() call.
// Every read path in db.ts runs a month through this before handing it to
// the UI.
export function normalizeMonth(m: MonthBudget): MonthBudget {
  return {
    ...m,
    totalBudget: m.totalBudget ?? 0,
    homePart: m.homePart ?? 0,
    walletPart: m.walletPart ?? 0,
    bankPart: m.bankPart ?? 0,
    variableExpenses: m.variableExpenses ?? [],
    fixedExpenses: m.fixedExpenses ?? [],
    savingGoals: m.savingGoals ?? [],
    variableCategoryBases: m.variableCategoryBases ?? {},
    fixedCategoryBases: m.fixedCategoryBases ?? {},
    activeVariableCategories: m.activeVariableCategories?.length ? m.activeVariableCategories : [...VARIABLE_TYPES],
    activeFixedCategories: m.activeFixedCategories?.length ? m.activeFixedCategories : [...FIXED_TYPES],
    categoryColors: m.categoryColors ?? {},
  }
}

// Moves `delta` (positive = add, negative = remove) into/out of a money
// place. Used whenever cash physically moves - e.g. funding a saving goal.
export function withMoneyPlaceDelta(month: MonthBudget, place: MoneyPlace, delta: number): Partial<MonthBudget> {
  const field = MONEY_PLACE_FIELD[place]
  return { [field]: Math.max(0, month[field] + delta) } as Partial<MonthBudget>
}

// A brand-new, empty month - no sample/placeholder numbers. Used only as a
// last-resort fallback (e.g. onboarding was skipped somehow). Real new
// accounts go through /onboarding, and returning users get rolloverMonth().
export function emptyMonth(monthId?: string): MonthBudget {
  const now = new Date()
  const id  = monthId ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return {
    id, month: id, label: monthLabel(id),
    totalBudget: 0, homePart: 0, walletPart: 0, bankPart: 0,
    variableExpenses: [], fixedExpenses: [], savingGoals: [],
    variableCategoryBases: Object.fromEntries(VARIABLE_TYPES.map(t => [t, 0])),
    fixedCategoryBases: Object.fromEntries(FIXED_TYPES.map(t => [t, 0])),
    activeVariableCategories: [...VARIABLE_TYPES],
    activeFixedCategories: [...FIXED_TYPES],
    categoryColors: {},
  }
}

// Carries a returning user's budget plan (income split + category limits +
// ongoing saving goals) into a new calendar month, with a clean slate of
// actual transactions for that month.
export function rolloverMonth(monthId: string, prev: MonthBudget): MonthBudget {
  return {
    id: monthId, month: monthId, label: monthLabel(monthId),
    totalBudget: prev.totalBudget, homePart: prev.homePart, walletPart: prev.walletPart, bankPart: prev.bankPart ?? 0,
    variableExpenses: [], fixedExpenses: [],
    savingGoals: prev.savingGoals.map(g => ({ ...g })),
    variableCategoryBases: { ...prev.variableCategoryBases },
    fixedCategoryBases: { ...prev.fixedCategoryBases },
    activeVariableCategories: prev.activeVariableCategories ? [...prev.activeVariableCategories] : [...VARIABLE_TYPES],
    activeFixedCategories: prev.activeFixedCategories ? [...prev.activeFixedCategories] : [...FIXED_TYPES],
    categoryColors: { ...(prev.categoryColors || {}) },
  }
}

export const VARIABLE_TYPES: ExpenseType[] = [
  'Alimentation','Gazoil','Restaurant','Sortie','Beauté','Famille','Queen','King','Shopping','Autre'
]
export const FIXED_TYPES: FixedType[] = ['Facture','Location','Internet','Téléphone','AI','Autre']

// The categories to actually display for a month: its active list, plus any
// category that already has real transactions logged (so hiding a category
// later never hides your own past spending).
export function displayVariableCats(month: MonthBudget): string[] {
  const base = month.activeVariableCategories?.length ? month.activeVariableCategories : VARIABLE_TYPES
  return Array.from(new Set([...base, ...month.variableExpenses.map(e => e.type)]))
}
export function displayFixedCats(month: MonthBudget): string[] {
  const base = month.activeFixedCategories?.length ? month.activeFixedCategories : FIXED_TYPES
  return Array.from(new Set([...base, ...month.fixedExpenses.map(e => e.type)]))
}

/* ── Custom category colors ── */
export const CUSTOM_CATEGORY_PALETTE = [
  '#D6A75C', '#7B9E8E', '#C9695A', '#8FA37E', '#B9925A', '#5FA97A', '#C98A8F', '#8A8175',
]
export function categoryColor(month: MonthBudget, type: string): string {
  return month.categoryColors?.[type] ?? CAT_COLOR[type] ?? '#8A8175'
}
export function nextPaletteColor(month: MonthBudget): string {
  const used = Object.keys(month.categoryColors || {}).length
  return CUSTOM_CATEGORY_PALETTE[used % CUSTOM_CATEGORY_PALETTE.length]
}

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
  // fractions of income kept in each money place - the rest (1 - home - bank) goes to wallet
  homeShare: number; bankShare: number
  recommended?: boolean
}

export const MANAGEMENT_STRATEGIES: ManagementStrategy[] = [
  {
    id: '50-30-20', name: '50/30/20 Rule', recommended: true,
    tagline: 'Recommended - balanced & beginner-friendly',
    description: '50% needs, 30% wants, 20% savings. The most tested general-purpose method.',
    homeShare: 0.3, bankShare: 0.2,
  },
  {
    id: 'zero-based', name: 'Zero-Based Budgeting',
    tagline: 'Best for tight control',
    description: 'Give every dirham a job so nothing is left unaccounted for at month\u2019s end.',
    homeShare: 0.35, bankShare: 0.1,
  },
  {
    id: 'envelope', name: 'Envelope System',
    tagline: 'Best for cash spenders',
    description: 'Keep separate cash "envelopes" per category by moving more of your budget home.',
    homeShare: 0.55, bankShare: 0.05,
  },
  {
    id: 'pay-yourself-first', name: 'Pay Yourself First',
    tagline: 'Best for saving goals',
    description: 'Set money aside in the bank the moment you\u2019re paid, then live on what remains.',
    homeShare: 0.25, bankShare: 0.3,
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
// management strategy's bank/home/wallet split. No placeholder transactions.
// Every built-in category stays visible in Add-expense/Add-fixed regardless
// of what was picked here - the picks only seed suggested budgets.
export function buildMonthFromOnboarding(monthId: string, r: OnboardingResult): MonthBudget {
  const strategy   = MANAGEMENT_STRATEGIES.find(s => s.id === r.strategyId) ?? MANAGEMENT_STRATEGIES[0]
  const homePart   = Math.round(r.income * strategy.homeShare)
  const bankPart   = Math.round(r.income * strategy.bankShare)
  const walletPart = Math.max(0, r.income - homePart - bankPart)

  const variableCategoryBases = Object.fromEntries(VARIABLE_TYPES.map(t => [t, 0])) as Record<string, number>
  r.variableCategories.forEach(t => {
    const s = SUGGESTED_VARIABLE_CATEGORIES.find(c => c.type === t)
    variableCategoryBases[t] = s ? Math.round(r.income * (s.sharePct / 100)) : 0
  })

  const fixedCategoryBases = Object.fromEntries(FIXED_TYPES.map(t => [t, 0])) as Record<string, number>
  r.fixedCategories.forEach(t => {
    const s = SUGGESTED_FIXED_CATEGORIES.find(c => c.type === t)
    fixedCategoryBases[t] = s ? Math.round(r.income * (s.sharePct / 100)) : 0
  })

  return {
    id: monthId, month: monthId, label: monthLabel(monthId),
    totalBudget: r.income, homePart, walletPart, bankPart,
    variableExpenses: [], fixedExpenses: [], savingGoals: [],
    variableCategoryBases, fixedCategoryBases,
    activeVariableCategories: [...VARIABLE_TYPES],
    activeFixedCategories: [...FIXED_TYPES],
    categoryColors: {},
  }
}

// Harmonised, desaturated palette - single accent family (warm tan/gold)
// plus muted semantic hues. No purple, no neon, saturation kept under 80%.
export const CAT_COLOR: Record<string, string> = {
  Alimentation: '#D6A75C', Gazoil: '#7B9E8E', Restaurant: '#C9695A',
  Sortie: '#B9925A', Beauté: '#C98A8F', Famille: '#8FA37E',
  Queen: '#B9925A', King: '#7B9E8E', Shopping: '#C9695A', Autre: '#8A8175',
  Facture: '#D6A75C', Location: '#7B9E8E', Internet: '#5FA97A',
  Téléphone: '#B9925A', AI: '#8A8175',
}
