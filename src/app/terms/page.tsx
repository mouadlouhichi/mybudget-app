import Link from 'next/link'
import { CaretLeft, Wallet } from '@phosphor-icons/react/dist/ssr'

export const metadata = { title: 'Terms of Service — Flousy' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 className="f-display" style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--t2)' }}>{children}</div>
    </div>
  )
}

export default function TermsPage() {
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
        <h1 className="f-display" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Terms of Service</h1>
        <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 32 }}>Last updated: July 2026</p>

        <Section title="Using Flousy">
          Flousy is a personal budgeting tool for tracking income, expenses, savings, and debts or credits. By
          creating an account you agree to use it only for lawful, personal financial tracking.
        </Section>
        <Section title="Your account">
          You&rsquo;re responsible for keeping your login credentials secure and for the accuracy of the data you
          enter. You can delete your data or account at any time.
        </Section>
        <Section title="No financial advice">
          Flousy helps you organize and visualize numbers you provide. Nothing in the app — budgets, projections,
          category suggestions, or the &ldquo;on track / over budget&rdquo; status — is financial, legal, or tax
          advice.
        </Section>
        <Section title="Free plan & Pro plan">
          The free plan covers core budgeting for a single account. A Pro plan with expanded limits and features
          is planned but not yet billed; if introduced, pricing and what&rsquo;s included will be shown before you
          &rsquo;re charged, and you can cancel at any time.
        </Section>
        <Section title="Service availability">
          Flousy is provided &ldquo;as is.&rdquo; We aim for reliable uptime but don&rsquo;t guarantee the service
          will be uninterrupted or error-free, and we recommend keeping your own backups of anything critical.
        </Section>
        <Section title="Changes">
          We may update these terms as the product evolves. Continued use after a change means you accept the
          updated terms.
        </Section>
        <Section title="Contact">
          Questions about these terms can be sent to the app&rsquo;s support contact provided at sign-up.
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
