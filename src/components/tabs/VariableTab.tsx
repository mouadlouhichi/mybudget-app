'use client'

import { useState, useMemo } from 'react'
import { MonthBudget, VariableExpense, displayVariableCats, categoryColor, MONEY_PLACE_LABEL } from '@/lib/store'
import { pct, catIcon, IconBadge, PBar, SectionHeader } from '@/components/ui/primitives'
import { useCurrency } from '@/lib/currency-context'
import { PlusCircle, Trash, CaretRight, CaretDown, ChartBar, PencilSimple, MagnifyingGlass, X } from '@phosphor-icons/react/dist/ssr'

export function VariableTab({
  month, onAdd, onEdit, onDelete,
}: {
  month: MonthBudget
  onAdd: () => void
  onEdit: (e: VariableExpense) => void
  onDelete: (id: string) => void
}) {
  const { fmt, symbol } = useCurrency()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [filterCat, setFilterCat] = useState<string | null>(null)

  const cats = displayVariableCats(month)

  // Search + category filter (feature gap: unusable past ~50 entries).
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return month.variableExpenses.filter(e => {
      if (filterCat && e.type !== filterCat) return false
      if (!needle) return true
      return e.name.toLowerCase().includes(needle) || e.type.toLowerCase().includes(needle)
    })
  }, [month.variableExpenses, q, filterCat])

  const filtering = !!q.trim() || !!filterCat

  const grouped = cats
    .map(type => {
      const items = matches.filter(e => e.type === type)
      return {
        type, items,
        total: items.reduce((s, e) => s + e.amount, 0),
        base: month.variableCategoryBases[type] ?? 0,
      }
    })
    .filter(g => g.items.length > 0)

  const grandTotal = matches.reduce((s, e) => s + e.amount, 0)
  const recent = [...matches].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

  return (
    <div className="space-y-4 slide-up">
      <div className="glass" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {filtering ? 'Filtered expenses' : 'Variable expenses'}
          </p>
          <p className="f-display num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>
            {fmt(grandTotal)}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--t3)', marginLeft: 4 }}>{symbol}</span>
          </p>
        </div>
        <button className="btn-primary tap" style={{ width: 'auto', padding: '10px 18px', fontSize: 13 }} onClick={onAdd}>
          <PlusCircle size={15} weight="bold" />Add
        </button>
      </div>

      {/* Search + filter */}
      <div className="glass" style={{ padding: 14 }}>
        <div style={{ position: 'relative' }}>
          <MagnifyingGlass size={15} color="var(--t3)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="field" style={{ paddingLeft: 36, paddingRight: q ? 36 : 16 }}
            placeholder="Search expenses" value={q} onChange={e => setQ(e.target.value)} aria-label="Search expenses"
          />
          {q && (
            <button
              onClick={() => setQ('')} aria-label="Clear search" className="tap"
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', background: 'none', border: 'none' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          <button
            onClick={() => setFilterCat(null)} aria-pressed={!filterCat} className="tap"
            style={{
              padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: !filterCat ? 'var(--accent-tint)' : 'var(--surface-2)',
              border: `1px solid ${!filterCat ? 'var(--accent)' : 'var(--border)'}`,
              color: !filterCat ? 'var(--accent)' : 'var(--t2)',
            }}
          >
            All
          </button>
          {cats.map(t => {
            const on = filterCat === t
            const c = categoryColor(month, t)
            return (
              <button
                key={t} onClick={() => setFilterCat(on ? null : t)} aria-pressed={on} className="tap"
                style={{
                  padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: on ? c + '22' : 'var(--surface-2)',
                  border: `1px solid ${on ? c : 'var(--border)'}`,
                  color: on ? c : 'var(--t2)',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      <div className="glass" style={{ padding: 20 }}>
        <SectionHeader title="By category" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {grouped.map((g, idx) => (
            <div key={g.type}>
              <button
                className="tap w-full" onClick={() => setExpanded(expanded === g.type ? null : g.type)}
                aria-expanded={expanded === g.type}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                  <IconBadge Icon={catIcon(month, g.type)} color={categoryColor(month, g.type)} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{g.type}</span>
                      <div>
                        <span className="num" style={{ fontSize: 13, fontWeight: 700, color: categoryColor(month, g.type) }}>
                          {fmt(g.total)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 3 }}>/ {fmt(g.base)}</span>
                      </div>
                    </div>
                    <PBar value={pct(g.total, g.base)} color={categoryColor(month, g.type)} h={4} />
                  </div>
                  <div style={{ color: 'var(--t3)', flexShrink: 0 }}>
                    {expanded === g.type ? <CaretDown size={14} /> : <CaretRight size={14} />}
                  </div>
                </div>
              </button>
              {expanded === g.type && (
                <div className="fade-in" style={{ paddingLeft: 52, paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {g.items.map(item => (
                    <div key={item.id} className="glass-3" style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--t3)' }}>
                          {item.date}{item.place ? ` · ${MONEY_PLACE_LABEL[item.place]}` : ''}
                        </p>
                      </div>
                      <span className="num" style={{ fontSize: 13, fontWeight: 700, color: categoryColor(month, g.type) }}>
                        {fmt(item.amount)}
                      </span>
                      <button className="tap" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} style={{ color: 'var(--t3)', padding: 4 }}>
                        <PencilSimple size={13} />
                      </button>
                      <button className="tap" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`} style={{ color: 'var(--t3)', padding: 4 }}>
                        <Trash size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {idx < grouped.length - 1 && <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />}
            </div>
          ))}
          {grouped.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t3)' }}>
              <ChartBar size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>{filtering ? 'No expenses match your search' : 'No expenses yet'}</p>
            </div>
          )}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="glass" style={{ padding: 20 }}>
          <SectionHeader title="Recent" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map(item => (
              <div key={item.id} className="glass-3" style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 12 }}>
                <IconBadge Icon={catIcon(month, item.type)} color={categoryColor(month, item.type)} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{item.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--t3)' }}>
                    {item.type} · {item.date}{item.place ? ` · ${MONEY_PLACE_LABEL[item.place]}` : ''}
                  </p>
                </div>
                <span className="num" style={{ fontSize: 13, fontWeight: 700, color: categoryColor(month, item.type) }}>
                  {fmt(item.amount)}
                </span>
                <button className="tap" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} style={{ color: 'var(--t3)', padding: 4 }}>
                  <PencilSimple size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
