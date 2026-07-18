# Flousy — Personal Budget Tracker

A mobile-first personal budget tracker (Next.js 14 + Firebase). Track variable
expenses, fixed monthly charges, and saving goals, with per-category budgets
and month-over-month history.

## 1. Prerequisites

- Node.js 18+
- A free [Firebase](https://console.firebase.google.com) project

## 2. Set up Firebase

1. Create a project at https://console.firebase.google.com
2. **Authentication** → Sign-in method → enable **Email/Password** and **Google**
3. **Firestore Database** → create a database (production mode is fine — rules are provided)
4. Project settings → General → "Your apps" → add a **Web app** → copy the config values
5. Deploy the included security rules so users can only ever read/write their own data:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add          # pick your project
   firebase deploy --only firestore:rules
   ```
   Without this step, Firestore's default rules will block all reads/writes
   (safe, but the app will look broken) or — if you chose "test mode" — allow
   **anyone** to read/write **anyone's** data. Always deploy `firestore.rules`.

## 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the six `NEXT_PUBLIC_FIREBASE_*` values from step 2. The app checks
for these on load — if any are missing, both `/login` and `/dashboard` show
a clear "Firebase isn't configured" screen instead of crashing.

## 4. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 5. Deploy

The app is a standard Next.js app — deploy to [Vercel](https://vercel.com) (recommended),
Netlify, or any Node host:

```bash
vercel
```

Set the six `NEXT_PUBLIC_FIREBASE_*` environment variables in your hosting
provider's dashboard (same values as `.env.local`).

Also add your production domain to **Firebase Console → Authentication →
Settings → Authorized domains**, or Google/email sign-in will be rejected.

## Features

- Email/password and Google sign-in, with password reset
- Per-month budgets: total, home/wallet split
- Variable expenses by category, with editable per-category budget caps
- Fixed monthly charges by type, with actual vs. budgeted tracking
- Saving goals (active/pending) with progress tracking
- Month-to-month navigation, all data synced live via Firestore
- Installable as a PWA (manifest + icons included)
- Free/Pro plan field already modeled in the data layer — the in-app "Go Pro"
  entry point is intentionally shown as **disabled ("Soon")** rather than a
  fake working button, since no payment provider is wired up yet. To turn
  this into a real paid tier, add Stripe Checkout + a webhook that flips
  `users/{uid}.plan` to `'pro'`.

## Known follow-ups before a public launch

- **Payments**: no Stripe/Lemon Squeezy integration yet (see above)
- **Legal pages**: add a Privacy Policy and Terms of Service before accepting
  real users/payments
- **Analytics**: no product analytics wired up (PostHog/Plausible/GA)
- **Rate limiting / abuse**: Firestore rules stop cross-user access but don't
  rate-limit writes; fine for a personal-use MVP, revisit before scaling
- **Google Sign-In popups**: uses `signInWithPopup`; consider
  `signInWithRedirect` as a fallback for browsers/webviews that block popups
