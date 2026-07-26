'use client'

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react'
import { Modal } from './Modal'
import { Warning } from '@phosphor-icons/react/dist/ssr'

// Replaces window.confirm (H2), which renders as a jarring browser chrome
// dialog inside an installed PWA and can't be styled or made accessible.
// Usage:  const confirm = useConfirm(); if (await confirm({...})) { ... }

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const Ctx = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>(o => {
    setOpts(o)
    return new Promise<boolean>(resolve => {
      resolver.current = resolve
    })
  }, [])

  const settle = useCallback((v: boolean) => {
    resolver.current?.(v)
    resolver.current = null
    setOpts(null)
  }, [])

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {opts && (
        <Modal title={opts.title} onClose={() => settle(false)}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {opts.destructive && (
              <div
                aria-hidden
                style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', background: 'var(--bad-tint)',
                }}
              >
                <Warning size={17} weight="bold" color="var(--bad)" />
              </div>
            )}
            <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.5 }}>{opts.message}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => settle(false)} className="btn-ghost tap" style={{ flex: 1 }}>
              {opts.cancelLabel ?? 'Cancel'}
            </button>
            <button
              onClick={() => settle(true)}
              className="btn-primary tap"
              style={
                opts.destructive
                  ? { flex: 1, background: 'var(--bad)', color: '#fff', boxShadow: 'none' }
                  : { flex: 1 }
              }
            >
              {opts.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(Ctx)
  // Fall back to window.confirm if somehow used outside the provider, so a
  // destructive action can never silently proceed unconfirmed.
  if (!ctx) {
    return async (o: ConfirmOptions) =>
      typeof window === 'undefined' ? false : window.confirm(`${o.title}\n\n${o.message}`)
  }
  return ctx
}
