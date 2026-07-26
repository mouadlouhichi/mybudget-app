'use client'

import {
  MonthBudget, SavingsData, MONEY_PLACES, MONEY_PLACE_LABEL,
  moneyPlaceAmount, displayVariableCats, categoryColor,
  strategyEnvelopes, getStrategy, bucketOf,
} from '@/lib/store'
import {
  pct, catIcon, IconBadge, PBar, Chip, SectionHeader, RadialProgress,
  MONEY_PLACE_ICON, MONEY_PLACE_TINT,
} from '@/components/ui/primitives'
import { useCurrency } from '@/lib/currency-context'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis } from 'recharts'
import { Receipt, ChartBar, PiggyBank, Wallet, ArrowsDownUp } from '@phosphor-icons/react/dist/ssr'

export function OverviewTab({
  month, savings, onMoveMoney,
}: {
  month: MonthBudget; savings: SavingsData; onMoveMoney: () => void
}) {
  const { fmt, symbol } = useCurrency()

  const totalFixed = month.fixedExpenses.reduce((s, e) => s + e.amount, 0)
  const totalVar = month.variableExpenses.reduce((s, e) => s + e.amount, 0)
  // Saving goals are global - `current` is a lifetime balance, not scoped to
  // this month. Shown for context but not subtracted from remaining: the
  // money already left its money place when the goal was funded.
  const totalSaved = savings.goals.filter(g => g.active).reduce((s, g) => s + g.current, 0)
  const totalSpent = totalFixed + totalVar
  const remaining = month.totalBudget - totalSpent
  const spentPct = pct(totalSpent, month.totalBudget)

  const statusColor = spentPct >= 95 ? 'var(--bad)' : spentPct >= 75 ? 'var(--warn)' : 'var(--good)'
  const statusLabel = spentPct >= 95 ? 'Over budget' : spentPct >= 75 ? 'Watch spending' : 'On track'

  // Strategy envelopes: what the chosen method says the income should be
  // split into, measured against what's actually been spent. A category's
  // bucket - not where the cash sits - decides which envelope it draws from.
  const strategy = getStrategy(month.strategyId)
  const envelopes = strategyEnvelopes(month.totalBudget, month.strategyId)
  const spentIn = (bucket: 'needs' | 'wants') =>
    month.variableExpenses.filter(e => bucketOf(e.type, 'variable') === bucket).reduce((s, e) => s + e.amount, 0) +
    month.fixedExpenses.filter(e => bucketOf(e.type, 'fixed') === bucket).reduce((s, e) => s + e.amount, 0)

  const savingsTarget = month.monthlySavingsTarget ?? envelopes.savings
  const envelopeRows = [
    { label: 'Needs', hint: 'essentials', spent: spentIn('needs'), budget: envelopes.needs, color: 'var(--accent-dim)' },
    { label: 'Wants', hint: 'lifestyle', spent: spentIn('wants'), budget: envelopes.wants, color: 'var(--accent)' },
    { label: 'Savings', hint: 'set aside', spent: totalSaved, budget: savingsTarget, color: 'var(--good)' },
  ]

  const pieData = [
    { name: 'Fixed', value: totalFixed, color: 'var(--accent-dim)' },
    { name: 'Variable', value: totalVar, color: 'var(--accent)' },
    { name: 'Savings', value: totalSaved, color: 'var(--good)' },
    { name: 'Free', value: Math.max(0, remaining), color: 'var(--surface-3)' },
  ].filter(d => d.value > 0)

  const topCats = displayVariableCats(month)
    .map(t => ({ type: t, total: month.variableExpenses.filter(e => e.type === t).reduce((s, e) => s + e.amount, 0) }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Real cumulative spend per week of the month, derived from transaction
  // dates (B5 - this used to be a hardcoded fake curve).
  const weekBuckets = (() => {
    const [y, m] = month.id.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const all = [
      ...month.variableExpenses.map(e => ({ date: e.date, amount: e.amount })),
      ...month.fixedExpenses.filter(e => !!e.date).map(e => ({ date: e.date as string, amount: e.amount })),
    ]
    const weeks = [7, 14, 21, daysInMonth]
    let cumulative = 0
    const out = weeks.map((endDay, i) => {
      const inWeek = all.filter(e => {
        const d = Number(e.date?.slice(8, 10))
        return Number.isFinite(d) && d > (i === 0 ? 0 : weeks[i - 1]) && d <= endDay
      })
      cumulative += inWeek.reduce((s, e) => s + e.amount, 0)
      return { w: `W${i + 1}`, v: cumulative }
    })
    // Anything with an out-of-range or missing date still belongs in the total.
    const counted = out[out.length - 1]?.v ?? 0
    if (totalSpent > counted && out.length) out[out.length - 1].v = totalSpent
    return out
  })()

  const hasSpend = totalSpent > 0

  return (
    <div className="space-y-4 slide-up">
      {/* Hero */}
      <div
        className="relative"
        style={{
          borderRadius: 'var(--r-card)', padding: 24, background: 'var(--surface)',
          border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-card)', overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Wallet
          aria-hidden size={128} weight="fill" color="var(--t1)"
          style={{ position: 'absolute', top: -18, right: -18, opacity: 0.035, pointerEvents: 'none' }}
        />

        <div className="flex items-start justify-between mb-6 relative">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Total budget
            </p>
            <p className="f-display num" style={{ fontSize: 38, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1, marginTop: 4 }}>
              {fmt(month.totalBudget)}
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--t3)', marginLeft: 6 }}>{symbol}</span>
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: `color-mix(in srgb, ${statusColor} 16%, transparent)`, border: `1px solid ${statusColor}` }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
          </div>
        </div>

        <div className="relative flex items-center gap-5" style={{ marginBottom: 20 }}>
          <RadialProgress value={spentPct} color={statusColor}>
            <div style={{ textAlign: 'center' }}>
              <p className="f-display num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.05 }}>
                {fmt(Math.abs(remaining))}
              </p>
              <p style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                {remaining < 0 ? 'Over budget' : 'Left to spend'}
              </p>
            </div>
          </RadialProgress>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[
              { l: 'Fixed', v: totalFixed, c: 'var(--accent-dim)' },
              { l: 'Variable', v: totalVar, c: 'var(--accent)' },
              { l: 'Saved', v: totalSaved, c: 'var(--good)' },
            ].map(i => (
              <div key={i.l} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: i.c }} />
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>{i.l}</span>
                </div>
                <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{fmt(i.v)}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, color: 'var(--t3)' }}>Spent</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{spentPct}%</span>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-between" style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Where your money is
          </p>
          <button
            onClick={onMoveMoney} className="tap"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999,
              fontSize: 11, fontWeight: 700, background: 'var(--surface-2)',
              border: '1px solid var(--border-2)', color: 'var(--t1)',
            }}
          >
            <ArrowsDownUp size={12} weight="bold" /> Move money
          </button>
        </div>
        <div className="relative" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {MONEY_PLACES.map(p => {
            const Ico = MONEY_PLACE_ICON[p]
            const c = MONEY_PLACE_TINT[p]
            return (
              <div key={p} className="glass-2 md:hover:-translate-y-0.5" style={{ padding: '12px 10px', transition: 'transform 0.15s' }}>
                <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 7, background: c + '1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ico size={11} weight="bold" color={c} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{MONEY_PLACE_LABEL[p]}</p>
                </div>
                <p className="f-display num" style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)' }}>
                  {fmt(moneyPlaceAmount(month, p))}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Budget plan (strategy envelopes) */}
      <div className="glass" style={{ padding: 20 }}>
        <SectionHeader title="Budget plan" action={<Chip label={strategy.name} color="var(--accent)" />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {envelopeRows.map(row => {
            const p = pct(row.spent, row.budget)
            const over = row.spent > row.budget && row.budget > 0
            return (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: row.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{row.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--t3)' }}>{row.hint}</span>
                  </div>
                  <div>
                    <span className="num" style={{ fontSize: 12.5, fontWeight: 700, color: over ? 'var(--bad)' : 'var(--t1)' }}>
                      {fmt(row.spent)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}> / {fmt(row.budget)}</span>
                  </div>
                </div>
                <PBar value={p} color={row.color} h={5} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-4 md:space-y-0 space-y-4">
        <div className="md:col-span-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Fixed', val: totalFixed, Ico: Receipt, color: 'var(--accent-dim)' },
            { label: 'Variable', val: totalVar, Ico: ChartBar, color: 'var(--accent)' },
            { label: 'Saved', val: totalSaved, Ico: PiggyBank, color: 'var(--good)' },
          ].map(c => (
            <div key={c.label} className="glass md:hover:-translate-y-0.5" style={{ padding: '14px 12px', border: '1px solid var(--border)', transition: 'transform 0.15s' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <c.Ico size={15} weight="bold" color={c.color} />
              </div>
              <p className="f-display num" style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)' }}>{fmt(c.val)}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                {c.label}
              </p>
            </div>
          ))}
        </div>

        {/* Real weekly spend, not a fabricated curve */}
        <div className="glass md:col-span-1" style={{ padding: 20 }}>
          <SectionHeader title="Spend trajectory" action={<Chip label="This month" color="var(--accent)" solid />} />
          {hasSpend ? (
            <div style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekBuckets} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D9A983" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#D9A983" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="w" tick={{ fontSize: 9, fill: '#A9A9A9' }} axisLine={false} tickLine={false} />
                  <Area
                    type="monotone" dataKey="v" stroke="#D9A983" strokeWidth={2} fill="url(#g1)"
                    dot={{ r: 3, fill: '#D9A983', strokeWidth: 0 }}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 10, fontSize: 12, color: 'var(--tooltip-fg)' }}
                    formatter={(v: number) => [`${fmt(v)} ${symbol}`, 'Spent']}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 12 }}>
              Log an expense to see your trend
            </div>
          )}
        </div>

        <div className="glass md:col-span-1" style={{ padding: 20 }}>
          <SectionHeader title="Breakdown" />
          {pieData.length ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 120, height: 120, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={55} dataKey="value" strokeWidth={2} stroke="var(--surface)" paddingAngle={2}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 10, fontSize: 12, color: 'var(--tooltip-fg)' }}
                      formatter={(v: number) => [`${fmt(v)} ${symbol}`, '']} labelFormatter={() => ''}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { l: 'Fixed', v: totalFixed, c: 'var(--accent-dim)' },
                  { l: 'Variable', v: totalVar, c: 'var(--accent)' },
                  { l: 'Savings', v: totalSaved, c: 'var(--good)' },
                ].map(i => (
                  <div key={i.l}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: i.c }} />
                        <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{i.l}</span>
                      </div>
                      <span className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{fmt(i.v)}</span>
                    </div>
                    <PBar value={pct(i.v, month.totalBudget)} color={i.c} h={4} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '24px 0' }}>Nothing logged yet</p>
          )}
        </div>

        {topCats.length > 0 && (
          <div className="glass md:col-span-1" style={{ padding: 20 }}>
            <SectionHeader title="Top spending" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topCats.map(cat => (
                <div key={cat.type} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <IconBadge Icon={catIcon(month, cat.type)} color={categoryColor(month, cat.type)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{cat.type}</span>
                      <span className="num" style={{ fontSize: 13, fontWeight: 700, color: categoryColor(month, cat.type) }}>
                        {fmt(cat.total)}
                      </span>
                    </div>
                    <PBar value={pct(cat.total, month.variableCategoryBases[cat.type])} color={categoryColor(month, cat.type)} h={5} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
