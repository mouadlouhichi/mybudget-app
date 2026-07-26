import Link from 'next/link'
import { CaretLeft, Wallet } from '@phosphor-icons/react/dist/ssr'

export const metadata = { title: 'Privacy Policy — Flousy' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 className="f-display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--t2)' }}>{children}</div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="safe-top" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard" className="tap" style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CaretLeft size={15} color="var(--t2)" />
          </Link>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={13} weight="bold" color="var(--accent-ink)" />
          </div>
          <span className="f-display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Flousy</span>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 60px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Legal</p>
        <h1 className="f-display" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Privacy Policy</h1>
        <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 32 }}>Last updated: July 2026</p>

        <Section title="What we collect">
          Flousy stores the budget data you enter yourself — income, expenses, fixed charges, saving goals, and
          debts or credits you record. If you sign in with email or Google, we also store your name, email
          address, and a profile photo if your account has one.
        </Section>
        <Section title="How your data is stored">
          Your data lives in your own account, in a private Firestore database. Only you can read or write it —
          every document is scoped to your signed-in user ID, enforced by Firestore security rules. We don&rsquo;t sell,
          rent, or share your financial data with third parties.
        </Section>
        <Section title="Authentication">
          Sign-in is handled by Firebase Authentication (a Google service). If you use &ldquo;Sign in with Google&rdquo;,
          Google shares your name, email, and photo with us to create your account — we don&rsquo;t receive your
          Google password.
        </Section>
        <Section title="Cookies & local storage">
          Flousy uses local/session storage only to keep you signed in between visits. We don&rsquo;t use advertising
          or tracking cookies.
        </Section>
        <Section title="Your choices">
          You can edit or delete any expense, fixed charge, saving goal, or debt/credit entry at any time from
          within the app. To delete your account and all associated data, contact us using the details below.
        </Section>
        <Section title="Changes to this policy">
          If this policy changes in a meaningful way, we&rsquo;ll update the date at the top of this page.
        </Section>
        <Section title="Contact">
          Questions about this policy or your data can be sent to the app&rsquo;s support contact provided at
          sign-up.
        </Section>

        <div className="glass-2" style={{ padding: 14, marginTop: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--t3)' }}>
            This page is a starting template, not legal advice — review it with a professional before relying on
            it for a live product handling real financial data.
          </p>
        </div>
      </div>
    </div>
  )
}
