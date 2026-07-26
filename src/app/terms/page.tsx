import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Flousy',
  description: 'The terms that govern your use of Flousy.',
}

const UPDATED = '26 July 2026'

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
      <Link href="/" style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none' }}>&larr; Back</Link>

      <h1 className="f-display" style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', margin: '18px 0 6px' }}>
        Terms of Service
      </h1>
      <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 30 }}>Last updated {UPDATED}</p>

      <div className="legal">
        <p>
          These terms govern your use of Flousy. By creating an account you agree to them. If you do not agree,
          please do not use the app.
        </p>

        <h2>1. What Flousy is</h2>
        <p>
          Flousy is a personal budgeting tool for recording income, expenses and saving goals. It is a
          record-keeping aid: <strong>it is not financial, investment, tax or legal advice</strong>, and it does not
          connect to your bank accounts.
        </p>

        <h2>2. Your account</h2>
        <p>
          You need an account to use the app. You are responsible for keeping your sign-in credentials secure and
          for all activity under your account. Provide accurate information when signing up, and tell the operator
          promptly if you believe your account has been compromised.
        </p>
        <p>You must be at least 16 years old to use Flousy.</p>

        <h2>3. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the app for anything unlawful, or to store unlawful content.</li>
          <li>Attempt to access another user&rsquo;s data, or probe, scan or test the security of the service.</li>
          <li>Interfere with or disrupt the service, or place unreasonable load on it through automated means.</li>
          <li>Reverse engineer or resell the service except where that right cannot lawfully be restricted.</li>
        </ul>

        <h2>4. Your data</h2>
        <p>
          You own the budget data you enter. You grant us only the permission needed to store and display it back to
          you as part of running the service. Our handling of personal data is described in the{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          You can export your data as CSV, and delete your account and all associated data, from Settings at any
          time. Deletion is permanent.
        </p>

        <h2>5. Availability</h2>
        <p>
          The service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do not guarantee
          uninterrupted or error-free operation, and we may change, suspend or discontinue features. We will make
          reasonable efforts to give notice of significant changes.
        </p>

        <h2>6. Accuracy and your own records</h2>
        <p>
          Figures shown in the app are derived from what you enter. We are not responsible for financial decisions
          taken on the basis of that information. Keep independent records of anything important &mdash; the export
          feature exists for exactly this purpose.
        </p>

        <h2>7. Paid plans</h2>
        <p>
          Flousy is currently free to use. A paid &ldquo;Pro&rdquo; tier may be introduced in future; if so, pricing,
          billing and refund terms will be presented before you are asked to pay, and existing free functionality
          will not be removed retroactively without notice.
        </p>

        <h2>8. Liability</h2>
        <p>
          To the maximum extent permitted by law, the operator is not liable for indirect, incidental or
          consequential losses, or for loss of profits, revenue or data, arising from your use of the service.
          Nothing in these terms excludes liability that cannot lawfully be excluded, including for death or personal
          injury caused by negligence, or for fraud.
        </p>

        <h2>9. Termination</h2>
        <p>
          You may stop using Flousy and delete your account at any time. We may suspend or terminate an account that
          breaches these terms or poses a risk to the service or other users.
        </p>

        <h2>10. Changes to these terms</h2>
        <p>
          We may update these terms. Material changes will be reflected in the date above and, where appropriate,
          notified in the app. Continuing to use the service after a change means you accept the updated terms.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These terms are governed by the laws of the jurisdiction in which the operator of this instance is
          established, without regard to conflict-of-law rules.
        </p>

        <h2>12. Contact</h2>
        <p>Questions about these terms should go to the operator of this instance.</p>

        <p style={{ marginTop: 34 }}>
          <Link href="/privacy">Read the Privacy Policy &rarr;</Link>
        </p>
      </div>
    </main>
  )
}
