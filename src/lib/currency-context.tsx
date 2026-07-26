'use client'

import { createContext, useContext, ReactNode, useMemo } from 'react'
import { DEFAULT_CURRENCY, currencyDef, formatAmount, formatMoney, CurrencyDef } from './currency'

interface CurrencyCtx {
  code: string
  def: CurrencyDef
  /** Grouped number, no symbol - e.g. "8 500". */
  fmt: (n: number) => string
  /** Number + symbol - e.g. "8 500 MAD". */
  fmtMoney: (n: number) => string
  /** Just the symbol/short code, for labels like "Amount (MAD)". */
  symbol: string
}

const Ctx = createContext<CurrencyCtx | null>(null)

export function CurrencyProvider({ code, children }: { code: string | undefined; children: ReactNode }) {
  const value = useMemo<CurrencyCtx>(() => {
    const resolved = code || DEFAULT_CURRENCY
    return {
      code: resolved,
      def: currencyDef(resolved),
      fmt: (n: number) => formatAmount(n, resolved),
      fmtMoney: (n: number) => formatMoney(n, resolved),
      symbol: currencyDef(resolved).symbol,
    }
  }, [code])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// Safe outside a provider (e.g. the login screen) - falls back to the default.
export function useCurrency(): CurrencyCtx {
  const ctx = useContext(Ctx)
  if (ctx) return ctx
  return {
    code: DEFAULT_CURRENCY,
    def: currencyDef(DEFAULT_CURRENCY),
    fmt: (n: number) => formatAmount(n, DEFAULT_CURRENCY),
    fmtMoney: (n: number) => formatMoney(n, DEFAULT_CURRENCY),
    symbol: currencyDef(DEFAULT_CURRENCY).symbol,
  }
}
