import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ServiceWorker } from '@/components/ServiceWorker'

export const metadata: Metadata = {
  title: 'Flousy — Personal Budget Tracker',
  description: 'Track every dirham, hit every goal. A private, mobile-first budget tracker.',
  manifest: '/manifest.json',
  applicationName: 'Flousy',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Flousy' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  // Pinch-zoom deliberately left enabled - capping scale fails WCAG 1.4.4 (H11).
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts are loaded with preconnect + a plain stylesheet link rather
            than a CSS @import (which is render-blocking and serialises the
            request) or next/font (which fetches at build time and breaks
            builds on restricted networks/CI). font-display:swap in the URL
            means text paints immediately in the fallback face. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ServiceWorker />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
