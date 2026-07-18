'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { saveMonth, subscribeMonth } from '@/lib/db'
import { defaultMonth, MonthBudget, VariableExpense, FixedExpense, SavingGoal, VARIABLE_TYPES, FIXED_TYPES, CAT_COLOR } from '@/lib/store'
import { CAT_ICON } from '@/lib/category-icons'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis } from 'recharts'
import {
  House, ChartBar, PiggyBank, Receipt, Gear, PlusCircle,
  Trash, Check, X, CaretRight, CaretDown, SignOut,
  Target, TrendUp, TrendDown, CaretLeft, Wallet,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'

/* ── helpers ── */
const fmt   = (n: number) => n.toLocaleString('fr-MA', { maximumFractionDigits: 0 })
const pct   = (a: number, b: number) => b ? Math.min(100, Math.round((a / b) * 100)) : 0
const uid   = () => Math.random().toString(36).slice(2, 10)
const today = () => new Date().toISOString().slice(0, 10)

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

/* ── IconBadge — Phosphor icon, one family, tinted background ── */
function IconBadge({ Icon: Ico, color, size = 40 }: { Icon: Icon; color: string; size?: number }) {
  return (
    <div className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ width: size, height: size, background: color + '22' }}>
      <Ico size={size * 0.46} weight="bold" color={color} />
    </div>
  )
}

/* ── Chip ── */
function Chip({ label, color = 'var(--accent)' }: { label: string; color?: string }) {
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:700, background: color+'22', color, letterSpacing:'0.04em' }}>{label}</span>
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
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center fade-in"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md slide-up"
        style={{ background: 'var(--surface)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border-2)', borderBottom: 'none', maxHeight: '92vh', overflowY: 'auto' }}>
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
    </div>
  )
}

