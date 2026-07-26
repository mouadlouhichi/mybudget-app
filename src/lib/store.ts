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

// Saving goals are global (per user, not per month) - see db.ts savingsDocRef.
// Money you set aside stays saved when the calendar month rolls over.
export interface SavingsData { goals: SavingGoal[] }
export function emptySavings(): SavingsData { return { goals: [] } }

export interface MonthBudget {
  id: string; month: string; label: string
  totalBudget: number; homePart: number; walletPart: number; bankPart: number
  // The budgeting strategy in force for this month (see MANAGEMENT_STRATEGIES).
  // Drives the needs/wants/savings envelopes shown on the dashboard.
  strategyId?: string
  // How much the strategy says should be saved this month. A target, not a
  // balance - actual saved money lives in the global savings goals.
  monthlySavingsTarget?: number
  variableExpenses: VariableExpense[]
  fixedExpenses: FixedExpense[]
  // Legacy field from before saving goals became global - no longer written,
  // kept optional only so old month docs can be migrated once on first load.
  savingGoals?: SavingGoal[]
  variableCategoryBases: Record<string, number>
  fixedCategoryBases: Record<string, number>
  // Which categories show up in "Add expense" / "Add fixed" / budget editors.
  // Defaults to every built-in category - hide ones you don't use via
  // "Manage categories". Custom categories a user creates are added here too.
  activeVariableCategories: string[]
  activeFixedCategories: string[]
  categoryColors: Record<string, string>
  // Icon key (see category-icons.tsx ICON_BY_KEY) chosen for a custom
  // category. Categories without an entry here fall back to CAT_ICON / the
  // generic fallback icon.
  categoryIcons: Record<string, string>
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
    strategyId: m.strategyId ?? MANAGEMENT_STRATEGIES[0].id,
    monthlySavingsTarget: m.monthlySavingsTarget ?? 0,
    variableExpenses: m.variableExpenses ?? [],
    fixedExpenses: m.fixedExpenses ?? [],
    variableCategoryBases: m.variableCategoryBases ?? {},
    fixedCategoryBases: m.fixedCategoryBases ?? {},
    activeVariableCategories: m.activeVariableCategories?.length ? m.activeVariableCategories : [...VARIABLE_TYPES],
    activeFixedCategories: m.activeFixedCategories?.length ? m.activeFixedCategories : [...FIXED_TYPES],
    categoryColors: m.categoryColors ?? {},
    categoryIcons: m.categoryIcons ?? {},
  }
}

// Moves `delta` (positive = add, negative = remove) into/out of a money
// place. Used whenever cash physically moves - e.g. funding a saving goal.
export function withMoneyPlaceDelta(month: MonthBudget, place: MoneyPlace, delta: number): Partial<MonthBudget> {
  const field = MONEY_PLACE_FIELD[place]
  return { [field]: Math.max(0, month[field] + delta) } as Partial<MonthBudget>
}

// Moves cash between two money places, conserving the total. Income always
// starts in the bank, so withdrawing to home/wallet is just a transfer out
// of it. Clamped to what's actually available in `from`.
export function transferBetweenPlaces(
  month: MonthBudget, from: MoneyPlace, to: MoneyPlace, amount: number,
): Partial<MonthBudget> {
  if (from === to || amount <= 0) return {}
  const fromField = MONEY_PLACE_FIELD[from]
  const toField   = MONEY_PLACE_FIELD[to]
  const moved     = Math.min(amount, month[fromField])
  if (moved <= 0) return {}
  return {
    [fromField]: month[fromField] - moved,
    [toField]:   month[toField] + moved,
  } as Partial<MonthBudget>
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
    strategyId: MANAGEMENT_STRATEGIES[0].id,
    monthlySavingsTarget: 0,
    variableExpenses: [], fixedExpenses: [],
    variableCategoryBases: Object.fromEntries(VARIABLE_TYPES.map(t => [t, 0])),
    fixedCategoryBases: Object.fromEntries(FIXED_TYPES.map(t => [t, 0])),
    activeVariableCategories: [...VARIABLE_TYPES],
    activeFixedCategories: [...FIXED_TYPES],
    categoryColors: {},
    categoryIcons: {},
  }
}

