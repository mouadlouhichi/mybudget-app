'use client'

// Currency support. The user's choice lives on their profile
// (users/{uid}.currency) and is threaded through the UI via the
// CurrencyProvider in currency-context.tsx - nothing should hardcode "MAD"
// or the fr-MA locale any more.

export interface CurrencyDef {
  code: string
  label: string
  symbol: string
  // BCP-47 locale used for digit grouping / decimal separators.
  locale: string
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'MAD', label: 'Moroccan Dirham',   symbol: 'MAD', locale: 'fr-MA' },
  { code: 'EUR', label: 'Euro',              symbol: '€',   locale: 'fr-FR' },
  { code: 'USD', label: 'US Dollar',         symbol: '$',   locale: 'en-US' },
  { code: 'GBP', label: 'British Pound',     symbol: '£',   locale: 'en-GB' },
  { code: 'CAD', label: 'Canadian Dollar',   symbol: 'CA$', locale: 'en-CA' },
  { code: 'CHF', label: 'Swiss Franc',       symbol: 'CHF', locale: 'de-CH' },
  { code: 'AED', label: 'UAE Dirham',        symbol: 'AED', locale: 'ar-AE' },
  { code: 'SAR', label: 'Saudi Riyal',       symbol: 'SAR', locale: 'ar-SA' },
  { code: 'EGP', label: 'Egyptian Pound',    symbol: 'EGP', locale: 'ar-EG' },
  { code: 'TND', label: 'Tunisian Dinar',    symbol: 'TND', locale: 'fr-TN' },
  { code: 'DZD', label: 'Algerian Dinar',    symbol: 'DZD', locale: 'fr-DZ' },
  { code: 'XOF', label: 'West African CFA',  symbol: 'CFA', locale: 'fr-SN' },
]

export const DEFAULT_CURRENCY = 'MAD'

export function currencyDef(code: string | undefined): CurrencyDef {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0]
}

// Formats a bare number with the right grouping for the currency's locale.
// Deliberately does NOT append the symbol - most call sites render the
// amount and unit as separately styled elements.
export function formatAmount(n: number, code?: string): string {
  const def = currencyDef(code)
  const safe = Number.isFinite(n) ? n : 0
  return safe.toLocaleString(def.locale, { maximumFractionDigits: 0 })
}

// Full "1 234 MAD" style string, for places that want one blob of text.
export function formatMoney(n: number, code?: string): string {
  return `${formatAmount(n, code)} ${currencyDef(code).symbol}`
}