function FL({ label }: { label: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</p>
}

/* ── Add Variable ── */
function AddVarModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: Omit<VariableExpense,'id'>) => void }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<typeof VARIABLE_TYPES[0]>('Alimentation')
  const [date, setDate] = useState(today())
  return (
    <Modal title="New Expense" onClose={onClose}>
      <div>
        <FL label="Category" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {VARIABLE_TYPES.map(t => {
            const Ico = CAT_ICON[t]
            return (
              <button key={t} onClick={() => setType(t)} className="tap flex flex-col items-center gap-1.5 py-2.5 rounded-xl"
                style={{ background: type===t ? CAT_COLOR[t]+'22':'var(--surface-2)', border:`1.5px solid ${type===t?CAT_COLOR[t]:'var(--border)'}` }}>
                <Ico size={18} weight="bold" color={type===t?CAT_COLOR[t]:'var(--t3)'} />
                <span style={{ fontSize: 8, fontWeight: 700, color: type===t?CAT_COLOR[t]:'var(--t3)', textAlign:'center', lineHeight:1.2 }}>{t}</span>
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
function AddFixedModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: Omit<FixedExpense,'id'>) => void }) {
  const [name, setName]=useState(''); const [amount, setAmount]=useState(''); const [base,setBase]=useState('')
  const [type,setType]=useState<typeof FIXED_TYPES[0]>('Facture'); const [date,setDate]=useState(today())
  return (
    <Modal title="New Fixed Charge" onClose={onClose}>
      <div><FL label="Type"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {FIXED_TYPES.map(t=>{
            const Ico = CAT_ICON[t]
            return (
              <button key={t} onClick={()=>setType(t)} className="tap flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{background:type===t?CAT_COLOR[t]+'22':'var(--surface-2)',border:`1.5px solid ${type===t?CAT_COLOR[t]:'var(--border)'}`}}>
                <Ico size={15} weight="bold" color={type===t?CAT_COLOR[t]:'var(--t2)'} />
                <span style={{fontSize:11,fontWeight:700,color:type===t?CAT_COLOR[t]:'var(--t2)'}}>{t}</span>
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
function AddSavingModal({ onClose, onAdd }: { onClose:()=>void; onAdd:(g:Omit<SavingGoal,'id'>)=>void }) {
  const [name,setName]=useState(''); const [target,setTarget]=useState(''); const [current,setCurrent]=useState('')
  const [source,setSource]=useState<'HOME'|'BANK SAVING'|'WALLET'>('HOME')
  return (
    <Modal title="New Saving Goal" onClose={onClose}>
      <div><FL label="Goal Name"/><input className="field" placeholder="e.g. Vacation, Emergency fund" value={name} onChange={e=>setName(e.target.value)} autoFocus/></div>
      <div><FL label="Source"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {(['HOME','BANK SAVING','WALLET'] as const).map(s=>(
            <button key={s} onClick={()=>setSource(s)} className="tap py-2.5 rounded-xl"
              style={{fontSize:11,fontWeight:700,background:source===s?'var(--accent-tint)':'var(--surface-2)',border:`1.5px solid ${source===s?'var(--accent)':'var(--border)'}`,color:source===s?'var(--accent)':'var(--t2)'}}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div><FL label="Target (MAD)"/><input className="field" type="number" placeholder="0" value={target} onChange={e=>setTarget(e.target.value)}/></div>
        <div><FL label="Saved so far"/><input className="field" type="number" placeholder="0" value={current} onChange={e=>setCurrent(e.target.value)}/></div>
      </div>
      <button className="btn-primary tap" onClick={()=>{if(!name||!target)return;onAdd({name,target:parseFloat(target),current:parseFloat(current)||0,source,active:parseFloat(current)>0});onClose()}}>
        <PlusCircle size={16} weight="bold"/> Create Goal
      </button>
    </Modal>
  )
}

/* ── Settings Modal ── */
function SettingsModal({ month, user, onClose, onSave, onSignOut }: { month: MonthBudget; user: any; onClose:()=>void; onSave:(p:Partial<MonthBudget>)=>void; onSignOut:()=>void }) {
  const [total,setTotal]=useState(String(month.totalBudget))
  const [home,setHome]=useState(String(month.homePart))
  const [wallet,setWallet]=useState(String(month.walletPart))
  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="glass-2 p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{background:'var(--accent)'}}>
          {user?.photoURL
            ? <img src={user.photoURL} className="w-12 h-12 rounded-full object-cover" alt="avatar"/>
            : <span className="f-display" style={{fontSize:18,fontWeight:700,color:'#1B1510'}}>{(user?.displayName||'U')[0]}</span>}
        </div>
        <div className="flex-1">
          <p style={{fontWeight:700,fontSize:15,color:'var(--t1)'}}>{user?.displayName || 'User'}</p>
          <p style={{fontSize:12,color:'var(--t2)'}}>{user?.email}</p>
        </div>
        <Chip label="FREE" color="var(--accent)"/>
      </div>
      <div><FL label="Total Monthly Budget (MAD)"/><input className="field" type="number" value={total} onChange={e=>setTotal(e.target.value)}/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div><FL label="Home"/><input className="field" type="number" value={home} onChange={e=>setHome(e.target.value)}/></div>
        <div><FL label="Wallet"/><input className="field" type="number" value={wallet} onChange={e=>setWallet(e.target.value)}/></div>
      </div>
      <button className="btn-primary tap" onClick={()=>{onSave({totalBudget:parseFloat(total)||month.totalBudget,homePart:parseFloat(home)||month.homePart,walletPart:parseFloat(wallet)||month.walletPart});onClose()}}>
        <Check size={16} weight="bold"/> Save Settings
      </button>
      <div className="glass-2 p-4 flex items-center gap-3" style={{border:'1px solid var(--border-2)'}}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'var(--accent-tint)'}}>
          <TrendUp size={17} weight="bold" color="var(--accent)"/>
        </div>
        <div className="flex-1">
          <p style={{fontWeight:700,fontSize:13,color:'var(--t1)'}}>Upgrade to Pro</p>
          <p style={{fontSize:11,color:'var(--t2)'}}>Unlimited months, insights, export</p>
        </div>
        <button className="tap" style={{background:'var(--accent)',color:'#1B1510',padding:'7px 14px',borderRadius:999,fontSize:12,fontWeight:700,whiteSpace:'nowrap',border:'none'}}>Go Pro</button>
      </div>
      <button onClick={onSignOut} className="btn-ghost tap w-full">
        <SignOut size={15} weight="bold"/> Sign out
      </button>
    </Modal>
  )
}

/* ══════════════════════ OVERVIEW ══════════════════════ */
function Overview({ month }: { month: MonthBudget }) {
  const totalFixed = month.fixedExpenses.reduce((s,e)=>s+e.amount,0)
  const totalVar   = month.variableExpenses.reduce((s,e)=>s+e.amount,0)
  const totalSaved = month.savingGoals.filter(g=>g.active).reduce((s,g)=>s+g.current,0)
  const totalSpent = totalFixed + totalVar
  const remaining  = month.totalBudget - totalSpent - totalSaved
  const spentPct   = pct(totalSpent, month.totalBudget)

  const statusColor = spentPct>=95?'var(--bad)':spentPct>=75?'var(--warn)':'var(--good)'
  const statusLabel = spentPct>=95?'Over budget':spentPct>=75?'Watch spending':'On track'

  const pieData = [
    {name:'Fixed',value:totalFixed,color:'var(--accent-dim)'},
    {name:'Variable',value:totalVar,color:'var(--accent)'},
    {name:'Savings',value:totalSaved,color:'var(--good)'},
    {name:'Free',value:Math.max(0,remaining),color:'var(--surface-3)'},
  ].filter(d=>d.value>0)

  const topCats = VARIABLE_TYPES
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
      {/* Hero card — solid off-black, gold accent border, no gradient wash */}
      <div className="relative" style={{borderRadius:'var(--r-card)',padding:24,background:'var(--surface)',border:'1px solid var(--border-2)',boxShadow:'var(--shadow-card)'}}>
        <div className="flex items-start justify-between mb-6">
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

        <div style={{marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--t3)'}}>Spent {spentPct}%</span>
            <span style={{fontSize:12,fontWeight:700,color:remaining<0?'var(--bad)':'var(--good)'}}>
              {remaining<0?'-':'+'}{fmt(Math.abs(remaining))} left
            </span>
          </div>
          <PBar value={spentPct} color="var(--accent)" h={8}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[{Ico:House,label:'Home',value:month.homePart},{Ico:Wallet,label:'Wallet',value:month.walletPart}].map(p=>(
            <div key={p.label} className="glass-2" style={{padding:'12px 14px'}}>
              <div className="flex items-center gap-1.5" style={{marginBottom:6}}>
                <p.Ico size={13} weight="bold" color="var(--t3)"/>
                <p style={{fontSize:11,color:'var(--t3)',fontWeight:600}}>{p.label}</p>
              </div>
              <p className="f-display num" style={{fontSize:19,fontWeight:700,color:'var(--t1)'}}>{fmt(p.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3 stat tiles */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[
          {label:'Fixed',val:totalFixed,Ico:Receipt,color:'var(--accent-dim)'},
          {label:'Variable',val:totalVar,Ico:ChartBar,color:'var(--accent)'},
          {label:'Saved',val:totalSaved,Ico:PiggyBank,color:'var(--good)'},
        ].map(c=>(
          <div key={c.label} className="glass" style={{padding:'14px 12px'}}>
            <div style={{width:32,height:32,borderRadius:10,background:c.color+'22',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
              <c.Ico size={15} weight="bold" color={c.color}/>
            </div>
            <p className="f-display num" style={{fontSize:17,fontWeight:700,color:'var(--t1)'}}>{fmt(c.val)}</p>
            <p style={{fontSize:10,fontWeight:600,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.05em',marginTop:2}}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Spend trajectory */}
      <div className="glass" style={{padding:20}}>
        <SectionHeader title="Spend Trajectory" action={<Chip label="This Month" color="var(--accent)"/>}/>
        <div style={{height:80}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{top:4,right:4,left:4,bottom:0}}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D6A75C" stopOpacity={0.35}/>
                  <stop offset="100%" stopColor="#D6A75C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="w" tick={{fontSize:9,fill:'#6C6459'}} axisLine={false} tickLine={false}/>
              <Area type="monotone" dataKey="v" stroke="#D6A75C" strokeWidth={2} fill="url(#g1)"
                dot={{r:3,fill:'#D6A75C',strokeWidth:0}}/>
              <Tooltip contentStyle={{background:'#221E1A',border:'1px solid rgba(247,241,232,0.16)',borderRadius:10,fontSize:12,color:'#F4EFE6'}}
                formatter={(v:number)=>[`${fmt(v)} MAD`,'Spent']}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown donut */}
      <div className="glass" style={{padding:20}}>
        <SectionHeader title="Breakdown"/>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{width:120,height:120,flexShrink:0}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={55}
                  dataKey="value" strokeWidth={2} stroke="#131110" paddingAngle={2}>
                  {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'#221E1A',border:'1px solid rgba(247,241,232,0.16)',borderRadius:10,fontSize:12,color:'#F4EFE6'}}
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
        <div className="glass" style={{padding:20}}>
          <SectionHeader title="Top Spending"/>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {topCats.map(cat=>(
              <div key={cat.type} style={{display:'flex',alignItems:'center',gap:12}}>
                <IconBadge Icon={CAT_ICON[cat.type]} color={CAT_COLOR[cat.type]}/>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:13,fontWeight:600,color:'var(--t1)'}}>{cat.type}</span>
                    <span className="num" style={{fontSize:13,fontWeight:700,color:CAT_COLOR[cat.type]}}>{fmt(cat.total)} MAD</span>
                  </div>
                  <PBar value={pct(cat.total,month.variableCategoryBases[cat.type])} color={CAT_COLOR[cat.type]} h={5}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════ VARIABLE ══════════════════════ */
function VariableTab({ month, onAdd, onDelete }:{month:MonthBudget;onAdd:(e:Omit<VariableExpense,'id'>)=>void;onDelete:(id:string)=>void}) {
  const [showAdd,setShowAdd]=useState(false)
  const [expanded,setExpanded]=useState<string|null>(null)
  const grouped=VARIABLE_TYPES.map(type=>{
    const items=month.variableExpenses.filter(e=>e.type===type)
    const total=items.reduce((s,e)=>s+e.amount,0)
    return{type,items,total,base:month.variableCategoryBases[type]}
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
                  <IconBadge Icon={CAT_ICON[g.type]} color={CAT_COLOR[g.type]}/>
                  <div style={{flex:1,textAlign:'left'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:5}}>
                      <span style={{fontSize:13,fontWeight:600,color:'var(--t1)'}}>{g.type}</span>
                      <div>
                        <span className="num" style={{fontSize:13,fontWeight:700,color:CAT_COLOR[g.type]}}>{fmt(g.total)}</span>
                        <span style={{fontSize:11,color:'var(--t3)',marginLeft:3}}>/ {fmt(g.base)}</span>
                      </div>
                    </div>
                    <PBar value={pct(g.total,g.base)} color={CAT_COLOR[g.type]} h={4}/>
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
                      <span className="num" style={{fontSize:13,fontWeight:700,color:CAT_COLOR[g.type]}}>{fmt(item.amount)}</span>
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
                <IconBadge Icon={CAT_ICON[item.type]} color={CAT_COLOR[item.type]}/>
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
      {showAdd&&<AddVarModal onClose={()=>setShowAdd(false)} onAdd={onAdd}/>}
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
      {FIXED_TYPES.map(type=>{
        const items=month.fixedExpenses.filter(e=>e.type===type)
        if(!items.length)return null
        const total=items.reduce((s,e)=>s+e.amount,0)
        const base=items.reduce((s,e)=>s+e.base,0)
        return(
          <div key={type} className="glass" style={{padding:20}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <IconBadge Icon={CAT_ICON[type]} color={CAT_COLOR[type]}/>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>{type}</span>
                  <span className="num" style={{fontSize:13,fontWeight:700,color:CAT_COLOR[type]}}>{fmt(total)}<span style={{fontSize:11,color:'var(--t3)',fontWeight:400}}> / {fmt(base)}</span></span>
                </div>
                <PBar value={pct(total,base)} color={CAT_COLOR[type]} h={5}/>
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
                    <p className="num" style={{fontSize:13,fontWeight:700,color:CAT_COLOR[type]}}>{fmt(item.amount)}</p>
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
      {showAdd&&<AddFixedModal onClose={()=>setShowAdd(false)} onAdd={onAdd}/>}
    </div>
  )
}

/* ══════════════════════ SAVINGS ══════════════════════ */
function SavingsTab({month,onAdd,onDelete,onToggle}:{month:MonthBudget;onAdd:(g:Omit<SavingGoal,'id'>)=>void;onDelete:(id:string)=>void;onToggle:(id:string)=>void}){
  const [showAdd,setShowAdd]=useState(false)
  const active=month.savingGoals.filter(g=>g.active)
  const inactive=month.savingGoals.filter(g=>!g.active)
  const totalSaved=active.reduce((s,g)=>s+g.current,0)
  const totalTarget=month.savingGoals.reduce((s,g)=>s+g.target,0)
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
                      <Check size={13} color="#131110" weight="bold"/>
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
                    <button className="tap" onClick={()=>onDelete(goal.id)} style={{color:'var(--t3)',padding:4,marginTop:2}}><Trash size={13}/></button>
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

      {month.savingGoals.length===0&&(
        <div className="glass" style={{padding:40,textAlign:'center',color:'var(--t3)'}}>
          <PiggyBank size={28} style={{margin:'0 auto 8px',opacity:.3}}/><p style={{fontSize:13}}>No saving goals yet</p>
        </div>
      )}
      {showAdd&&<AddSavingModal onClose={()=>setShowAdd(false)} onAdd={onAdd}/>}
    </div>
  )
}

/* ══════════════════════ DASHBOARD ROOT ══════════════════════ */
type Tab = 'overview'|'variable'|'fixed'|'savings'

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [month, setMonth] = useState<MonthBudget | null>(null)
  const [monthId, setMonthId] = useState(currentMonthId())
  const [tab, setTab] = useState<Tab>('overview')
  const [showSettings, setShowSettings] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeMonth(user.uid, monthId, async (m) => {
      if (m) { setMonth(m) }
      else {
        const fresh = defaultMonth(monthId)
        await saveMonth(user.uid, fresh)
        setMonth(fresh)
      }
    })
    return () => unsub()
  }, [user, monthId])

  const persist = useCallback(async (updated: MonthBudget) => {
    if (!user) return
    setMonth(updated)
    setSaving(true)
    await saveMonth(user.uid, updated)
    setSaving(false)
  }, [user])

  function updateMonth(patch: Partial<MonthBudget>) {
    if (!month) return
    persist({ ...month, ...patch })
  }

  const uid2 = () => Math.random().toString(36).slice(2, 10)
  const addVariable  = (e: Omit<VariableExpense,'id'>) => month && persist({...month, variableExpenses:[...month.variableExpenses,{...e,id:uid2()}]})
  const delVariable  = (id: string) => month && persist({...month, variableExpenses:month.variableExpenses.filter(e=>e.id!==id)})
  const addFixed     = (e: Omit<FixedExpense,'id'>)    => month && persist({...month, fixedExpenses:[...month.fixedExpenses,{...e,id:uid2()}]})
  const delFixed     = (id: string) => month && persist({...month, fixedExpenses:month.fixedExpenses.filter(e=>e.id!==id)})
  const addSaving    = (g: Omit<SavingGoal,'id'>)      => month && persist({...month, savingGoals:[...month.savingGoals,{...g,id:uid2()}]})
  const delSaving    = (id: string) => month && persist({...month, savingGoals:month.savingGoals.filter(g=>g.id!==id)})
  const toggleSaving = (id: string) => month && persist({...month, savingGoals:month.savingGoals.map(g=>g.id===id?{...g,active:!g.active}:g)})

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  if (authLoading || !month) return (
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

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto" style={{background:'var(--bg)'}}>
      {/* Top bar */}
      <div className="safe-top sticky top-0 z-40" style={{background:'rgba(19,17,16,0.9)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px'}}>
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
            <button onClick={()=>setShowSettings(true)} className="tap"
              style={{width:36,height:36,borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Gear size={16} color="var(--t2)"/>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {tab==='overview' && <Overview month={month}/>}
        {tab==='variable' && <VariableTab month={month} onAdd={addVariable} onDelete={delVariable}/>}
        {tab==='fixed'    && <FixedTab month={month} onAdd={addFixed} onDelete={delFixed}/>}
        {tab==='savings'  && <SavingsTab month={month} onAdd={addSaving} onDelete={delSaving} onToggle={toggleSaving}/>}
      </div>

      {/* Bottom nav */}
      <nav className="safe-bottom fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40"
        style={{background:'rgba(19,17,16,0.94)',backdropFilter:'blur(24px)',borderTop:'1px solid var(--border)'}}>
        <div style={{display:'flex',padding:'4px 8px'}}>
          {tabs.map(t=>{
            const active=tab===t.id
            return(
              <button key={t.id} onClick={()=>setTab(t.id)} className="tap"
                style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                  padding:'8px 4px',borderRadius:14,gap:4,
                  color:active?'var(--accent)':'var(--t3)',
                  background:active?'var(--accent-tint)':'transparent',
                  transition:'all 0.15s'}}>
                <t.Icon size={19} weight={active?'fill':'regular'}/>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:'0.02em'}}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {showSettings&&<SettingsModal month={month} user={user} onClose={()=>setShowSettings(false)} onSave={p=>updateMonth(p)} onSignOut={handleSignOut}/>}
    </div>
  )
}
