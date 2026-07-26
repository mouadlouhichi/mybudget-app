import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="glass" style={{ maxWidth: 380, padding: 28, textAlign: 'center' }}>
        <p className="f-display" style={{ fontSize: 40, fontWeight: 700, color: 'var(--accent-dim)' }}>404</p>
        <p className="f-display" style={{ fontWeight: 700, fontSize: 17, color: 'var(--t1)', margin: '6px 0 8px' }}>
          Page not found
        </p>
        <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.55, marginBottom: 20 }}>
          That page doesn&rsquo;t exist. It may have moved, or the link might be out of date.
        </p>
        <Link href="/dashboard" className="btn-primary tap" style={{ textDecoration: 'none' }}>
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
