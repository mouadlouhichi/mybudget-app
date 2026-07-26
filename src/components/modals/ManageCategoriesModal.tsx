'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { MonthBudget, VARIABLE_TYPES, FIXED_TYPES, CAT_COLOR, nextPaletteColor } from '@/lib/store'
import { CAT_ICON, CAT_ICON_FALLBACK, ICON_BY_KEY, CUSTOM_ICON_CHOICES } from '@/lib/category-icons'
import { PlusCircle, Check, X, Trash } from '@phosphor-icons/react/dist/ssr'

/* ── Manage Categories Modal ── */
export function ManageCategoriesModal({ month, onClose, onSave }: { month: MonthBudget; onClose: () => void; onSave: (p: Partial<MonthBudget>) => void }) {
  const confirm = useConfirm()
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
  async function removeCustom(t: string) {
    const ok = await confirm({
      title: `Remove "${t}"?`,
      message: "Existing expenses keep this category, but it won't be selectable for new ones.",
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (ok) setActive(a => a.filter(x => x !== t))
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
