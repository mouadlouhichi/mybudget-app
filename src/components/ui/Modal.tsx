'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react/dist/ssr'

// Rendered via a portal straight into document.body. Nesting a `position:
// fixed` sheet inside a scrollable ancestor is unreliable on mobile Safari -
// the sheet can end up positioned against the scrolled content instead of
// the viewport. A portal guarantees it's a direct child of <body>.
//
// Accessibility (H11): proper dialog semantics, Escape to close, focus moved
// into the sheet on open, focus trapped inside while it's up, and focus
// restored to whatever opened it on close.
export function Modal({
  title, onClose, children, labelledBy,
}: {
  title: string; onClose: () => void; children: React.ReactNode; labelledBy?: string
}) {
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const titleId = labelledBy ?? `modal-title-${title.replace(/\W+/g, '-').toLowerCase()}`

  useEffect(() => {
    setMounted(true)
    restoreRef.current = document.activeElement as HTMLElement | null
    // Stop the page behind the sheet from scrolling while it's open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      restoreRef.current?.focus?.()
    }
  }, [])

  // Move focus into the sheet once it exists.
  useEffect(() => {
    if (!mounted) return
    const first = panelRef.current?.querySelector<HTMLElement>(
      'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
    )
    ;(first ?? panelRef.current)?.focus?.()
  }, [mounted])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )
      if (!nodes || nodes.length === 0) return
      const list = Array.from(nodes).filter(n => n.offsetParent !== null || n === document.activeElement)
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center fade-in"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md slide-up"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: '24px 24px 0 0',
          border: '1px solid var(--border-2)', borderBottom: 'none',
          maxHeight: '92dvh', overflowY: 'auto', outline: 'none',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <h2 id={titleId} className="f-display" style={{ fontWeight: 700, fontSize: 17, color: 'var(--t1)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="tap flex items-center justify-center w-8 h-8 rounded-full glass-3"
          >
            <X size={15} color="var(--t2)" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">{children}</div>
        <div style={{ height: 28 }} />
      </div>
    </div>,
    document.body,
  )
}
