# Flousy — MVP Readiness

> Last updated: 2026-07-26 · Branch: `arena/019f9fe2-mybudget-app`

**Status: MVP-ready.** All ship-blocking and high-priority items are done.
`npm run check` (typecheck + lint + 57 tests) and `npm run build` pass green.

---

## 1. Definition of "MVP ready"

- [x] Every record can be created, **edited**, and deleted
- [x] Money accounting is internally consistent (no leaks, no fabricated numbers)
- [x] Privacy Policy + Terms published and linked
- [x] Users can export and delete all their own data
- [x] Firestore rules validate shape, not just ownership
- [x] Errors are caught by boundaries and routed to a reporting seam
- [x] Currency is not hardcoded
- [x] `lint` + `build` + `test` run green in CI

---

## 2. Critical blockers — all resolved

- [x] **B1 · No edit for any record.** `ExpenseModal`, `FixedModal` and `SavingGoalModal` each handle create *and* edit; edit buttons added on every row. Editing an amount applies only the difference to the money place.
- [x] **B2 · Deleting a saving goal leaked money.** `releaseGoalFunds()` returns the balance to its money place, and the confirm dialog states exactly how much is coming back.
- [x] **B3 · No withdraw-from-goal flow.** `GoalTransferModal` handles deposit and withdraw, clamped to what the goal holds.
- [x] **B4 · Money places didn't decrement on spend.** Every expense now records a `place`; `applySpendDelta()` debits on add, refunds on delete, applies the difference on edit, and moves money between places when the place itself changes. Legacy rows backfill to `bank`.
- [x] **B5 · "Spend Trajectory" chart was fake.** Replaced hardcoded 18/35/56/82% with real weekly buckets derived from transaction dates, plus an honest empty state.
- [x] **B6 · No Privacy Policy / Terms.** `/privacy` and `/terms` written and linked from the login screen, settings and landing footer.
- [x] **B7 · Firestore rules had no validation.** Rules now check document shape, field whitelists, numeric ranges, array caps (2000 expenses / 500 fixed / 200 goals), a 400 KB size ceiling, and pin `plan` to `free` so a client can't self-promote to Pro.
- [x] **B8 · `.next/` not gitignored.**
- [x] **B9 · Six stale `.diff` files.** Deleted (3,136 lines).
- [x] **B10 · Strategy applied to the wrong axis.** (Previous turn.) Strategies drive needs/wants/savings, never money placement.

---

## 3. High priority — all resolved

- [x] **H1 · Currency hardcoded to MAD.** 12 currencies, picked during onboarding and changeable in Settings; `useCurrency()` threads formatting through every component.
- [x] **H2 · `window.confirm`.** Replaced by an accessible in-app `ConfirmProvider` / `useConfirm()`.
- [x] **H3 · No error boundaries.** Added `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`.
- [x] **H4 · Weak validation.** Zod schemas reject empty, `NaN`, `Infinity`, negative and absurd values; errors render inline per field.
- [x] **H6 · No data export.** CSV export of budgets, transactions and goals, with RFC-4180 escaping, CSV-injection neutralisation and a UTF-8 BOM.
- [x] **H7 · No account deletion.** `deleteAllUserData()` clears subcollections then the profile, then the auth record, with re-auth handling.
- [x] **H8 · Popup-only Google sign-in.** Detects in-app browsers up front and falls back to redirect on popup failure.
- [x] **H9 · No email verification.** Verification email sent on signup.
- [x] **H10 · `listMonths()` dead code.** Now powers the export.
- [x] **H11 · Accessibility gaps.** Pinch-zoom restored (was a WCAG 1.4.4 failure), focus-visible rings, `role="dialog"` + focus trap + Escape + focus restore, aria labels, `prefers-reduced-motion`.

---

## 4. Medium priority — all resolved

- [x] **M1 · 1,281-line dashboard.** Split into `components/{ui,modals,tabs}`; `dashboard/page.tsx` is now ~590 lines of orchestration.
- [x] **M2 · No linting.** ESLint + Prettier, `npm run lint` clean.
- [x] **M3 · No tests.** 57 Vitest tests across store, validation, export and end-to-end money flows.
- [x] **M4 · No CI.** GitHub Actions runs typecheck → lint → test → build.
- [x] **M6 · No optimistic rollback.** `persist()` snapshots previous state and restores it on failure.
- [x] **M8 · Weak ids.** `crypto.randomUUID()` with a fallback.
- [x] **M9 · Package name mismatch.** Now `flousy`.
- [x] **M11 · Render-blocking font `@import`.** Replaced with preconnect + stylesheet link. *(Deliberately not `next/font`: it fetches at build time, which breaks builds on restricted networks and CI.)*
- [x] **M12 · No dark mode.** Full `prefers-color-scheme: dark` palette; chrome and chart tooltips tokenised.
- [x] Analytics + error reporting seam (`lib/analytics.ts`) — no-ops until a provider is configured, so the privacy policy stays accurate.
- [x] Service worker for offline app shell; deliberately never caches Firestore/Auth traffic.
- [x] Search + category filter on expenses.
- [x] Landing page at `/` (previously an immediate redirect to login).
- [x] Friendly auth error messages instead of raw Firebase codes.

### Deferred (deliberate)
- [ ] **M5 · Tailwind vs inline styles.** Cosmetic inconsistency, no user impact. Large mechanical diff — better as its own PR.
- [ ] **M7 · Whole-document writes.** Fine to ~2000 transactions/month (now rule-enforced). Revisit with a `transactions` subcollection if usage demands.
- [ ] **M10 · Build-time env validation.** Runtime check already fails clearly.
- [ ] **M13 · Dependency majors** (Next 14→16, React 18→19, Tailwind 3→4). Each needs its own migration + regression pass.

---

## 5. Remaining features (post-MVP)

| Feature | Effort | Notes |
|---|---|---|
| Stripe / Lemon Squeezy payments | L | `plan` field exists and is now rule-protected; needs Checkout + webhook using the Admin SDK. |
| Pro feature gating | M | Decide what's gated before wiring payments. |
| Recurring / auto-repeating fixed charges | M | Currently re-entered each month. |
| Multi-month history & trends view | M | Data and `listMonths()` already available. |
| Data import (CSV) | M | Migration path from spreadsheets. |
| Budget alerts / notifications | M | "You've used 80% of Alimentation". |
| i18n (FR / AR) | L | Category names are French, UI is English; Arabic matters for the target market. |
| Shared / household budgets | L | "Queen"/"King" categories imply couples usage; rules are strictly single-user. |
| Transfers between money places | — | ✅ Shipped as **Move money**. |
| Multiple income sources | M | Only a single `totalBudget` today. |
| Notes / receipt photo on a transaction | M | Needs Firebase Storage + rules. |
| Bank sync (Plaid / Tink) | XL | Post-MVP. |
| The `person` field on `VariableExpense` | S | Declared in the type, still unused — either surface it or drop it. |

---

## 6. Before you deploy

1. **Deploy the new Firestore rules** — they're stricter than before and the app depends on them:
   `firebase deploy --only firestore:rules`
2. Set the six `NEXT_PUBLIC_FIREBASE_*` variables in your host.
3. Add your production domain to Firebase → Authentication → Settings → Authorized domains.
4. Review `/privacy` and `/terms` — they carry placeholders for the operating entity and governing jurisdiction that need your real details.
5. Optional: set `NEXT_PUBLIC_ANALYTICS=plausible` (or `ga`) and add the provider script to activate the telemetry seam.
