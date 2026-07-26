'use client'

// Catches errors thrown in the root layout itself, where error.tsx can't
// help. Must render its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#000' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 400, textAlign: 'center' }}>
            <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: '#4D4D4D', lineHeight: 1.55, marginBottom: 20 }}>
              The app failed to start. Your data is safe.
            </p>
            <button
              onClick={reset}
              style={{
                background: '#EEC1A0', border: 'none', padding: '13px 26px', borderRadius: 999,
                fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
