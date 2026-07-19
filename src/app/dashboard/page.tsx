'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { saveMonth, subscribeMonth, getMonth, getSavings, saveSavings, subscribeSavings } from '@/lib/db'
import {
  emptyMonth, rolloverMonth, MonthBudget, VariableExpense, FixedExpense, SavingGoal, SavingsData, emptySavings,
  VARIABLE_TYPES, FIXED_TYPES, CAT_COLOR, MONEY_PLACES, MONEY_PLACE_LABEL, MoneyPlace,
  SAVING_SOURCES, SOURCE_TO_PLACE, withMoneyPlaceDelta, moneyPlaceAmount,
  displayVariableCats, displayFixedCats, categoryColor, nextPaletteColor,
} from '@/lib/store'
import { CAT_ICON, CAT_ICON_FALLBACK, ICON_BY_KEY, CUSTOM_ICON_CHOICES } from '@/lib/category-icons'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis } from 'recharts'
import {
  House, ChartBar, PiggyBank, Receipt, Gear, PlusCircle,
  Trash, Check, X, CaretRight, CaretDown, SignOut,
  Target, TrendUp, TrendDown, CaretLeft, Wallet, Bank,
  Sliders, ArrowCircleUp,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import {
  Home as LucideHome, Wallet as LucideWallet, Receipt as LucideReceipt, PiggyBank as LucidePiggyBank,
  type LucideIcon,
} from 'lucide-react'

/* ── helpers ── */
const fmt   = (n: number) => n.toLocaleString('fr-MA', { maximumFractionDigits: 0 })
const pct   = (a: number, b: number) => b ? Math.min(100, Math.round((a / b) * 100)) : 0
const uid   = () => Math.random().toString(36).slice(2, 10)
const today = () => new Date().toISOString().slice(0, 10)
const catIcon = (month: MonthBudget, t: string): Icon => {
  const key = month.categoryIcons?.[t]
  return (key ? ICON_BY_KEY[key] : undefined) ?? CAT_ICON[t] ?? CAT_ICON_FALLBACK
}
const MONEY_PLACE_ICON: Record<MoneyPlace, Icon> = { bank: Bank, home: House, wallet: Wallet }
const MONEY_PLACE_TINT: Record<MoneyPlace, string> = { bank: '#7B9E8E', home: '#D6A75C', wallet: '#C9695A' }

function prevMonth(id: string) {
  const [y, m] = id.split('-')
  const d = new Date(parseInt(y), parseInt(m) - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function nextMonth(id: string) {
  const [y, m] = id.split('-')
  const d = new Date(parseInt(y), parseInt(m), 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function currentMonthId() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

/* ── ProgressBar ── */
function PBar({ value, color = 'var(--accent)', h = 5 }: { value: number; color?: string; h?: number }) {
  const c = value >= 100 ? 'var(--bad)' : value >= 80 ? 'var(--warn)' : color
  return (
    <div className="prog" style={{ height: h }}>
      <div style={{ width: `${Math.min(value,100)}%`, height:'100%', background: c, borderRadius: 999,
        transition: 'width 0.6s cubic-bezier(.22,1,.36,1)' }} />
    </div>
  )
}

/* ── RadialProgress - circular gauge with centered content ── */
function RadialProgress({ value, size = 108, stroke = 10, color = 'var(--accent)', track = 'var(--border-2)', children }:
  { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = c * (1 - clamped / 100)
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.22,1,.36,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

/* ── IconBadge - Phosphor icon, one family, circular with a soft tinted glow ── */
function IconBadge({ Icon: Ico, color, size = 40 }: { Icon: Icon; color: string; size?: number }) {
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <div aria-hidden style={{ position:'absolute', inset: -size*0.16, borderRadius:'50%', background: color, opacity: 0.16, filter: `blur(${Math.max(6,size*0.22)}px)` }} />
      <div className="relative flex items-center justify-center rounded-full"
        style={{ width: size, height: size, background: color + '20', border: `1px solid ${color}30` }}>
        <Ico size={size * 0.46} weight="bold" color={color} />
      </div>
    </div>
  )
}

/* ── Chip ── */
function Chip({ label, color = 'var(--accent)', solid = false }: { label: string; color?: string; solid?: boolean }) {
  return solid
    ? <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:700, background: color, color:'var(--t1)', letterSpacing:'0.04em' }}>{label}</span>
    : <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:700, background: color+'22', color, letterSpacing:'0.04em' }}>{label}</span>
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</h3>
      {action}
    </div>
  )
}

/* ── Modal shell ── */
// Rendered via a portal straight into document.body. Nesting a `position:
// fixed` sheet inside a scrollable ancestor (our content area is
// overflow-y-auto) is unreliable on mobile Safari/Chrome - the sheet can end
// up positioned against the scrolled content instead of the viewport, which
// is what made it look "stuck at the top, hidden behind the header". A
// portal guarantees it's a direct child of <body> and always pinned to the
// bottom of the real viewport.
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center fade-in"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-md slide-up" onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border-2)', borderBottom: 'none', maxHeight: '92dvh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <h2 className="f-display" style={{ fontWeight: 700, fontSize: 17, color: 'var(--t1)' }}>{title}</h2>
          <button onClick={onClose} className="tap flex items-center justify-center w-8 h-8 rounded-full glass-3">
            <X size={15} color="var(--t2)" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">{children}</div>
        <div style={{ height: 28 }} />
      </div>
    </div>,
    document.body
  )
}

