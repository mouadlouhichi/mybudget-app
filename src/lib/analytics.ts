'use client'

// Thin, provider-agnostic telemetry seam. Nothing is sent anywhere unless a
// provider is configured, so the app ships with zero third-party tracking by
// default (and the privacy policy stays true).
//
// To enable Plausible, add to your layout:
//   <script defer data-domain="yourdomain" src="https://plausible.io/js/script.js" />
// then set NEXT_PUBLIC_ANALYTICS=plausible.

type Props = Record<string, string | number | boolean | undefined>

const ENABLED = process.env.NEXT_PUBLIC_ANALYTICS

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Props }) => void
    gtag?: (command: string, event: string, params?: Props) => void
  }
}

export function trackEvent(name: string, props?: Props) {
  if (!ENABLED || typeof window === 'undefined') return
  try {
    if (ENABLED === 'plausible' && window.plausible) {
      window.plausible(name, props ? { props } : undefined)
    } else if (ENABLED === 'ga' && window.gtag) {
      window.gtag('event', name, props)
    }
  } catch {
    // Telemetry must never break the app.
  }
}

// Central error reporting seam. Swap the body for Sentry.captureException
// when a DSN is available; until then errors at least reach the console in
// one consistent place rather than being scattered.
export function reportError(error: unknown, context?: Props) {
  console.error('[flousy]', error, context ?? '')
  if (!ENABLED || typeof window === 'undefined') return
  trackEvent('app_error', {
    message: error instanceof Error ? error.message : String(error),
    ...context,
  })
}
