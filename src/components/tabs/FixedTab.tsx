'use client'

import { MonthBudget, FixedExpense, displayFixedCats, categoryColor, MONEY_PLACE_LABEL } from '@/lib/store'
import { pct, catIcon, IconBadge, PBar, SectionHeader } from '@/components/ui/primitives'
import { useCurrency } from '@/lib/currency-context'
import { PlusCircle, Trash, Receipt, TrendDown, PencilSimple } from '@phosphor-icons/react/dist/ssr'

export function FixedTab({
  month, onAdd, onEdit, onDelete,
}: {
  month: MonthBudget
  onAdd: () => void
  onEdit: (e: FixedExpense) => void
  onDelete: (id: string) => void
}) {
  const { fmt, symbol } = useCurrency()
  const grandTotal = month.fixedExpenses.reduce((s, e) => s + e.amount, 0)
  const grandBase = month.fixedExpenses.reduce((s, e) => s + e.base, 0)

  const glance = displayFixedCats(month)
    .map(type => {
      const items = month.fixedExpenses.filter(e => e.type === type)
      return {
        type,
        total: items.reduce((s, e) => s + e.amount, 0),
        base: month.fixedCategoryBases[type] ?? 0,
        count: items.length,
      }
    })
    .filter(c => c.count > 0 || c.base > 0)

  return (
    <div className="space-y-4 slide-up">
      <div className="glass" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Fixed charges
          </p>
          <p className="f-display num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>
            {fmt(grandTotal)}
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--t3)', marginLeft: 4 }}>/ {fmt(grandBase)} {symbol}</span>
          </p>
          {grandBase > grandTotal && (
            <p style={{ fontSize: 11, color: 'var(--good)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendDown size={11} />{fmt(grandBase - grandTotal)} {symbol} under budget
            </p>
          )}
        </div>
        <button className="btn-primary tap" style={{ width: 'auto', padding: '10px 18px', fontSize: 13 }} onClick={onAdd}>
          <PlusCircle size={15} weight="bold" />Add
        </button>
      </div>

      {glance.length > 0 && (
        <div className="glass" style={{ padding: 20 }}>
          <SectionHeader title="At a glance" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {glance.map(c => {
              const left = c.base - c.total
              return (
                <div key={c.type} className="flex flex-col items-center text-center">
                  <IconBadge Icon={catIcon(month, c.type)} color={categoryColor(month, c.type)} size={46} />
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {c.type}
                  </p>
                  <p className="num" style={{ fontSize: 12, fontWeight: 700, marginTop: 1, color: left < 0 ? 'var(--bad)' : 'var(--t3)' }}>
                    {fmt(Math.abs(left))} {left < 0 ? 'over' : 'left'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {displayFixedCats(month).map(type => {
        const items = month.fixedExpenses.filter(e => e.type === type)
        if (!items.length) return null
        const total = items.reduce((s, e) => s + e.amount, 0)
        const base = items.reduce((s, e) => s + e.base, 0)
        return (
          <div key={type} className="glass" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <IconBadge Icon={catIcon(month, type)} color={categoryColor(month, type)} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{type}</span>
                  <span className="num" style={{ fontSize: 13, fontWeight: 700, color: categoryColor(month, type) }}>
                    {fmt(total)}<span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 400 }}> / {fmt(base)}</span>
                  </span>
                </div>
                <PBar value={pct(total, base)} color={categoryColor(month, type)} h={5} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(item => (
                <div key={item.id} className="glass-3" style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{item.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--t3)' }}>
                      {item.date}{item.place ? ` · ${MONEY_PLACE_LABEL[item.place]}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="num" style={{ fontSize: 13, fontWeight: 700, color: categoryColor(month, type) }}>{fmt(item.amount)}</p>
                    <p style={{ fontSize: 10, color: 'var(--t3)' }}>budget {fmt(item.base)}</p>
                  </div>
                  <button className="tap" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} style={{ color: 'var(--t3)', padding: 4 }}>
                    <PencilSimple size={13} />
                  </button>
                  <button className="tap" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`} style={{ color: 'var(--t3)', padding: 4 }}>
                    <Trash size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {month.fixedExpenses.length === 0 && (
        <div className="glass" style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>
          <Receipt size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>No fixed charges yet</p>
        </div>
      )}
    </div>
  )
}