// Carries a returning user's budget plan (income split + category limits)
// into a new calendar month, with a clean slate of actual transactions for
// that month. Saving goals aren't part of this - they're global, see
// SavingsData / db.ts savingsDocRef.
export function rolloverMonth(monthId: string, prev: MonthBudget): MonthBudget {
  return {
    id: monthId, month: monthId, label: monthLabel(monthId),
    totalBudget: prev.totalBudget, homePart: prev.homePart, walletPart: prev.walletPart, bankPart: prev.bankPart ?? 0,
    strategyId: prev.strategyId,
    monthlySavingsTarget: prev.monthlySavingsTarget ?? 0,
    variableExpenses: [], fixedExpenses: [],
    variableCategoryBases: { ...prev.variableCategoryBases },
    fixedCategoryBases: { ...prev.fixedCategoryBases },
    activeVariableCategories: prev.activeVariableCategories ? [...prev.activeVariableCategories] : [...VARIABLE_TYPES],
    activeFixedCategories: prev.activeFixedCategories ? [...prev.activeFixedCategories] : [...FIXED_TYPES],
    categoryColors: { ...(prev.categoryColors || {}) },
    categoryIcons: { ...(prev.categoryIcons || {}) },
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

// Which envelope a category belongs to. This is about *what the money is
// for* - it has nothing to do with bank/home/wallet, which is about *where
// the cash physically sits*. Keeping the two axes separate is the whole
// point: a strategy like 50/30/20 splits spending into needs/wants/savings,
// it does not tell you to keep 30% of your salary as cash at home.
export type SpendBucket = 'needs' | 'wants'

export interface CategorySuggestion<T> {
  type: T; hint: string
  // Relative weight inside its bucket, not a share of income. Actual budgets
  // are derived by scaling these to fit the strategy's envelope - see
  // buildMonthFromOnboarding.
  weight: number
  bucket: SpendBucket
  recommended: boolean
}

export const SUGGESTED_VARIABLE_CATEGORIES: CategorySuggestion<ExpenseType>[] = [
  { type: 'Alimentation', hint: 'Groceries & everyday food',         weight: 12, bucket: 'needs', recommended: true  },
  { type: 'Gazoil',       hint: 'Fuel & transport',                  weight: 5,  bucket: 'needs', recommended: true  },
  { type: 'Restaurant',   hint: 'Eating out',                        weight: 4,  bucket: 'wants', recommended: true  },
  { type: 'Famille',      hint: 'Family activities & outings',       weight: 5,  bucket: 'wants', recommended: true  },
  { type: 'Shopping',     hint: 'Clothing & other purchases',        weight: 6,  bucket: 'wants', recommended: true  },
  { type: 'Autre',        hint: 'Everything else, miscellaneous',    weight: 3,  bucket: 'wants', recommended: true  },
  { type: 'Sortie',       hint: 'Nights out & entertainment',        weight: 3,  bucket: 'wants', recommended: false },
  { type: 'Beauté',       hint: 'Personal care & beauty',            weight: 3,  bucket: 'wants', recommended: false },
  { type: 'Queen',        hint: "Partner's personal spending money", weight: 4,  bucket: 'wants', recommended: false },
  { type: 'King',         hint: "Partner's personal spending money", weight: 4,  bucket: 'wants', recommended: false },
]

export const SUGGESTED_FIXED_CATEGORIES: CategorySuggestion<FixedType>[] = [
  { type: 'Location',   hint: 'Rent or mortgage',         weight: 30, bucket: 'needs', recommended: true  },
  { type: 'Facture',    hint: 'Electricity, water, gas',  weight: 3,  bucket: 'needs', recommended: true  },
  { type: 'Internet',   hint: 'Home internet',            weight: 2,  bucket: 'needs', recommended: true  },
  { type: 'Téléphone',  hint: 'Mobile plan',              weight: 2,  bucket: 'needs', recommended: true  },
  { type: 'AI',         hint: 'Subscriptions & AI tools', weight: 1,  bucket: 'wants', recommended: false },
  { type: 'Autre',      hint: 'Other recurring bills',    weight: 2,  bucket: 'needs', recommended: true  },
]

// A budgeting strategy splits *spending intent* three ways. The three shares
// always sum to 1. It deliberately says nothing about money places - every
// account starts with the full income in the bank and the user moves cash to
// home/wallet themselves (see transferBetweenPlaces).
export interface ManagementStrategy {
  id: string; name: string; tagline: string; description: string
  needsShare: number; wantsShare: number; savingsShare: number
  recommended?: boolean
}

export const MANAGEMENT_STRATEGIES: ManagementStrategy[] = [
  {
    id: '50-30-20', name: '50/30/20 Rule', recommended: true,
    tagline: 'Recommended - balanced & beginner-friendly',
    description: '50% needs, 30% wants, 20% savings. The most tested general-purpose method.',
    needsShare: 0.5, wantsShare: 0.3, savingsShare: 0.2,
  },
  {
    id: 'zero-based', name: 'Zero-Based Budgeting',
    tagline: 'Best for tight control',
    description: 'Give every dirham a job so nothing is left unaccounted for at month\u2019s end.',
    needsShare: 0.6, wantsShare: 0.25, savingsShare: 0.15,
  },
  {
    id: 'envelope', name: 'Envelope System',
    tagline: 'Best for cash spenders',
    description: 'Cap each category tightly and spend only what its envelope holds.',
    needsShare: 0.55, wantsShare: 0.35, savingsShare: 0.1,
  },
  {
    id: 'pay-yourself-first', name: 'Pay Yourself First',
    tagline: 'Best for saving goals',
    description: 'Set savings aside the moment you\u2019re paid, then live on what remains.',
    needsShare: 0.45, wantsShare: 0.25, savingsShare: 0.3,
  },
]

export function getStrategy(id: string | undefined): ManagementStrategy {
  return MANAGEMENT_STRATEGIES.find(s => s.id === id) ?? MANAGEMENT_STRATEGIES[0]
}

export type CategoryKind = 'variable' | 'fixed'

// Which envelope a category draws from. Variable and fixed are looked up
// separately on purpose: some names (notably "Autre") exist in both lists
// with different meanings - a miscellaneous purchase is a want, a
// miscellaneous recurring bill is a need. Merging them into one map would
// let whichever list was spread last silently win.
const BUCKET_BY_VARIABLE: Record<string, SpendBucket> =
  Object.fromEntries(SUGGESTED_VARIABLE_CATEGORIES.map(c => [c.type, c.bucket]))
const BUCKET_BY_FIXED: Record<string, SpendBucket> =
  Object.fromEntries(SUGGESTED_FIXED_CATEGORIES.map(c => [c.type, c.bucket]))

// Anything custom the user invented counts as a 'want' so it can never
// quietly inflate the essentials envelope. Fixed bills are the exception -
// a recurring charge is a commitment, so unknown fixed types are 'needs'.
export function bucketOf(type: string, kind: CategoryKind): SpendBucket {
  return kind === 'variable'
    ? (BUCKET_BY_VARIABLE[type] ?? 'wants')
    : (BUCKET_BY_FIXED[type] ?? 'needs')
}

// The three envelope amounts a strategy implies for a given income.
export interface StrategyEnvelopes { needs: number; wants: number; savings: number }
export function strategyEnvelopes(income: number, strategyId?: string): StrategyEnvelopes {
  const s = getStrategy(strategyId)
  const needs   = Math.round(income * s.needsShare)
  const wants   = Math.round(income * s.wantsShare)
  // Savings absorbs the rounding remainder so the three always sum to income.
  const savings = Math.max(0, income - needs - wants)
  return { needs, wants, savings }
}

export interface OnboardingResult {
  income: number
  variableCategories: ExpenseType[]
  fixedCategories: FixedType[]
  strategyId: string
}

// Builds a real first month from the onboarding answers. The strategy shapes
// *budgets* (needs/wants envelopes + a savings target); it never decides
// where cash sits. All income starts in the bank - the user moves it to
// home/wallet explicitly afterwards.
export function buildMonthFromOnboarding(monthId: string, r: OnboardingResult): MonthBudget {
  const envelopes = strategyEnvelopes(r.income, r.strategyId)

  // Needs and wants envelopes are shared between variable and fixed
  // categories, so weights from both lists are pooled before scaling.
  // Entries are tagged with their kind because the same name can appear in
  // both lists ("Autre") in different buckets - see bucketOf.
  type Pick = { type: string; kind: CategoryKind; weight: number; bucket: SpendBucket }
  const picks: Pick[] = [
    ...r.variableCategories.map(t => {
      const s = SUGGESTED_VARIABLE_CATEGORIES.find(c => c.type === t)
      return { type: t, kind: 'variable' as const, weight: s?.weight ?? 0, bucket: bucketOf(t, 'variable') }
    }),
    ...r.fixedCategories.map(t => {
      const s = SUGGESTED_FIXED_CATEGORIES.find(c => c.type === t)
      return { type: t, kind: 'fixed' as const, weight: s?.weight ?? 0, bucket: bucketOf(t, 'fixed') }
    }),
  ]

  // Scale each bucket's picks so they exactly fill their envelope. Weights
  // are relative, so choosing fewer categories gives each a bigger slice
  // rather than leaving the envelope underspent. The largest pick absorbs
  // the rounding remainder so the envelope is matched to the dirham.
  const variableCategoryBases = Object.fromEntries(VARIABLE_TYPES.map(t => [t, 0])) as Record<string, number>
  const fixedCategoryBases    = Object.fromEntries(FIXED_TYPES.map(t => [t, 0])) as Record<string, number>
  const assign = (p: Pick, amount: number) => {
    if (p.kind === 'variable') variableCategoryBases[p.type] = amount
    else fixedCategoryBases[p.type] = amount
  }

  ;(['needs', 'wants'] as const).forEach(bucket => {
    const inBucket = picks.filter(p => p.bucket === bucket)
    const totalWeight = inBucket.reduce((s, p) => s + p.weight, 0)
    if (!totalWeight) return
    const envelope = envelopes[bucket]
    let allocated = 0
    inBucket.forEach(p => {
      const amount = Math.round(envelope * (p.weight / totalWeight))
      assign(p, amount)
      allocated += amount
    })
    // Push the rounding drift onto the heaviest category.
    const drift = envelope - allocated
    if (drift !== 0) {
      const biggest = inBucket.reduce((a, b) => (b.weight > a.weight ? b : a))
      const current = biggest.kind === 'variable'
        ? variableCategoryBases[biggest.type]
        : fixedCategoryBases[biggest.type]
      assign(biggest, Math.max(0, current + drift))
    }
  })

  return {
    id: monthId, month: monthId, label: monthLabel(monthId),
    totalBudget: r.income,
    // Everything lands in the bank. Moving money to home/wallet is an
    // explicit user action so the split always reflects reality.
    bankPart: r.income, homePart: 0, walletPart: 0,
    strategyId: r.strategyId,
    monthlySavingsTarget: envelopes.savings,
    variableExpenses: [], fixedExpenses: [],
    variableCategoryBases, fixedCategoryBases,
    activeVariableCategories: [...VARIABLE_TYPES],
    activeFixedCategories: [...FIXED_TYPES],
    categoryColors: {},
    categoryIcons: {},
  }
}

// Name used for the savings goal auto-created at the end of onboarding.
export const DEFAULT_SAVINGS_GOAL_NAME = 'Monthly savings'

// Harmonised, desaturated palette - single accent family (warm tan/gold)
// plus muted semantic hues. No purple, no neon, saturation kept under 80%.
export const CAT_COLOR: Record<string, string> = {
  Alimentation: '#D6A75C', Gazoil: '#7B9E8E', Restaurant: '#C9695A',
  Sortie: '#B9925A', Beauté: '#C98A8F', Famille: '#8FA37E',
  Queen: '#B9925A', King: '#7B9E8E', Shopping: '#C9695A', Autre: '#8A8175',
  Facture: '#D6A75C', Location: '#7B9E8E', Internet: '#5FA97A',
  Téléphone: '#B9925A', AI: '#8A8175',
}