function FL({ label }: { label: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</p>
}

/* ── Add Variable ── */
function AddVarModal({ month, onClose, onAdd }: { month: MonthBudget; onClose: () => void; onAdd: (e: Omit<VariableExpense,'id'>) => void }) {
  const cats = displayVariableCats(month)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<string>(cats[0] ?? 'Autre')
  const [date, setDate] = useState(today())
  return (
    <Modal title="New Expense" onClose={onClose}>
      <div>
        <FL label="Category" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {cats.map(t => {
            const Ico = catIcon(month, t)
            const c = categoryColor(month, t)
            return (
              <button key={t} onClick={() => setType(t)} className="tap flex flex-col items-center gap-1.5 py-2.5 rounded-xl"
                style={{ background: type===t ? c+'22':'var(--surface-2)', border:`1.5px solid ${type===t?c:'var(--border)'}` }}>
                <Ico size={18} weight="bold" color={type===t?c:'var(--t3)'} />
                <span style={{ fontSize: 8, fontWeight: 700, color: type===t?c:'var(--t3)', textAlign:'center', lineHeight:1.2 }}>{t}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div><FL label="Description" /><input className="field" placeholder="What did you spend on" value={name} onChange={e=>setName(e.target.value)} autoFocus /></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div><FL label="Amount (MAD)" /><input className="field" type="number" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)} /></div>
        <div><FL label="Date" /><input className="field" type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
      </div>
      <button className="btn-primary tap" onClick={() => { if (!name||!amount) return; onAdd({name,amount:parseFloat(amount),type,date}); onClose() }}>
        <PlusCircle size={16} weight="bold" /> Add Expense
      </button>
    </Modal>
  )
}

/* ── Add Fixed ── */
function AddFixedModal({ month, onClose, onAdd }: { month: MonthBudget; onClose: () => void; onAdd: (e: Omit<FixedExpense,'id'>) => void }) {
  const cats = displayFixedCats(month)
  const [name, setName]=useState(''); const [amount, setAmount]=useState(''); const [base,setBase]=useState('')
  const [type,setType]=useState<string>(cats[0] ?? 'Autre'); const [date,setDate]=useState(today())
  return (
    <Modal title="New Fixed Charge" onClose={onClose}>
      <div><FL label="Type"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {cats.map(t=>{
            const Ico = catIcon(month, t)
            const c = categoryColor(month, t)
            return (
              <button key={t} onClick={()=>setType(t)} className="tap flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{background:type===t?c+'22':'var(--surface-2)',border:`1.5px solid ${type===t?c:'var(--border)'}`}}>
                <Ico size={15} weight="bold" color={type===t?c:'var(--t2)'} />
                <span style={{fontSize:11,fontWeight:700,color:type===t?c:'var(--t2)'}}>{t}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div><FL label="Name"/><input className="field" placeholder="e.g. Electricity" value={name} onChange={e=>setName(e.target.value)} autoFocus/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div><FL label="Actual (MAD)"/><input className="field" type="number" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
        <div><FL label="Budget (MAD)"/><input className="field" type="number" placeholder="0" value={base} onChange={e=>setBase(e.target.value)}/></div>
      </div>
      <div><FL label="Date"/><input className="field" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
      <button className="btn-primary tap" onClick={()=>{if(!name||!amount)return;onAdd({name,amount:parseFloat(amount),type,base:parseFloat(base)||parseFloat(amount),date});onClose()}}>
        <PlusCircle size={16} weight="bold"/> Add Fixed Charge
      </button>
    </Modal>
  )
}

/* ── Add Saving ── */
function AddSavingModal({ month, onClose, onAdd }: { month: MonthBudget; onClose:()=>void; onAdd:(g:Omit<SavingGoal,'id'>)=>void }) {
  const [name,setName]=useState(''); const [target,setTarget]=useState(''); const [current,setCurrent]=useState('')
  const [source,setSource]=useState<typeof SAVING_SOURCES[number]>('HOME')
  return (
    <Modal title="New Saving Goal" onClose={onClose}>
      <div><FL label="Goal Name"/><input className="field" placeholder="e.g. Vacation, Emergency fund" value={name} onChange={e=>setName(e.target.value)} autoFocus/></div>
      <div><FL label="Fund it from"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {SAVING_SOURCES.map(s=>(
            <button key={s} onClick={()=>setSource(s)} className="tap py-2.5 rounded-xl"
              style={{fontSize:11,fontWeight:700,background:source===s?'var(--accent-tint)':'var(--surface-2)',border:`1.5px solid ${source===s?'var(--accent)':'var(--border)'}`,color:source===s?'var(--accent)':'var(--t2)'}}>
              {MONEY_PLACE_LABEL[SOURCE_TO_PLACE[s]]}
              <div style={{fontSize:9,fontWeight:600,color:'var(--t3)',marginTop:2}}>{fmt(moneyPlaceAmount(month,SOURCE_TO_PLACE[s]))} avail.</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div><FL label="Target (MAD)"/><input className="field" type="number" placeholder="0" value={target} onChange={e=>setTarget(e.target.value)}/></div>
        <div><FL label="Fund now with"/><input className="field" type="number" placeholder="0" value={current} onChange={e=>setCurrent(e.target.value)}/></div>
      </div>
      <p style={{fontSize:11,color:'var(--t3)'}}>Whatever you fund now moves out of the money place above and into this goal.</p>
      <button className="btn-primary tap" onClick={()=>{if(!name||!target)return;onAdd({name,target:parseFloat(target),current:parseFloat(current)||0,source,active:parseFloat(current)>0});onClose()}}>
        <PlusCircle size={16} weight="bold"/> Create Goal
      </button>
    </Modal>
  )
}

/* ── Add Funds to an existing Saving Goal ── */
function AddFundsModal({ month, goal, onClose, onAdd }: { month: MonthBudget; goal: SavingGoal; onClose: () => void; onAdd: (amount: number, place: MoneyPlace) => void }) {
  const [amount, setAmount] = useState('')
  const [place, setPlace] = useState<MoneyPlace>(SOURCE_TO_PLACE[goal.source])
  const amt = parseFloat(amount) || 0
  const insufficient = amt > moneyPlaceAmount(month, place)
  return (
    <Modal title={`Add to "${goal.name}"`} onClose={onClose}>
      <div><FL label="From money place" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {MONEY_PLACES.map(p => (
            <button key={p} onClick={() => setPlace(p)} className="tap py-2.5 rounded-xl"
              style={{ fontSize: 11, fontWeight: 700, background: place===p?'var(--accent-tint)':'var(--surface-2)', border:`1.5px solid ${place===p?'var(--accent)':'var(--border)'}`, color: place===p?'var(--accent)':'var(--t2)' }}>
              {MONEY_PLACE_LABEL[p]}
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--t3)', marginTop: 2 }}>{fmt(moneyPlaceAmount(month, p))} avail.</div>
            </button>
          ))}
        </div>
      </div>
      <div><FL label="Amount (MAD)" /><input className="field" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus /></div>
      {insufficient && <p style={{ fontSize: 11, color: 'var(--bad)' }}>That's more than what's currently in {MONEY_PLACE_LABEL[place]}.</p>}
      <button className="btn-primary tap" disabled={!amt || insufficient} onClick={() => { onAdd(amt, place); onClose() }}>
        <ArrowCircleUp size={16} weight="bold" /> Add Funds
      </button>
    </Modal>
  )
}
function SettingsModal({ month, user, onClose, onSave, onSignOut, onManageCategories }: { month: MonthBudget; user: any; onClose:()=>void; onSave:(p:Partial<MonthBudget>)=>void; onSignOut:()=>void; onManageCategories:()=>void }) {
  const [total,setTotal]=useState(String(month.totalBudget))
  const [bank,setBank]=useState(String(month.bankPart))
  const [home,setHome]=useState(String(month.homePart))
  const [wallet,setWallet]=useState(String(month.walletPart))
  const varCats = displayVariableCats(month)
  const fixedCats = displayFixedCats(month)
  const [varBases,setVarBases]=useState<Record<string,string>>(
    Object.fromEntries(varCats.map(t=>[t,String(month.variableCategoryBases[t]??0)]))
  )
  const [fixedBases,setFixedBases]=useState<Record<string,string>>(
    Object.fromEntries(fixedCats.map(t=>[t,String(month.fixedCategoryBases[t]??0)]))
  )
  const [showCats,setShowCats]=useState(false)

  function save() {
    const nextVarBases = { ...month.variableCategoryBases }
    varCats.forEach(t => { const v = parseFloat(varBases[t]); if (!isNaN(v)) nextVarBases[t] = v })
    const nextFixedBases = { ...month.fixedCategoryBases }
    fixedCats.forEach(t => { const v = parseFloat(fixedBases[t]); if (!isNaN(v)) nextFixedBases[t] = v })
    onSave({
      totalBudget: parseFloat(total) || month.totalBudget,
      bankPart: parseFloat(bank) || 0,
      homePart: parseFloat(home) || 0,
      walletPart: parseFloat(wallet) || 0,
      variableCategoryBases: nextVarBases,
      fixedCategoryBases: nextFixedBases,
    })
    onClose()
  }

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="glass-2 p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{background:'var(--accent)'}}>
          {user?.photoURL
            ? <img src={user.photoURL} className="w-12 h-12 rounded-full object-cover" alt="avatar"/>
            : <span className="f-display" style={{fontSize:18,fontWeight:700,color:'var(--accent-ink)'}}>{(user?.displayName||'U')[0]?.toUpperCase()}</span>}
        </div>
        <div className="flex-1">
          <p style={{fontWeight:700,fontSize:15,color:'var(--t1)'}}>{user?.displayName || 'User'}</p>
          <p style={{fontSize:12,color:'var(--t2)'}}>{user?.email}</p>
        </div>
        <Chip label="FREE" color="var(--accent)" solid/>
      </div>
      <div><FL label="Total Monthly Budget (MAD)"/><input className="field" type="number" value={total} onChange={e=>setTotal(e.target.value)}/></div>
      <div><FL label="Money places"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <div><FL label="Bank"/><input className="field" type="number" value={bank} onChange={e=>setBank(e.target.value)}/></div>
          <div><FL label="Home"/><input className="field" type="number" value={home} onChange={e=>setHome(e.target.value)}/></div>
          <div><FL label="Wallet"/><input className="field" type="number" value={wallet} onChange={e=>setWallet(e.target.value)}/></div>
        </div>
      </div>

      <button className="tap flex items-center justify-between w-full glass-2" style={{padding:'12px 14px'}} onClick={onManageCategories}>
        <span style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:700,color:'var(--t1)'}}><Sliders size={15}/>Manage categories</span>
        <CaretRight size={14} color="var(--t3)"/>
      </button>

      <button className="tap flex items-center justify-between w-full glass-2" style={{padding:'12px 14px'}} onClick={()=>setShowCats(s=>!s)}>
        <span style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>Category budgets</span>
        {showCats ? <CaretDown size={14} color="var(--t3)"/> : <CaretRight size={14} color="var(--t3)"/>}
      </button>
      {showCats && (
        <div className="fade-in" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <FL label="Variable categories"/>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {varCats.map(t=>(
                <div key={t} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{flex:1,fontSize:12,color:'var(--t2)'}}>{t}</span>
                  <input className="field" type="number" style={{width:100,padding:'8px 10px'}}
                    value={varBases[t]??'0'} onChange={e=>setVarBases(b=>({...b,[t]:e.target.value}))}/>
                </div>
              ))}
            </div>
          </div>
          <div>
            <FL label="Fixed categories"/>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {fixedCats.map(t=>(
                <div key={t} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{flex:1,fontSize:12,color:'var(--t2)'}}>{t}</span>
                  <input className="field" type="number" style={{width:100,padding:'8px 10px'}}
                    value={fixedBases[t]??'0'} onChange={e=>setFixedBases(b=>({...b,[t]:e.target.value}))}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button className="btn-primary tap" onClick={save}>
        <Check size={16} weight="bold"/> Save Settings
      </button>
      <div className="glass-2 p-4 flex items-center gap-3" style={{border:'1px solid var(--border-2)'}}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'var(--accent-tint)'}}>
          <TrendUp size={17} weight="bold" color="var(--accent)"/>
        </div>
        <div className="flex-1">
          <p style={{fontWeight:700,fontSize:13,color:'var(--t1)'}}>Upgrade to Pro</p>
          <p style={{fontSize:11,color:'var(--t2)'}}>Unlimited months, insights, export - coming soon</p>
        </div>
        <button disabled className="tap" title="Pro plan launching soon"
          style={{background:'var(--accent)',color:'var(--accent-ink)',padding:'7px 14px',borderRadius:999,fontSize:12,fontWeight:700,whiteSpace:'nowrap',border:'none',opacity:0.55,cursor:'not-allowed'}}>
          Soon
        </button>
      </div>
      <button onClick={onSignOut} className="btn-ghost tap w-full">
        <SignOut size={15} weight="bold"/> Sign out
      </button>
    </Modal>
  )
}

/* ── Manage Categories Modal ── */
function ManageCategoriesModal({ month, onClose, onSave }: { month: MonthBudget; onClose: () => void; onSave: (p: Partial<MonthBudget>) => void }) {
  const [kind, setKind] = useState<'variable'|'fixed'>('variable')
  const [activeVar, setActiveVar] = useState<string[]>(month.activeVariableCategories?.length ? month.activeVariableCategories : VARIABLE_TYPES)
  const [activeFixed, setActiveFixed] = useState<string[]>(month.activeFixedCategories?.length ? month.activeFixedCategories : FIXED_TYPES)
  const [colors, setColors] = useState<Record<string,string>>(month.categoryColors || {})
  const [icons, setIcons] = useState<Record<string,string>>(month.categoryIcons || {})
  const [newName, setNewName] = useState('')
  const [newIconKey, setNewIconKey] = useState('package')
  const [iconPickerFor, setIconPickerFor] = useState<'new'|string|null>(null)

  const isVar = kind === 'variable'
  const active = isVar ? activeVar : activeFixed
  const setActive = isVar ? setActiveVar : setActiveFixed
  const base = isVar ? VARIABLE_TYPES : FIXED_TYPES
  const usedInExpenses = isVar ? month.variableExpenses.map(e=>e.type) : month.fixedExpenses.map(e=>e.type)
  const all = Array.from(new Set([...base, ...active, ...usedInExpenses]))

  function toggle(t: string) {
    setActive(a => a.includes(t) ? a.filter(x=>x!==t) : [...a, t])
  }
  function removeCustom(t: string) {
    if (typeof window !== 'undefined' && !window.confirm(`Remove category "${t}"? Existing expenses keep it, but it won't be selectable anymore.`)) return
    setActive(a => a.filter(x=>x!==t))
  }
  function pickIcon(key: string) {
    if (iconPickerFor === 'new') setNewIconKey(key)
    else if (iconPickerFor) setIcons(ic => ({ ...ic, [iconPickerFor]: key }))
    setIconPickerFor(null)
  }
  function addCategory() {
    const name = newName.trim()
    if (!name || all.includes(name)) return
    const color = colors[name] ?? nextPaletteColor({ ...month, categoryColors: colors })
    setColors(c => ({ ...c, [name]: color }))
    setIcons(ic => ({ ...ic, [name]: newIconKey }))
    setActive(a => [...a, name])
    setNewName('')
    setNewIconKey('package')
  }

  function save() {
    onSave({ activeVariableCategories: activeVar, activeFixedCategories: activeFixed, categoryColors: colors, categoryIcons: icons })
    onClose()
  }

  return (
    <Modal title="Manage Categories" onClose={onClose}>
      <div style={{display:'flex',gap:8}}>
        {(['variable','fixed'] as const).map(k=>(
          <button key={k} onClick={()=>setKind(k)} className="tap" style={{flex:1,padding:'9px 0',borderRadius:'var(--r-field)',
            background:kind===k?'var(--accent-tint)':'var(--surface-2)',border:`1.5px solid ${kind===k?'var(--accent)':'var(--border)'}`,
            fontSize:12,fontWeight:700,color:kind===k?'var(--accent)':'var(--t2)'}}>
            {k==='variable'?'Expense categories':'Fixed bill categories'}
          </button>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {all.map(t=>{
          const isOn = active.includes(t)
          const isCustom = !base.includes(t)
          const c = colors[t] ?? CAT_COLOR[t] ?? '#8A8175'
          const iconKey = icons[t]
          const Ico = (iconKey ? ICON_BY_KEY[iconKey] : undefined) ?? CAT_ICON[t] ?? CAT_ICON_FALLBACK
          return (
            <div key={t} className="glass-2" style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',opacity:isOn?1:0.5}}>
              <button onClick={()=>isCustom && setIconPickerFor(t)} className={isCustom?'tap':undefined}
                title={isCustom?'Change icon':undefined}
                style={{width:26,height:26,borderRadius:8,background:c+'22',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'none',cursor:isCustom?'pointer':'default'}}>
                <Ico size={13} weight="bold" color={c}/>
              </button>
              <span style={{flex:1,fontSize:13,fontWeight:600,color:'var(--t1)'}}>{t}{isCustom && <span style={{fontSize:9,fontWeight:700,color:'var(--t3)'}}> · custom</span>}</span>
              <button onClick={()=>toggle(t)} className="tap" style={{width:38,height:22,borderRadius:999,background:isOn?'var(--accent)':'var(--surface-3)',position:'relative',border:'none',flexShrink:0}}>
                <div style={{width:16,height:16,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:isOn?19:3,transition:'left 0.15s'}}/>
              </button>
              {isCustom && (
                <button onClick={()=>removeCustom(t)} className="tap" style={{color:'var(--t3)',padding:4,flexShrink:0}}><Trash size={13}/></button>
              )}
            </div>
          )
        })}
      </div>

      <div style={{display:'flex',gap:8}}>
        <button onClick={()=>setIconPickerFor('new')} className="tap" title="Choose an icon"
          style={{width:44,height:44,borderRadius:'var(--r-field)',background:'var(--surface-2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          {(() => { const Ico = ICON_BY_KEY[newIconKey] ?? CAT_ICON_FALLBACK; return <Ico size={18} weight="bold" color="var(--t2)"/> })()}
        </button>
        <input className="field" placeholder={`New ${isVar?'expense':'fixed bill'} category`} value={newName}
          onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addCategory()}}} />
        <button onClick={addCategory} className="btn-primary tap" style={{width:'auto',padding:'0 16px'}}><PlusCircle size={16} weight="bold"/></button>
      </div>

      {iconPickerFor && (
        <div className="glass-2 fade-in" style={{padding:12}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:'var(--t2)'}}>Choose an icon</span>
            <button onClick={()=>setIconPickerFor(null)} className="tap" style={{color:'var(--t3)'}}><X size={14}/></button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,maxHeight:190,overflowY:'auto'}}>
            {CUSTOM_ICON_CHOICES.map(c=>{
              const selected = (iconPickerFor==='new' ? newIconKey : icons[iconPickerFor]) === c.key
              return (
                <button key={c.key} onClick={()=>pickIcon(c.key)} className="tap" title={c.label}
                  style={{aspectRatio:'1',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',
                    background:selected?'var(--accent-tint)':'var(--surface-2)',border:`1.5px solid ${selected?'var(--accent)':'var(--border)'}`}}>
                  <c.Icon size={16} weight="bold" color={selected?'var(--accent)':'var(--t2)'}/>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button className="btn-primary tap" onClick={save}>
        <Check size={16} weight="bold"/> Save Categories
      </button>
    </Modal>
  )
}

/* ══════════════════════ OVERVIEW ══════════════════════ */
function Overview({ month, savings }: { month: MonthBudget; savings: SavingsData }) {
  const totalFixed = month.fixedExpenses.reduce((s,e)=>s+e.amount,0)
  const totalVar   = month.variableExpenses.reduce((s,e)=>s+e.amount,0)
  // Saving goals are global - their `current` balance is a lifetime total,
  // not something scoped to the month being viewed. It's shown here for
  // context but isn't subtracted from this month's remaining budget: money
  // moved into a goal already left its money place (see topUpSaving), so
  // subtracting it again here would double-count it and make "remaining"
  // shrink every month even with no new spending.
  const totalSaved = savings.goals.filter(g=>g.active).reduce((s,g)=>s+g.current,0)
  const totalSpent = totalFixed + totalVar
  const remaining  = month.totalBudget - totalSpent
  const spentPct   = pct(totalSpent, month.totalBudget)

  const statusColor = spentPct>=95?'var(--bad)':spentPct>=75?'var(--warn)':'var(--good)'
  const statusLabel = spentPct>=95?'Over budget':spentPct>=75?'Watch spending':'On track'

  const pieData = [
    {name:'Fixed',value:totalFixed,color:'var(--accent-dim)'},
    {name:'Variable',value:totalVar,color:'var(--accent)'},
    {name:'Savings',value:totalSaved,color:'var(--good)'},
    {name:'Free',value:Math.max(0,remaining),color:'var(--surface-3)'},
  ].filter(d=>d.value>0)

  const topCats = displayVariableCats(month)
    .map(t=>({type:t,total:month.variableExpenses.filter(e=>e.type===t).reduce((s,e)=>s+e.amount,0)}))
    .filter(c=>c.total>0).sort((a,b)=>b.total-a.total).slice(0,5)

  const sparkData = [
    {w:'W1',v:Math.round(totalSpent*0.18)},
    {w:'W2',v:Math.round(totalSpent*0.35)},
    {w:'W3',v:Math.round(totalSpent*0.56)},
    {w:'W4',v:Math.round(totalSpent*0.82)},
    {w:'Now',v:totalSpent},
  ]

  return (
    <div className="space-y-4 slide-up">
      {/* Hero card - solid off-black card, subtle accent glow + watermark for depth without a full gradient wash */}
      <div className="relative" style={{borderRadius:'var(--r-card)',padding:24,background:'var(--surface)',border:'1px solid var(--border-2)',boxShadow:'var(--shadow-card)',overflow:'hidden'}}>
        <div aria-hidden style={{position:'absolute',top:-60,right:-60,width:180,height:180,borderRadius:'50%',
          background:'radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 70%)',pointerEvents:'none'}}/>
        <Wallet aria-hidden size={128} weight="fill" color="var(--t1)"
          style={{position:'absolute',top:-18,right:-18,opacity:0.035,pointerEvents:'none'}}/>

        <div className="flex items-start justify-between mb-6 relative">
          <div>
            <p style={{fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Total Budget</p>
            <p className="f-display num" style={{fontSize:38,fontWeight:700,color:'var(--t1)',lineHeight:1.1,marginTop:4}}>
              {fmt(month.totalBudget)}
              <span style={{fontSize:16,fontWeight:500,color:'var(--t3)',marginLeft:6}}>MAD</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{background:`color-mix(in srgb, ${statusColor} 16%, transparent)`,border:`1px solid ${statusColor}`}}>
            <div className="w-1.5 h-1.5 rounded-full" style={{background:statusColor}}/>
            <span style={{fontSize:11,fontWeight:700,color:statusColor}}>{statusLabel}</span>
          </div>
        </div>

        <div className="relative flex items-center gap-5" style={{marginBottom:20}}>
          <RadialProgress value={spentPct} color={statusColor}>
            <div style={{textAlign:'center'}}>
              <p className="f-display num" style={{fontSize:20,fontWeight:700,color:'var(--t1)',lineHeight:1.05}}>{fmt(Math.abs(remaining))}</p>
              <p style={{fontSize:8.5,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.06em',marginTop:2}}>
                {remaining<0?'Over budget':'Left to spend'}
              </p>
            </div>
          </RadialProgress>
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:9}}>
            {[{l:'Fixed',v:totalFixed,c:'var(--accent-dim)'},{l:'Variable',v:totalVar,c:'var(--accent)'},{l:'Saved',v:totalSaved,c:'var(--good)'}].map(i=>(
              <div key={i.l} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div style={{width:7,height:7,borderRadius:'50%',background:i.c}}/>
                  <span style={{fontSize:12,color:'var(--t2)'}}>{i.l}</span>
                </div>
                <span className="num" style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>{fmt(i.v)}</span>
              </div>
            ))}
            <div style={{height:1,background:'var(--border)',margin:'2px 0'}}/>
            <div className="flex items-center justify-between">
              <span style={{fontSize:12,color:'var(--t3)'}}>Spent</span>
              <span style={{fontSize:12,fontWeight:700,color:statusColor}}>{spentPct}%</span>
            </div>
          </div>
        </div>

        <div className="relative" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {MONEY_PLACES.map(p=>{
            const Ico = MONEY_PLACE_ICON[p]
            const c = MONEY_PLACE_TINT[p]
            return (
              <div key={p} className="glass-2 md:hover:-translate-y-0.5" style={{padding:'12px 10px',transition:'transform 0.15s'}}>
                <div className="flex items-center gap-1.5" style={{marginBottom:8}}>
                  <div style={{width:20,height:20,borderRadius:7,background:c+'1f',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Ico size={11} weight="bold" color={c}/>
                  </div>
                  <p style={{fontSize:11,color:'var(--t3)',fontWeight:600}}>{MONEY_PLACE_LABEL[p]}</p>
                </div>
                <p className="f-display num" style={{fontSize:17,fontWeight:700,color:'var(--t1)'}}>{fmt(moneyPlaceAmount(month,p))}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Desktop: side-by-side with stat tiles + trajectory */}
      <div className="md:grid md:grid-cols-3 md:gap-4 md:space-y-0 space-y-4">
      {/* 3 stat tiles */}
      <div className="md:col-span-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[
          {label:'Fixed',val:totalFixed,Ico:Receipt,color:'var(--accent-dim)'},
          {label:'Variable',val:totalVar,Ico:ChartBar,color:'var(--accent)'},
          {label:'Saved',val:totalSaved,Ico:PiggyBank,color:'var(--good)'},
        ].map(c=>(
          <div key={c.label} className="glass md:hover:-translate-y-0.5" style={{padding:'14px 12px',border:'1px solid var(--border)',transition:'transform 0.15s'}}>
            <div style={{width:32,height:32,borderRadius:10,background:c.color+'22',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
              <c.Ico size={15} weight="bold" color={c.color}/>
            </div>
            <p className="f-display num" style={{fontSize:17,fontWeight:700,color:'var(--t1)'}}>{fmt(c.val)}</p>
            <p style={{fontSize:10,fontWeight:600,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.05em',marginTop:2}}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Spend trajectory */}
      <div className="glass md:col-span-1" style={{padding:20}}>
        <SectionHeader title="Spend Trajectory" action={<Chip label="This Month" color="var(--accent)" solid/>}/>
        <div style={{height:80}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{top:4,right:4,left:4,bottom:0}}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D9A983" stopOpacity={0.45}/>
                  <stop offset="100%" stopColor="#D9A983" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="w" tick={{fontSize:9,fill:'#A9A9A9'}} axisLine={false} tickLine={false}/>
              <Area type="monotone" dataKey="v" stroke="#D9A983" strokeWidth={2} fill="url(#g1)"
                dot={{r:3,fill:'#D9A983',strokeWidth:0}}/>
              <Tooltip contentStyle={{background:'#262626',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,fontSize:12,color:'#FFFFFF'}}
                formatter={(v:number)=>[`${fmt(v)} MAD`,'Spent']}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown donut */}
      <div className="glass md:col-span-1" style={{padding:20}}>
        <SectionHeader title="Breakdown"/>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{width:120,height:120,flexShrink:0}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={55}
                  dataKey="value" strokeWidth={2} stroke="#FFFFFF" paddingAngle={2}>
                  {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'#262626',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,fontSize:12,color:'#FFFFFF'}}
                  formatter={(v:number)=>[`${fmt(v)} MAD`,'']} labelFormatter={()=>''}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:10}}>
            {[{l:'Fixed',v:totalFixed,c:'var(--accent-dim)'},{l:'Variable',v:totalVar,c:'var(--accent)'},{l:'Savings',v:totalSaved,c:'var(--good)'}].map(i=>(
              <div key={i.l}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:i.c}}/>
                    <span style={{fontSize:12,color:'var(--t2)',fontWeight:500}}>{i.l}</span>
                  </div>
                  <span className="num" style={{fontSize:12,fontWeight:700,color:'var(--t1)'}}>{fmt(i.v)}</span>
                </div>
                <PBar value={pct(i.v,month.totalBudget)} color={i.c} h={4}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top categories */}
      {topCats.length>0&&(
        <div className="glass md:col-span-1" style={{padding:20}}>
          <SectionHeader title="Top Spending"/>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {topCats.map(cat=>(
              <div key={cat.type} style={{display:'flex',alignItems:'center',gap:12}}>
                <IconBadge Icon={catIcon(month, cat.type)} color={categoryColor(month,cat.type)}/>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:13,fontWeight:600,color:'var(--t1)'}}>{cat.type}</span>
                    <span className="num" style={{fontSize:13,fontWeight:700,color:categoryColor(month,cat.type)}}>{fmt(cat.total)} MAD</span>
                  </div>
                  <PBar value={pct(cat.total,month.variableCategoryBases[cat.type])} color={categoryColor(month,cat.type)} h={5}/>
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

/* ══════════════════════ VARIABLE ══════════════════════ */
function VariableTab({ month, onAdd, onDelete }:{month:MonthBudget;onAdd:(e:Omit<VariableExpense,'id'>)=>void;onDelete:(id:string)=>void}) {
  const [showAdd,setShowAdd]=useState(false)
  const [expanded,setExpanded]=useState<string|null>(null)
  const grouped=displayVariableCats(month).map(type=>{
    const items=month.variableExpenses.filter(e=>e.type===type)
    const total=items.reduce((s,e)=>s+e.amount,0)
    return{type,items,total,base:month.variableCategoryBases[type]??0}
  }).filter(g=>g.items.length>0)
  const grandTotal=month.variableExpenses.reduce((s,e)=>s+e.amount,0)
  const recent=[...month.variableExpenses].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10)

  return (
    <div className="space-y-4 slide-up">
      <div className="glass" style={{padding:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.07em'}}>Variable Expenses</p>
          <p className="f-display num" style={{fontSize:30,fontWeight:700,color:'var(--t1)',marginTop:2}}>
            {fmt(grandTotal)}<span style={{fontSize:14,fontWeight:400,color:'var(--t3)',marginLeft:4}}>MAD</span>
          </p>
        </div>
        <button className="btn-primary tap" style={{width:'auto',padding:'10px 18px',fontSize:13}} onClick={()=>setShowAdd(true)}>
          <PlusCircle size={15} weight="bold"/>Add
        </button>
      </div>

      <div className="glass" style={{padding:20}}>
        <SectionHeader title="By Category"/>
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          {grouped.map((g,idx)=>(
            <div key={g.type}>
              <button className="tap w-full" onClick={()=>setExpanded(expanded===g.type?null:g.type)}>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0'}}>
                  <IconBadge Icon={catIcon(month, g.type)} color={categoryColor(month,g.type)}/>
                  <div style={{flex:1,textAlign:'left'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:5}}>
                      <span style={{fontSize:13,fontWeight:600,color:'var(--t1)'}}>{g.type}</span>
                      <div>
                        <span className="num" style={{fontSize:13,fontWeight:700,color:categoryColor(month,g.type)}}>{fmt(g.total)}</span>
                        <span style={{fontSize:11,color:'var(--t3)',marginLeft:3}}>/ {fmt(g.base)}</span>
                      </div>
                    </div>
                    <PBar value={pct(g.total,g.base)} color={categoryColor(month,g.type)} h={4}/>
                  </div>
                  <div style={{color:'var(--t3)',flexShrink:0}}>
                    {expanded===g.type?<CaretDown size={14}/>:<CaretRight size={14}/>}
                  </div>
                </div>
              </button>
              {expanded===g.type&&(
                <div className="fade-in" style={{paddingLeft:52,paddingBottom:8,display:'flex',flexDirection:'column',gap:4}}>
                  {g.items.map(item=>(
                    <div key={item.id} className="glass-3" style={{display:'flex',alignItems:'center',padding:'10px 12px',gap:10}}>
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,fontWeight:600,color:'var(--t1)'}}>{item.name}</p>
                        {item.date&&<p style={{fontSize:11,color:'var(--t3)'}}>{item.date}</p>}
                      </div>
                      <span className="num" style={{fontSize:13,fontWeight:700,color:categoryColor(month,g.type)}}>{fmt(item.amount)}</span>
                      <button className="tap" onClick={()=>onDelete(item.id)} style={{color:'var(--t3)',padding:4}}>
                        <Trash size={13}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {idx<grouped.length-1&&<div style={{height:1,background:'var(--border)',margin:'2px 0'}}/>}
            </div>
          ))}
          {grouped.length===0&&(
            <div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)'}}>
              <ChartBar size={28} style={{margin:'0 auto 8px',opacity:.3}}/>
              <p style={{fontSize:13}}>No expenses yet</p>
            </div>
          )}
        </div>
      </div>

      {recent.length>0&&(
        <div className="glass" style={{padding:20}}>
          <SectionHeader title="Recent Transactions"/>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {recent.map(item=>(
              <div key={item.id} style={{display:'flex',alignItems:'center',gap:12}}>
                <IconBadge Icon={catIcon(month, item.type)} color={categoryColor(month,item.type)}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</p>
                  <p style={{fontSize:11,color:'var(--t3)'}}>{item.type} · {item.date||'no date'}</p>
                </div>
                <span className="num" style={{fontSize:13,fontWeight:700,color:'var(--bad)'}}>-{fmt(item.amount)}</span>
                <button className="tap" onClick={()=>onDelete(item.id)} style={{color:'var(--t3)',padding:4}}>
                  <Trash size={13}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {showAdd&&<AddVarModal month={month} onClose={()=>setShowAdd(false)} onAdd={onAdd}/>}
    </div>
  )
}

/* ══════════════════════ FIXED ══════════════════════ */
function FixedTab({month,onAdd,onDelete}:{month:MonthBudget;onAdd:(e:Omit<FixedExpense,'id'>)=>void;onDelete:(id:string)=>void}){
  const [showAdd,setShowAdd]=useState(false)
  const grandTotal=month.fixedExpenses.reduce((s,e)=>s+e.amount,0)
  const grandBase=month.fixedExpenses.reduce((s,e)=>s+e.base,0)
  return(
    <div className="space-y-4 slide-up">
      <div className="glass" style={{padding:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.07em'}}>Fixed Charges</p>
          <p className="f-display num" style={{fontSize:30,fontWeight:700,color:'var(--t1)',marginTop:2}}>
            {fmt(grandTotal)}<span style={{fontSize:13,fontWeight:400,color:'var(--t3)',marginLeft:4}}>/ {fmt(grandBase)} MAD</span>
          </p>
          {grandBase>grandTotal&&<p style={{fontSize:11,color:'var(--good)',marginTop:3,display:'flex',alignItems:'center',gap:4}}><TrendDown size={11}/>{fmt(grandBase-grandTotal)} MAD under budget</p>}
        </div>
        <button className="btn-primary tap" style={{width:'auto',padding:'10px 18px',fontSize:13}} onClick={()=>setShowAdd(true)}>
          <PlusCircle size={15} weight="bold"/>Add
        </button>
      </div>
      {(() => {
        const cats = displayFixedCats(month).map(type=>{
          const items=month.fixedExpenses.filter(e=>e.type===type)
          const total=items.reduce((s,e)=>s+e.amount,0)
          const base=month.fixedCategoryBases[type]??0
          return {type,total,base,count:items.length}
        }).filter(c=>c.count>0 || c.base>0)
        if (!cats.length) return null
        return (
          <div className="glass" style={{padding:20}}>
            <SectionHeader title="At a Glance"/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
              {cats.map(c=>{
                const left = c.base - c.total
                return (
                  <div key={c.type} className="flex flex-col items-center text-center">
                    <IconBadge Icon={catIcon(month, c.type)} color={categoryColor(month,c.type)} size={46}/>
                    <p style={{fontSize:11,fontWeight:700,color:'var(--t2)',marginTop:8,textTransform:'uppercase',letterSpacing:'0.04em'}}>{c.type}</p>
                    <p className="num" style={{fontSize:12,fontWeight:700,marginTop:1,color:left<0?'var(--bad)':'var(--t3)'}}>
                      {fmt(Math.abs(left))} {left<0?'over':'left'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
      {displayFixedCats(month).map(type=>{
        const items=month.fixedExpenses.filter(e=>e.type===type)
        if(!items.length)return null
        const total=items.reduce((s,e)=>s+e.amount,0)
        const base=items.reduce((s,e)=>s+e.base,0)
        return(
          <div key={type} className="glass" style={{padding:20}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <IconBadge Icon={catIcon(month, type)} color={categoryColor(month,type)}/>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>{type}</span>
                  <span className="num" style={{fontSize:13,fontWeight:700,color:categoryColor(month,type)}}>{fmt(total)}<span style={{fontSize:11,color:'var(--t3)',fontWeight:400}}> / {fmt(base)}</span></span>
                </div>
                <PBar value={pct(total,base)} color={categoryColor(month,type)} h={5}/>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {items.map(item=>(
                <div key={item.id} className="glass-3" style={{display:'flex',alignItems:'center',padding:'10px 14px',gap:12}}>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13,fontWeight:600,color:'var(--t1)'}}>{item.name}</p>
                    {item.date&&<p style={{fontSize:11,color:'var(--t3)'}}>{item.date}</p>}
                  </div>
                  <div style={{textAlign:'right'}}>
                    <p className="num" style={{fontSize:13,fontWeight:700,color:categoryColor(month,type)}}>{fmt(item.amount)}</p>
                    <p style={{fontSize:10,color:'var(--t3)'}}>budget {fmt(item.base)}</p>
                  </div>
                  <button className="tap" onClick={()=>onDelete(item.id)} style={{color:'var(--t3)',padding:4}}><Trash size={13}/></button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {month.fixedExpenses.length===0&&(
        <div className="glass" style={{padding:40,textAlign:'center',color:'var(--t3)'}}>
          <Receipt size={28} style={{margin:'0 auto 8px',opacity:.3}}/><p style={{fontSize:13}}>No fixed charges yet</p>
        </div>
      )}
      {showAdd&&<AddFixedModal month={month} onClose={()=>setShowAdd(false)} onAdd={onAdd}/>}
    </div>
  )
}

/* ══════════════════════ SAVINGS ══════════════════════ */
function SavingsTab({month,savings,onAdd,onDelete,onToggle,onTopUp}:{month:MonthBudget;savings:SavingsData;onAdd:(g:Omit<SavingGoal,'id'>)=>void;onDelete:(id:string)=>void;onToggle:(id:string)=>void;onTopUp:(id:string,amount:number,place:MoneyPlace)=>void}){
  const [showAdd,setShowAdd]=useState(false)
  const [fundingGoal,setFundingGoal]=useState<SavingGoal|null>(null)
  const active=savings.goals.filter(g=>g.active)
  const inactive=savings.goals.filter(g=>!g.active)
  const totalSaved=active.reduce((s,g)=>s+g.current,0)
  const totalTarget=savings.goals.reduce((s,g)=>s+g.target,0)
  return(
    <div className="space-y-4 slide-up">
      <div className="glass" style={{padding:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.07em'}}>Saving Goals</p>
          <p className="f-display num" style={{fontSize:30,fontWeight:700,color:'var(--good)',marginTop:2}}>
            {fmt(totalSaved)}<span style={{fontSize:13,fontWeight:400,color:'var(--t3)',marginLeft:4}}>/ {fmt(totalTarget)}</span>
          </p>
          <p style={{fontSize:11,color:'var(--t3)',marginTop:3}}>{active.length} active · {inactive.length} pending</p>
        </div>
        <button className="btn-primary tap" style={{width:'auto',padding:'10px 18px',fontSize:13}} onClick={()=>setShowAdd(true)}>
          <PlusCircle size={15} weight="bold"/>Add
        </button>
      </div>

      {active.length>0&&(
        <div>
          <p style={{fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.07em',padding:'0 4px',marginBottom:10}}>Active</p>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {active.map(goal=>{
              const p=pct(goal.current,goal.target)
              return(
                <div key={goal.id} className="glass" style={{padding:20}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <button onClick={()=>onToggle(goal.id)} className="tap"
                      style={{width:28,height:28,borderRadius:'50%',background:'var(--good)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',marginTop:2,border:'none'}}>
                      <Check size={13} color="var(--color-text-inverse)" weight="bold"/>
                    </button>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <p style={{fontSize:14,fontWeight:700,color:'var(--t1)'}}>{goal.name}</p>
                        <Chip label={goal.source} color="var(--good)"/>
                      </div>
                      <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:10}}>
                        <span className="f-display num" style={{fontSize:22,fontWeight:700,color:'var(--good)'}}>{fmt(goal.current)}</span>
                        <span style={{fontSize:12,color:'var(--t3)'}}>/ {fmt(goal.target)} MAD</span>
                        <span style={{fontSize:12,fontWeight:700,color:'var(--good)'}}>{p}%</span>
                      </div>
                      <PBar value={p} color="var(--good)" h={6}/>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:2}}>
                      <button className="tap" onClick={()=>setFundingGoal(goal)} style={{color:'var(--accent)',padding:4}} title="Add funds"><ArrowCircleUp size={16} weight="bold"/></button>
                      <button className="tap" onClick={()=>onDelete(goal.id)} style={{color:'var(--t3)',padding:4}}><Trash size={13}/></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {inactive.length>0&&(
        <div>
          <p style={{fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.07em',padding:'0 4px',marginBottom:10}}>Pending</p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {inactive.map(goal=>(
              <div key={goal.id} className="glass" style={{padding:16,display:'flex',alignItems:'center',gap:12,opacity:.55}}>
                <button onClick={()=>onToggle(goal.id)} className="tap"
                  style={{width:28,height:28,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid var(--border-2)',background:'var(--surface-2)'}}>
                  <Target size={12} color="var(--t3)"/>
                </button>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:600,color:'var(--t1)'}}>{goal.name}</p>
                  <p style={{fontSize:11,color:'var(--t3)'}}>{goal.source} · {fmt(goal.target)} MAD target</p>
                </div>
                <button className="tap" onClick={()=>onDelete(goal.id)} style={{color:'var(--t3)',padding:4}}><Trash size={13}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {savings.goals.length===0&&(
        <div className="glass" style={{padding:40,textAlign:'center',color:'var(--t3)'}}>
          <PiggyBank size={28} style={{margin:'0 auto 8px',opacity:.3}}/><p style={{fontSize:13}}>No saving goals yet</p>
        </div>
      )}
      {showAdd&&<AddSavingModal month={month} onClose={()=>setShowAdd(false)} onAdd={onAdd}/>}
      {fundingGoal&&<AddFundsModal month={month} goal={fundingGoal} onClose={()=>setFundingGoal(null)} onAdd={(amount,place)=>onTopUp(fundingGoal.id,amount,place)}/>}
    </div>
  )
}

/* ══════════════════════ DASHBOARD ROOT ══════════════════════ */
type Tab = 'overview'|'variable'|'fixed'|'savings'

export default function Dashboard() {
  const { user, profile, loading: authLoading, configError, signOut } = useAuth()
  const router = useRouter()
  const [month, setMonth] = useState<MonthBudget | null>(null)
  const monthRef = useRef<MonthBudget | null>(null)
  useEffect(() => { monthRef.current = month }, [month])
  const [monthId, setMonthId] = useState(currentMonthId())
  const [savings, setSavings] = useState<SavingsData | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [showSettings, setShowSettings] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user && !configError) router.replace('/login')
  }, [user, authLoading, configError, router])

  useEffect(() => {
    if (!authLoading && user && !configError && profile && !profile.onboardingComplete) router.replace('/onboarding')
  }, [user, profile, authLoading, configError, router])

  useEffect(() => {
    if (!user) return
    if (profile && !profile.onboardingComplete) return
    const unsub = subscribeMonth(
      user.uid, monthId,
      async (m) => {
        setError('')
        if (m) { setMonth(m) }
        else {
          let fresh: MonthBudget
          try {
            const prev = await getMonth(user.uid, prevMonth(monthId))
            fresh = prev ? rolloverMonth(monthId, prev) : emptyMonth(monthId)
          } catch (e) {
            console.error(e)
            fresh = emptyMonth(monthId)
          }
          try { await saveMonth(user.uid, fresh) } catch (e) { console.error(e); setError("Couldn't create this month's budget. Check your connection and try again.") }
          setMonth(fresh)
        }
      },
      () => setError("Couldn't load your budget - check your connection or Firestore setup.")
    )
    return () => unsub()
  }, [user, profile, monthId])

  // Saving goals are global - subscribed once per session, independent of
  // which month is being viewed. The very first time a returning account
  // opens this after the update, there's no global savings doc yet; we
  // migrate it from whatever goals happened to be on the most recently
  // viewed month (the old, per-month storage) so nothing looks lost.
  useEffect(() => {
    if (!user) return
    if (profile && !profile.onboardingComplete) return
    let migrated = false
    const unsub = subscribeSavings(
      user.uid,
      async (s) => {
        if (s.goals.length === 0 && !migrated && monthRef.current?.savingGoals?.length) {
          migrated = true
          const seeded: SavingsData = { goals: monthRef.current.savingGoals }
          try { await saveSavings(user.uid, seeded) } catch (e) { console.error(e) }
          setSavings(seeded)
        } else {
          setSavings(s)
        }
      },
      () => setError("Couldn't load your saving goals - check your connection or Firestore setup.")
    )
    return () => unsub()
  }, [user, profile])

  const persist = useCallback(async (updated: MonthBudget) => {
    if (!user) return
    setMonth(updated)
    setSaving(true)
    try {
      await saveMonth(user.uid, updated)
      setError('')
    } catch (e) {
      console.error(e)
      setError("Couldn't save your changes. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }, [user])

  const persistSavings = useCallback(async (updated: SavingsData) => {
    if (!user) return
    setSavings(updated)
    setSaving(true)
    try {
      await saveSavings(user.uid, updated)
      setError('')
    } catch (e) {
      console.error(e)
      setError("Couldn't save your changes. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }, [user])

  function updateMonth(patch: Partial<MonthBudget>) {
    if (!month) return
    persist({ ...month, ...patch })
  }

  const uid2 = () => Math.random().toString(36).slice(2, 10)
  const confirmDelete = (label: string) => typeof window === 'undefined' || window.confirm(`Delete ${label}? This can't be undone.`)
  const addVariable  = (e: Omit<VariableExpense,'id'>) => month && persist({...month, variableExpenses:[...month.variableExpenses,{...e,id:uid2()}]})
  const delVariable  = (id: string) => { if (month && confirmDelete('this expense')) persist({...month, variableExpenses:month.variableExpenses.filter(e=>e.id!==id)}) }
  const addFixed     = (e: Omit<FixedExpense,'id'>)    => month && persist({...month, fixedExpenses:[...month.fixedExpenses,{...e,id:uid2()}]})
  const delFixed     = (id: string) => { if (month && confirmDelete('this fixed charge')) persist({...month, fixedExpenses:month.fixedExpenses.filter(e=>e.id!==id)}) }
  // Saving goals are global and never reset month to month - funding one
  // just moves real money out of whichever money place it came from, this month.
  const addSaving = (g: Omit<SavingGoal,'id'>) => {
    if (!month || !savings) return
    if (g.current > 0) persist({ ...month, ...withMoneyPlaceDelta(month, SOURCE_TO_PLACE[g.source], -g.current) })
    persistSavings({ goals: [...savings.goals, { ...g, id: uid2() }] })
  }
  const delSaving    = (id: string) => { if (savings && confirmDelete('this saving goal')) persistSavings({ goals: savings.goals.filter(g=>g.id!==id) }) }
  const toggleSaving = (id: string) => savings && persistSavings({ goals: savings.goals.map(g=>g.id===id?{...g,active:!g.active}:g) })
  // Topping up an existing goal also moves money out of the chosen place,
  // this month, while the goal's running total keeps growing across months.
  const topUpSaving = (id: string, amount: number, place: MoneyPlace) => {
    if (!month || !savings) return
    persist({ ...month, ...withMoneyPlaceDelta(month, place, -amount) })
    persistSavings({ goals: savings.goals.map(g => g.id===id ? {...g, current: g.current+amount, active: true} : g) })
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  if (configError) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{background:'var(--bg)'}}>
      <div className="glass" style={{maxWidth:380,padding:24,textAlign:'center'}}>
        <p className="f-display" style={{fontWeight:700,fontSize:17,color:'var(--t1)',marginBottom:8}}>Firebase isn&rsquo;t configured</p>
        <p style={{fontSize:13,color:'var(--t2)',lineHeight:1.5}}>
          Add your Firebase project credentials to <code style={{background:'var(--surface-2)',padding:'1px 5px',borderRadius:4}}>.env.local</code> (see <code style={{background:'var(--surface-2)',padding:'1px 5px',borderRadius:4}}>.env.local.example</code>) and restart the app.
        </p>
      </div>
    </div>
  )

  if (authLoading || !month || !savings) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
          style={{borderColor:'var(--accent)',borderTopColor:'transparent'}}/>
        <p style={{color:'var(--t3)',fontSize:13}}>Loading your budget</p>
      </div>
    </div>
  )

  const tabs: {id:Tab;label:string;Icon:Icon}[] = [
    {id:'overview',label:'Overview',Icon:House},
    {id:'variable',label:'Expenses',Icon:ChartBar},
    {id:'fixed',label:'Fixed',Icon:Receipt},
    {id:'savings',label:'Savings',Icon:PiggyBank},
  ]
  // Mobile bottom nav uses lucide-react, icon-only, Instagram-style.
  const mobileTabs: {id:Tab;Icon:LucideIcon}[] = [
    {id:'overview',Icon:LucideHome},
    {id:'variable',Icon:LucideWallet},
    {id:'fixed',Icon:LucideReceipt},
    {id:'savings',Icon:LucidePiggyBank},
  ]

  return (
    <div className="min-h-screen md:flex" style={{background:'var(--bg)'}}>
      {/* Desktop sidebar nav - replaces the bottom tab bar on wider screens */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen"
        style={{borderRight:'1px solid var(--border)',background:'var(--surface)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'22px 22px 18px'}}>
          <div style={{width:34,height:34,borderRadius:10,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Wallet size={17} weight="bold" color="var(--accent-ink)"/>
          </div>
          <span className="f-display" style={{fontSize:17,fontWeight:700,color:'var(--t1)'}}>Flousy</span>
        </div>
        <nav style={{display:'flex',flexDirection:'column',gap:2,padding:'0 12px'}}>
          {tabs.map(t=>{
            const active=tab===t.id
            return(
              <button key={t.id} onClick={()=>setTab(t.id)} className="tap"
                style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,
                  color:active?'var(--t1)':'var(--t2)',background:active?'var(--accent-tint)':'transparent',fontWeight:700,fontSize:13,textAlign:'left'}}>
                <t.Icon size={17} weight={active?'fill':'regular'}/>{t.label}
              </button>
            )
          })}
        </nav>
        <div style={{flex:1}}/>
        <div style={{padding:12,display:'flex',flexDirection:'column',gap:2}}>
          <button onClick={()=>setShowSettings(true)} className="tap"
            style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,color:'var(--t2)',fontWeight:700,fontSize:13,textAlign:'left'}}>
            <Gear size={17}/>Settings
          </button>
          <button onClick={handleSignOut} className="tap"
            style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,color:'var(--t2)',fontWeight:700,fontSize:13,textAlign:'left'}}>
            <SignOut size={17}/>Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 max-w-md md:max-w-none mx-auto md:mx-0" style={{background:'var(--bg)'}}>
        {/* Top bar */}
        <div className="safe-top sticky top-0 z-40 md:static" style={{background:'rgba(255,255,255,0.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px'}} className="md:px-8 md:py-4">
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button className="tap" onClick={()=>setMonthId(prevMonth(monthId))}
                style={{width:32,height:32,borderRadius:10,background:'var(--surface-2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <CaretLeft size={15} color="var(--t2)"/>
              </button>
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.07em'}}>Budget</p>
                <h1 className="f-display" style={{fontSize:16,fontWeight:700,color:'var(--t1)',lineHeight:1.1}}>{month.label}</h1>
              </div>
              <button className="tap" onClick={()=>setMonthId(nextMonth(monthId))}
                style={{width:32,height:32,borderRadius:10,background:'var(--surface-2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <CaretRight size={15} color="var(--t2)"/>
              </button>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {saving && <div className="w-2 h-2 rounded-full" style={{background:'var(--accent)'}}/>}
              <button onClick={()=>setShowSettings(true)} className="tap md:hidden"
                style={{width:36,height:36,borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Gear size={16} color="var(--t2)"/>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 md:px-8 md:pt-6 md:pb-10">
          <div className="md:max-w-5xl md:mx-auto">
            {error && <div className="banner banner-error fade-in" style={{marginBottom:16}}>{error}</div>}
            {tab==='overview' && <Overview month={month} savings={savings}/>}
            {tab==='variable' && <VariableTab month={month} onAdd={addVariable} onDelete={delVariable}/>}
            {tab==='fixed'    && <FixedTab month={month} onAdd={addFixed} onDelete={delFixed}/>}
            {tab==='savings'  && <SavingsTab month={month} savings={savings} onAdd={addSaving} onDelete={delSaving} onToggle={toggleSaving} onTopUp={topUpSaving}/>}
          </div>
        </div>

        {/* Bottom nav - mobile only, Instagram-style icon-only; desktop uses the sidebar instead */}
        <nav className="safe-bottom fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 md:hidden"
          style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(24px)',borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',padding:'2px 12px'}}>
            {mobileTabs.map(t=>{
              const active=tab===t.id
              return(
                <button key={t.id} onClick={()=>setTab(t.id)} className="tap" aria-label={t.id}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'12px 0',background:'transparent',border:'none'}}>
                  <t.Icon size={26} strokeWidth={active?2.25:1.6} color={active?'var(--t1)':'var(--t3)'} fill={active?'var(--t1)':'none'} fillOpacity={active?0.12:0}/>
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {showSettings&&<SettingsModal month={month} user={user} onClose={()=>setShowSettings(false)} onSave={p=>updateMonth(p)} onSignOut={handleSignOut} onManageCategories={()=>{setShowSettings(false);setShowCategories(true)}}/>}
      {showCategories&&<ManageCategoriesModal month={month} onClose={()=>setShowCategories(false)} onSave={p=>updateMonth(p)}/>}
    </div>
  )
}
