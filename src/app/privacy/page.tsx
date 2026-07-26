import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Flousy',
  description: 'How Flousy collects, stores and protects your personal budget data.',
}

const UPDATED = '26 July 2026'

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
      <Link href="/" style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none' }}>&larr; Back</Link>

      <h1 className="f-display" style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', margin: '18px 0 6px' }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 30 }}>Last updated {UPDATED}</p>

      <div className="legal">
        <p>
          Flousy (&ldquo;the app&rdquo;, &ldquo;we&rdquo;) is a personal budgeting tool. This policy explains what
          data we hold, why, and what control you have over it. We have tried to keep it in plain language.
        </p>

        <h2>The short version</h2>
        <ul>
          <li>Your budget data is private to your account and is never sold or shared.</li>
          <li>We collect the minimum needed to run the service: your sign-in identity and the budget data you enter.</li>
          <li>You can export everything as CSV, and delete your account and all data, at any time from Settings.</li>
        </ul>

        <h2>Who is responsible for your data</h2>
        <p>
          The operator of this instance of Flousy is the data controller. If you are running or deploying Flousy
          yourself, you are the controller for your users&rsquo; data and should replace this section with your own
          contact details and legal entity.
        </p>

        <h2>What we collect</h2>
        <h3>Account information</h3>
        <p>
          When you sign up we store your email address, display name and (if you sign in with Google) your profile
          photo URL. Authentication is handled by Google Firebase Authentication. If you use email and password,
          your password is never visible to us or stored in our database &mdash; Firebase handles it.
        </p>
        <h3>Budget data</h3>
        <p>
          Everything you enter in the app: monthly income and budgets, expenses and fixed charges (description,
          amount, category, date, money place), saving goals, custom categories, your chosen currency and budgeting
          strategy.
        </p>
        <h3>What we do not collect</h3>
        <p>
          We do not connect to your bank, and we never ask for card numbers, account numbers or banking credentials.
          The app has no advertising or third-party tracking scripts.
        </p>

        <h2>Why we process it (legal bases)</h2>
        <ul>
          <li><strong>Contract</strong> &mdash; to provide the budgeting service you signed up for.</li>
          <li><strong>Legitimate interests</strong> &mdash; to keep the service secure and prevent abuse.</li>
          <li><strong>Consent</strong> &mdash; for anything optional, which you can withdraw at any time.</li>
        </ul>

        <h2>Where it is stored</h2>
        <p>
          Data is stored in Google Cloud Firestore, operated by Google. Depending on how this instance is
          configured, that may involve transfers outside your country, including to the United States, under
          Google&rsquo;s standard contractual clauses. Access is restricted by security rules so that only your
          signed-in account can read or write your documents.
        </p>

        <h2>How long we keep it</h2>
        <p>
          For as long as your account exists. When you delete your account, your profile, every month of budget data
          and all saving goals are permanently removed. Backups held by the infrastructure provider may persist for a
          short period before rotating out.
        </p>

        <h2>Your rights</h2>
        <p>
          Under the GDPR and similar laws you have the right to access, correct, export, restrict, object to the
          processing of, and erase your personal data. The app implements the two that matter most directly:
        </p>
        <ul>
          <li><strong>Export</strong> &mdash; Settings &rarr; Export my data (CSV).</li>
          <li><strong>Erasure</strong> &mdash; Settings &rarr; Delete account. This is immediate and irreversible.</li>
        </ul>
        <p>You also have the right to lodge a complaint with your local data protection authority.</p>

        <h2>Sub-processors</h2>
        <ul>
          <li><strong>Google Firebase</strong> (Authentication, Firestore) &mdash; identity and data storage.</li>
          <li><strong>Your hosting provider</strong> (e.g. Vercel) &mdash; serves the application and processes standard server logs.</li>
        </ul>

        <h2>Cookies</h2>
        <p>
          Flousy sets no advertising or analytics cookies. Firebase Authentication stores a session token in your
          browser&rsquo;s local storage so you stay signed in; clearing site data signs you out.
        </p>

        <h2>Children</h2>
        <p>Flousy is not directed at children under 16 and we do not knowingly collect their data.</p>

        <h2>Changes</h2>
        <p>
          If this policy changes materially we will update the date at the top and, where appropriate, notify you in
          the app.
        </p>

        <h2>Contact</h2>
        <p>
          For any privacy question or to exercise a right not covered by the in-app controls, contact the operator of
          this instance.
        </p>

        <p style={{ marginTop: 34 }}>
          <Link href="/terms">Read the Terms of Service &rarr;</Link>
        </p>
      </div>
    </main>
  )
}
