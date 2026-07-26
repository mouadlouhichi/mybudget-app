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
5. Deploy the included security rules. They restrict every document to its
   owner **and** validate document shape, field whitelists, numeric ranges and
   array sizes — the app depends on them being deployed:
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

## Scripts

```bash
npm run dev         # start the dev server
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run test        # vitest (57 tests)
npm run check       # typecheck + lint + test
```

## Features

- Email/password and Google sign-in (with redirect fallback for in-app
  browsers), password reset and email verification
- **Budgeting strategies** — 50/30/20, zero-based, envelope or
  pay-yourself-first. A strategy splits income into needs / wants / savings
  envelopes and scales your category budgets to fit them. It deliberately
  says nothing about *where* cash sits.
- **Money places** — track cash across bank, home and wallet. All income
  starts in the bank; "Move money" transfers between places. Every expense
  records which place it was paid from and debits it, so the balances stay
  true. Adding, editing and deleting all reconcile correctly.
- **Saving goals** — global (they survive month rollover), with deposit and
  withdraw. Deleting a funded goal returns its balance rather than
  vaporising it.
- Variable expenses and fixed charges with full create/edit/delete, search
  and category filtering
- Custom categories with colour and icon pickers
- 12 currencies, chosen at onboarding and changeable in Settings
- CSV export of everything, and one-click account deletion (GDPR)
- Month-to-month navigation, live Firestore sync, optimistic writes with
  rollback on failure
- Dark mode, keyboard-accessible dialogs, installable PWA with an offline
  app shell
- Free/Pro plan field is modeled and **rule-protected** — a client cannot
  promote itself. The "Go Pro" entry point is intentionally disabled until a
  payment provider is wired up; flipping `users/{uid}.plan` to `'pro'` should
  only ever happen server-side via the Admin SDK.

## Testing

```bash
npm run test
```

57 Vitest tests cover the money math end to end: strategy envelopes always
sum to the income exactly, category budgets fill their envelope to the
dirham, and add → edit → delete cycles for expenses and saving goals always
return to the starting balance. The core invariant under test is that money
is never silently created or destroyed.

## Known follow-ups

- **Payments**: no Stripe/Lemon Squeezy integration yet
- **Legal pages**: `/privacy` and `/terms` exist but carry placeholders for
  the operating entity and governing jurisdiction — fill these in
- **Analytics**: a provider-agnostic seam exists in `src/lib/analytics.ts`;
  set `NEXT_PUBLIC_ANALYTICS=plausible` (or `ga`) and add the provider script
  to activate it. Nothing is sent anywhere by default.
- **Rate limiting**: rules validate shape and size but don't rate-limit
  writes; revisit before scaling
- **i18n**: UI is English while the default categories are French; Arabic
  support matters for the target market
