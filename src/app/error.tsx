'use client'

import { useEffect } from 'react'
import { Warning, ArrowClockwise } from '@phosphor-icons/react/dist/ssr'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Hook for a monitoring service (Sentry etc.) - for now at least it
    // lands somewhere visible rather than vanishing.
    console.error('Unhandled application error', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="glass" style={{ maxWidth: 400, padding: 28, textAlign: 'center' }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 14, margin: '0 auto 14px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', background: 'var(--bad-tint)',
          }}
        >
          <Warning size={22} weight="bold" color="var(--bad)" />
        </div>
        <p className="f-display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--t1)', marginBottom: 8 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.55, marginBottom: 20 }}>
          Your data is safe. Try again, and if this keeps happening please sign out and back in.
        </p>
        <button onClick={reset} className="btn-primary tap">
          <ArrowClockwise size={16} weight="bold" /> Try again
        </button>
        {error.digest && (
          <p style={{ fontSize: 10, color: 'var(--t3)', marginTop: 14 }}>Reference: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
