'use client'

import { z } from 'zod'
import { MONEY_PLACES, SAVING_SOURCES } from './store'

// Shared limits. Amounts are capped well above any realistic personal
// budget but low enough to stop someone storing nonsense that breaks
// layout or overflows a Firestore document.
export const MAX_AMOUNT = 1_000_000_000
export const MAX_NAME = 80

// Accepts the raw string straight out of an <input type="number">, so every
// form gets the same rejection of '', 'abc', Infinity, negatives and
// absurd values instead of silently producing NaN.
export const amountSchema = (label = 'Amount') =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine(v => Number.isFinite(Number(v)), `${label} must be a number.`)
    .transform(v => Number(v))
    .refine(n => n > 0, `${label} must be greater than 0.`)
    .refine(n => n <= MAX_AMOUNT, `${label} is unrealistically large.`)

// Same, but allows zero (used for opening balances / optional funding).
export const nonNegativeAmountSchema = (label = 'Amount') =>
  z
    .string()
    .trim()
    .refine(v => v === '' || Number.isFinite(Number(v)), `${label} must be a number.`)
    .transform(v => (v === '' ? 0 : Number(v)))
    .refine(n => n >= 0, `${label} can't be negative.`)
    .refine(n => n <= MAX_AMOUNT, `${label} is unrealistically large.`)

export const nameSchema = (label = 'Name') =>
  z.string().trim().min(1, `${label} is required.`).max(MAX_NAME, `${label} is too long.`)

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date.')
  .refine(v => !Number.isNaN(new Date(v).getTime()), 'Pick a valid date.')

const moneyPlaceSchema = z.enum(MONEY_PLACES as [string, ...string[]])

export const variableExpenseSchema = z.object({
  name: nameSchema('Description'),
  amount: amountSchema('Amount'),
  type: nameSchema('Category'),
  date: dateSchema,
  place: moneyPlaceSchema,
})

export const fixedExpenseSchema = z.object({
  name: nameSchema('Name'),
  amount: amountSchema('Actual'),
  base: nonNegativeAmountSchema('Budget'),
  type: nameSchema('Type'),
  date: dateSchema,
  place: moneyPlaceSchema,
})

export const savingGoalSchema = z.object({
  name: nameSchema('Goal name'),
  target: amountSchema('Target'),
  current: nonNegativeAmountSchema('Starting amount'),
  source: z.enum(SAVING_SOURCES as unknown as [string, ...string[]]),
})

export const budgetSettingsSchema = z.object({
  totalBudget: nonNegativeAmountSchema('Total budget'),
  bankPart: nonNegativeAmountSchema('Bank'),
  homePart: nonNegativeAmountSchema('Home'),
  walletPart: nonNegativeAmountSchema('Wallet'),
})

export const incomeSchema = amountSchema('Income')

// Collapses a ZodError into { field: message } for inline form display.
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> }

export function validate<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(input)
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, errors: fieldErrors(parsed.error) }
}
