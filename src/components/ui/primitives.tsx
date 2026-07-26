'use client'

import type { Icon } from '@phosphor-icons/react'
import type { MonthBudget, MoneyPlace } from '@/lib/store'
import { House, Wallet, Bank } from '@phosphor-icons/react/dist/ssr'
import { ICON_BY_KEY, CAT_ICON, CAT_ICON_FALLBACK } from '@/lib/category-icons'

/* ── shared formatting/helpers ── */
export const pct = (a: number, b: number) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0)
export const today = () => new Date().toISOString().slice(0, 10)

// crypto.randomUUID where available (M8) - far more entropy than the old
// Math.random slice, with a graceful fallback for older browsers.
export const newId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID().slice(0, 12)
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export const catIcon = (month: MonthBudget, t: string): Icon => {
  const key = month.categoryIcons?.[t]
  return (key ? ICON_BY_KEY[key] : undefined) ?? CAT_ICON[t] ?? CAT_ICON_FALLBACK
}

export const MONEY_PLACE_ICON: Record<MoneyPlace, Icon> = { bank: Bank, home: House, wallet: Wallet }
export const MONEY_PLACE_TINT: Record<MoneyPlace, string> = { bank: '#00685f', home: '#575e70', wallet: '#924628' }

export function prevMonth(id: string) {
  const [y, m] = id.split('-')
  const d = new Date(parseInt(y), parseInt(m) - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export function nextMonth(id: string) {
  const [y, m] = id.split('-')
  const d = new Date(parseInt(y), parseInt(m), 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export function currentMonthId() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

/* ── ProgressBar ── */
export function PBar({ value, color = 'var(--accent)', h = 5 }: { value: number; color?: string; h?: number }) {
  const c = value >= 100 ? 'var(--bad)' : value >= 80 ? 'var(--warn)' : color
  return (
    <div className="prog" style={{ height: h }}>
      <div
        style={{
          width: `${Math.min(value, 100)}%`, height: '100%', background: c, borderRadius: 999,
          transition: 'width 0.6s cubic-bezier(.22,1,.36,1)',
        }}
      />
    </div>
  )
}

/* ── RadialProgress ── */
export function RadialProgress({
  value, size = 108, stroke = 10, color = 'var(--accent)', track = 'var(--border-2)', children,
}: {
  value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = c * (1 - clamped / 100)
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

/* ── IconBadge ── */
export function IconBadge({ Icon: Ico, color, size = 40 }: { Icon: Icon; color: string; size?: number }) {
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: -size * 0.16, borderRadius: '50%', background: color,
          opacity: 0.16, filter: `blur(${Math.max(6, size * 0.22)}px)`,
        }}
      />
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{ width: size, height: size, background: color + '20', border: `1px solid ${color}30` }}
      >
        <Ico size={size * 0.46} weight="bold" color={color} />
      </div>
    </div>
  )
}

/* ── Chip ── */
export function Chip({ label, color = 'var(--accent)', solid = false }: { label: string; color?: string; solid?: boolean }) {
  const dotColor = solid ? 'var(--t1)' : color;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '3rem',
      fontSize: '11px', fontWeight: 600, background: solid ? color : `${color}1a`, color: solid ? 'var(--t1)' : color,
      letterSpacing: '0.03em', border: `1px solid ${color}20`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      {label}
    </span>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 style={{
        fontSize: 12, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>{title}</h3>
      {action}
    </div>
  )
}

/* ── Field label ── */
export function FL({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase',
      letterSpacing: '0.07em', marginBottom: 6,
    }}>{label}</p>
  )
}

/* ── Inline field error ── */
export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p role="alert" style={{ fontSize: 11, color: 'var(--bad)', marginTop: 5 }}>{msg}</p>
}
