# FULL SITE UPDATE PROMPT — Flousy (from README.md)

> **Objective:** Completely replace/update the content and design of the deployed site at  
> `https://optimus-the-ai-platform-to-7e5g9hznv-mouadlouhichis-projects.vercel.app/`  
> using the full content of `mybudget-app/README.md`. Rebrand as **Flousy**.  
> Keep it a single-page landing / marketing site (not the full app), but reflect every major section from the README with accurate copy, features, architecture notes, and design direction.

---

## 1. BRAND & VISUAL IDENTITY

### Brand
- **Name:** Flousy
- **Tagline (hero):** *"A private, mobile-first budget tracker that knows the difference between what your money is for and where it actually is."*
- **Tone:** Calm, precise, trustworthy, slightly editorial. Avoid hype words. Use clean typography.

### Colors (from `design/flousy_dashboard_dark/code.html` and README badges)
| Token | Hex | Use |
|---|---|---|
| `primary` | `#00685f` | Main CTAs, links, active states |
| `primary-container` | `#008378` | Elevated buttons / badges |
| `primary-fixed-dim` | `#6bd8cb` | Icons, subtle highlights |
| `primary-fixed` | `#89f5e7` | Accent icons / tags |
| `surface` | `#f5faf8` | Page background (light mode) |
| `inverse-surface` | `#2c3130` | Page background (dark mode) |
| `surface-variant` / `surface-container` | `#eaefed` / `#e4e9e7` | Cards, sections |
| `outline-variant` | `#bcc9c6` | Subtle borders, dividers |
| `on-surface` | `#171d1c` | Main text |
| `on-background` | `#171d1c` | Body text |
- **Dark mode:** Apply `.dark` class toggling the palette exactly as shown in design files. Default to dark if user has no preference, or provide a manual toggle.

### Typography
- **Font:** `Inter` (Google Fonts, weights 400–700).
- **Headlines:** Tight letter-spacing (`-0.02em` for lg), bold.
- **Labels:** `font-label-md` style — `12px`, `letter-spacing: 0.05em`, uppercase tracking.
- **Body:** `14px` / `line-height: 20px` (`font-body-md`); larger sections `16px` (`font-body-lg`).

### Visual Language
- **Glass / soft cards:** `bg-surface-variant/10` with `border: 1px solid outline-variant/30`, rounded `2xl`, subtle shadow (`soft-depth-card`).
- **Icons:** Material Symbols Outlined (via Google Fonts), weight 400 default, fill 1 for active/nav items.
- **Spacing:** `gap-lg` (`24px`), mobile padding `px-margin-mobile` (`16px`), desktop `md:px-margin-desktop` (`48px`).
- **Corners:** `rounded-xl` for cards, `rounded-2xl` for large sections, `rounded-full` for pills / avatars.

---

## 2. PAGE STRUCTURE (Single-Page, Sectioned)

Implement as a responsive landing page (`/`) with anchor navigation to sections. Each section maps directly to a major README heading. Include smooth scroll, sticky header, and a bottom CTA.

### 2.1 Header / Navigation (Sticky)
- **Left:** Logo text "Flousy" with a small teal circle icon (`primary-fixed`).
- **Right nav links (anchor):** Why Flousy · Features · Quick Start · Architecture · Security · Privacy · Roadmap
- **CTA button:** "Open App" linking to `/` or a placeholder sign-in URL (use a styled button with `primary-container` bg, white text, `rounded-xl`, hover scale).
- **Mobile:** Collapsible hamburger with slide-down menu; same links.
- **Theme toggle:** Sun / Moon icon switching `.dark` class on `<html>`; persist in `localStorage`.

---

## 3. SECTION-BY-SECTION CONTENT & DESIGN

### Section A — Hero (`#why-flousy` or top anchor)
**Copy (from README "Why Flousy"):**
- **Headline (h1):** "A private, mobile-first budget tracker that knows the difference between what your money is for and where it actually is."
- **Sub-headline / explanation:** Use the table from README:
  - *What is this money for?* → Budget envelope (needs / wants / savings)
  - *Where is this money sitting?* → Money place (bank / home / wallet)
- **Visual:** Split layout. Left: large headline + brief paragraph + two CTAs ("Get Started" / "Read Docs"). Right: a stylized card illustration showing two axes — "Envelopes" and "Places" — with small icons (`assignment`, `home`, `account_balance_wallet`). Use the design's glass-card aesthetic (`bg-surface-variant/5`, `rounded-2xl`, `soft-depth-card`).
- **Background:** Subtle gradient mesh or solid `surface` / dark `inverse-surface`.
- **Badge row:** Below headline, show badges from README top matter: CI, Tests (57 passing), Next.js 14, TypeScript strict, Firebase, PWA. Use pill-shaped badges (`rounded-full`, `bg-surface-variant`, `text-label-sm`, `uppercase`).

### Section B — Why Flousy (Anchor `#why-flousy`)
**Copy:**
- Repeat the core invariant: *"Every dirham is conserved. Log an expense and the money leaves a real place. Delete it and it comes back. Fund a savings goal and it moves out of your account; withdraw and it returns."*
- Include the table comparing "What is it for?" vs "Where is it?" exactly as in README.
- Add a small stat box: **"57 tests enforce the money math."** Styled prominently (`headline-lg`, primary color).
- **Design:** Clean two-column text + a compact illustration/card showing the invariant cycle (arrow loop: Expense → Place → Restore). Dark background section with `inverse-surface`, white text.

### Section C — Features (Anchor `#features`)
**Structure:** Three sub-columns or a bento-style grid matching design files.

#### C1 — Budgeting
- **Headline:** "Four strategies. Zero guesswork."
- **Bullets (from README):**
  - 50/30/20, Zero-Based, Envelope, Pay-Yourself-First.
  - Each splits income into **needs / wants / savings** (always sum to 100%).
  - Auto-scaled category budgets (pick fewer categories → bigger slice; envelope never underspent).
  - Guided onboarding: income → categories → bills → strategy → review.
  - Editable per-category caps + live Budget Plan card.
- **Visual:** Small card showing a progress bar (like design `flousy_dashboard_dark`) — category name, amount spent / cap, colored bar (primary for under budget, error/tertiary for over).

#### C2 — Money Tracking
- **Headline:** "Three places. Every dirham accounted for."
- **Bullets:**
  - Places: Bank, Home, Wallet. All income starts in bank; explicit "Move money" transfers conserve total.
  - Every expense records **which place** and debits it. Add / edit / delete reconcile correctly (edit to different place refunds old, debits new).
  - Variable + fixed monthly charges with full CRUD, search, category filtering.
  - Saving goals are **global** (survive rollover) with deposit + withdraw. Deleting a funded goal **returns balance** rather than destroying it.
  - Month-to-month navigation; new month inherits plan with clean transaction slate.
- **Visual:** Three small stacked cards (Bank / Home / Wallet) with amounts and small trend arrows (`+2.4%` style from design).

#### C3 — Platform
- **Headline:** "Built for privacy and portability."
- **Bullets:**
  - Email/password + Google sign-in, redirect fallback for in-app browsers, password reset, email verification.
  - 12 currencies: MAD, EUR, USD, GBP, CAD, CHF, AED, SAR, EGP, TND, DZD, XOF — locale-aware formatting.
  - Custom categories with colour + icon picker.
  - CSV export + one-click account deletion.
  - Live Firestore sync with optimistic writes + rollback on failure.
  - Dark mode, keyboard-accessible dialogs, installable PWA with offline app shell.
- **Visual:** Icon grid (6 items) using Material Symbols (`email`, `google`, `currency_exchange`, `palette`, `download`, `delete`) in a `grid-cols-3` layout, colored circles (`primary-fixed-dim` background) with white icons.

---

### Section D — Quick Start (Anchor `#quick-start`)
**Copy (from README):**
- Prerequisites: Node.js 18+, free Firebase project.
- Commands (code block, dark `bg-inverse-surface`, `rounded-xl`, monospace font):
  ```bash
  git clone https://github.com/mouadlouhichi/mybudget-app.git
  cd mybudget-app
  npm install
  cp .env.local.example .env.local   # fill in Firebase values
  npm run dev
  ```
- Note block (callout style, `bg-primary-container/10`, `border-l-4 border-primary`): *"Missing or incomplete Firebase credentials won't crash the app — `/login` and `/dashboard` render a clear 'Firebase isn't configured' screen instead."*
- **Design:** Split layout — left: title + steps; right: a terminal/code screenshot style card. Use the exact command block formatting.

---

### Section E — Firebase Setup (Anchor `#firebase-setup`)
**Copy:** Include the 5-step expandable details from README. On the landing page, simplify to an ordered list with brief descriptions, but keep the critical warning.
- **Warning callout (prominent):** *"Always deploy `firestore.rules`. Without it, Firestore either blocks every read/write or — if you picked test mode — lets anyone read and write anyone's financial data."*
- **Steps:** 1) Create project · 2) Enable Auth (Email + Google) · 3) Create Firestore DB · 4) Register web app · 5) Deploy rules (`firebase deploy --only firestore:rules`).
- **Design:** Numbered steps with small teal numbered circles (`primary-container` bg, white number). Include a compact terminal snippet for step 5.

---

### Section F — Environment Variables (Anchor `#env` or embedded in Quick Start)
- **Table:** 6 required variables (`NEXT_PUBLIC_FIREBASE_*`) mapped to where to find them. Use a clean HTML table (`w-full`, `text-sm`, alternating row colors from `surface-variant/5`).
- **Optional:** `NEXT_PUBLIC_ANALYTICS` (`plausible` or `ga`). Note: *Unset = nothing is ever sent.*
- **Design:** Card container (`rounded-2xl`, `soft-depth-card`) wrapping the table.

---

### Section G — Scripts (Anchor `#scripts`)
- **Table:** Commands (`dev`, `build`, `start`, `typecheck`, `lint`, `test`, `test:watch`, `format`, `check`). Highlight `npm run check` (typecheck + lint + test) as the pre-push command with a small star badge (`primary-fixed`).
- **Design:** Two-column responsive table; command in monospace (`font-mono`, `text-primary`), description in body text.

---

### Section H — Architecture (Anchor `#architecture`)
**Copy / Diagram:** Reproduce the directory tree exactly as in README:
```
src/
├── app/ ...
├── components/ ...
└── lib/ ...
```
- **Design notes (from README):** Three bullet points about `store.ts` (pure functions), dashboard orchestration, and design tokens in CSS variables.
- **Visual:** A file-tree card using a monospace font (`font-mono`, `text-sm`), indented lines with small folder/file icons (`folder`, `description`). Dark background for the code block.
- **Highlight:** Use teal left-border (`border-l-2 border-primary`) for the design notes.

---

### Section I — Core Concepts (Anchor `#core-concepts`)
**Sub-sections:**

1. **Envelopes vs Money Places**
   - Show the ASCII diagram from README:
     ```
     INCOME  ─┬─► envelopes  (what it's FOR)    needs · wants · savings
              └─► places     (where it IS)      bank  · home  · wallet
     ```
   - Emphasize independence: strategy sets envelope shares; it never decides placement.

2. **Strategies Table**
   - Replicate the table: 50/30/20 (default), Zero-Based, Envelope, Pay Yourself First — with percentages.
   - Note: *"Shares always total 100%, and envelope amounts always sum to your exact income — the savings envelope absorbs any rounding remainder."*

3. **Category Buckets**
   - Include the TypeScript snippet (`bucketOf`) and explanation: *"Unknown custom categories default to wants for variable spending and needs for fixed bills."*
   - Style code snippet in a dark card with syntax-colored text (teal for keywords, white for strings).

4. **Money Conservation**
   - Replicate the action table exactly (Add, Edit amount, Edit place, Delete, Fund, Withdraw, Delete funded, Move).
   - Add a small note: *"Places clamp at zero and never display a negative balance."*

---

### Section J — Data Model (Anchor `#data-model`)
- **Visual:** A document-tree diagram using `font-mono` and indentation:
  - `users/{uid}` (UserProfile: `plan`, `currency`, `onboardingComplete`)
  - `users/{uid}/months/{YYYY-MM}` (MonthBudget fields)
  - `users/{uid}/data/savings` (SavingsData: goals array)
- **Note callout:** *"Saving goals are global, not per-month."*
- **Upgrade note:** *"Documents written by older versions are upgraded on read by `normalizeMonth()`."*

---

### Section K — Security (Anchor `#security`)
- **Headline:** "Rules enforced, not just suggested."
- **Bullet list from README:**
  - Only `request.auth.uid == uid` can read/write.
  - Field whitelists — unknown fields rejected.
  - Numeric ranges (`0 … 1e9`).
  - Array caps (2,000 variable, 500 fixed, 200 goals).
  - 400 KB document ceiling.
  - Month ID regex (`^[0-9]{4}-[0-9]{2}$`).
  - `plan` pinned to `'free'` — client cannot promote.
- **Warning:** *"Upgrading a user to Pro must happen server-side via the Admin SDK."*
- **Other measures:** Zod validation, CSV-injection neutralisation, no bank connections ever.
- **Design:** Dark card (`inverse-surface` bg) with red/primary accent lines for rules; clean checklist with teal checkmarks (`✓`) before each item.

---

### Section L — Testing (Anchor `#testing`)
- **Headline:** "57 tests. Zero rounding leaks."
- **Stats:** Show the 4 suites (`store`, `flows`, `validation`, `export`) with test counts in small badge cards (`rounded-xl`, `bg-surface-variant`, `primary-fixed` text).
- **Key assertions:** Replicate the bullet list from README (envelope shares sum to `1`, amounts sum exactly to income, category budgets fill to dirham, add → edit → delete returns exact balance, fund → withdraw → delete conserves cash).
- **Visual:** Small data cards showing sample test inputs (`1`, `7`, `12345`, `1000001`) with a green confirmation badge.

---

### Section M — Accessibility (Anchor `#accessibility`)
- **Headline:** "Built to be used by everyone."
- **Bullets:**
  - Pinch-zoom enabled (`maximum-scale=1` removed) — WCAG 1.4.4.
  - Dialogs: `role="dialog"`, `aria-modal`, focus trap, Escape close, focus restored, scroll locked.
  - Visible `:focus-visible` rings.
  - `aria-pressed`, `aria-current`, `aria-expanded`, `aria-label`.
  - Inline validation errors with `role="alert"`.
  - Full `prefers-reduced-motion` support.
- **Design:** Simple icon + text list; use accessibility icon (`accessibility`) in `primary-fixed-dim` circle.

---

### Section N — Progressive Web App (Anchor `#pwa`)
- **Headline:** "Installable. Offline-ready. Never stale."
- **Copy:**
  - Installable on iOS and Android with manifest, maskable icons, service worker caching app shell.
  - **Important:** Service worker deliberately never caches Firestore or Auth traffic. Only registers in production.
- **Visual:** Phone mockup or icon grid showing PWA features (`install` icon, `offline_pin` icon, `sync` icon with a red cross over it for "no stale data").

---

### Section O — Deployment (Anchor `#deployment`)
- **Headline:** "Standard Next.js. Any host."
- **Copy:**
  - Deploy to Vercel (`vercel`), Netlify, or any Node host.
  - Pre-flight checklist (checkbox list):
    - [ ] Set 6 `NEXT_PUBLIC_FIREBASE_*` variables.
    - [ ] Deploy `firestore.rules`.
    - [ ] Add domain to Firebase Auth → Authorized domains.
    - [ ] Fill placeholders in `/privacy` and `/terms`.
    - [ ] Optionally set `NEXT_PUBLIC_ANALYTICS`.
- **Design:** Checklist card with interactive-style checkboxes (styled `div` elements, not native inputs, for visual consistency — or real checkboxes for accessibility).

---

### Section P — Continuous Integration (Anchor `#ci`)
- **Headline:** "Typecheck. Lint. Test. Build. Every push."
- **Copy:** Workflow runs `typecheck → lint → test → build`. File at `ci/github-actions-ci.yml`. Activation instructions: `mkdir -p .github/workflows`, move file, commit, push.
- **Visual:** A horizontal pipeline diagram with 4 connected circles (`typecheck`, `lint`, `test`, `build`) connected by lines/arrows. Active state in `primary`, completed in `primary-fixed-dim`.

---

### Section Q — Privacy & Your Data (Anchor `#privacy`)
- **Headline:** "Your budget is yours alone."
- **Bullets:**
  - Data is private — never sold or shared.
  - No bank connections; no card/account numbers ever requested.
  - No third-party tracking (analytics opt-in, off by default).
  - CSV export from Settings at any time.
  - Delete account from Settings — clears subcollections, profile, auth record.
- **Design:** Calm, spacious section. Large text with a shield/privacy icon (`security`). Soft `surface-variant` background.

---

### Section R — Roadmap (Anchor `#roadmap`)
**Two subsections:**

1. **Shipped**
   - List the completed features exactly: edit everywhere, money-place accounting, goal withdrawals, real spend trajectory, legal pages (`/privacy`, `/terms`), CSV export, account deletion, hardened rules, 12 currencies, dark mode, offline shell, CI, 57 tests.
   - Style as a wrapped tag cloud: small teal pills (`rounded-full`, `bg-primary-fixed`, `text-on-primary-fixed`).

2. **Next**
   - Replicate the markdown table: Feature | Effort (S/M/L/XL) | Notes.
   - Features: Stripe / Lemon Squeezy payments, Recurring fixed charges, Multi-month trends, CSV import, Budget alerts, i18n (FR / AR), Shared / household budgets, Bank sync (Plaid / Tink).
   - Style as a clean table with colored effort badges (`L` in yellow/tertiary, `M` in orange, `XL` in red/error).

3. **Known Limitations**
   - Whole-document writes per month (~2,000 transactions/month); subcollection fix needed for scale.
   - Rules don't rate-limit writes.
   - Styling mixes Tailwind + inline styles + CSS variables.
- **Design:** Roadmap section split into two columns — left: shipped tags; right: next table + limitations card.

---

### Section S — Troubleshooting (Anchor `#troubleshooting`)
- **Headline:** "When something looks broken, it usually isn't."
- **Items (from README):**
  1. *"Firebase isn't configured"* → Check `.env.local`, restart dev server.
  2. *"Data won't load, or writes silently fail"* → Almost always undeployed rules (`firebase deploy --only firestore:rules`); check console for `permission-denied`.
  3. *"Google sign-in does nothing"* → Add domain to Auth settings; in-app browsers block popups — redirect fallback handles it.
  4. *"requires-recent-login" on delete"* → Sign out, sign back in; Google re-authenticates inline.
  5. *"Build fails fetching fonts"* → Fonts load via `<link>` at runtime; build succeeds — fonts fall back to system faces offline.
- **Design:** Accordion-style cards (`rounded-2xl`, `soft-depth-card`, `border-outline-variant/10`). Each has a question header (`font-label-md`, uppercase) and expandable body (`font-body-md`). Default: all collapsed; click expands with smooth height animation (optional). Use a small warning icon (`warning`) in `tertiary` color for severity.

---

### Section T — Footer (Anchor bottom)
- **Left:** Logo + tagline: *"Built with Next.js, Firebase and TypeScript."*
- **Center / Right:** Links: `README.md` (GitHub), `MVP_TODO.md`, `Privacy`, `Terms`. Add small badges/links to design assets or source code.
- **Social / Contact:** Minimal — just text links.
- **Bottom bar:** `© 2026 Flousy` or similar. Small `font-label-sm` text, muted `outline-variant` color.
- **Design:** Full-width dark footer (`bg-inverse-surface`), top border (`border-t border-outline/30`), generous vertical padding (`py-xl`), centered layout on mobile, spaced columns on desktop.

---

## 4. TECHNICAL IMPLEMENTATION REQUIREMENTS

### Framework / Stack
- **Base:** Next.js 14+ (App Router) or a static site generator — the README specifies Next.js.
- **Language:** TypeScript (`tsconfig.json` strict mode).
- **Styling:** Tailwind CSS with CSS variables / design tokens (`globals.css`). Include `postcss.config.js` and `tailwind.config.ts` extensions matching the README colors.
- **Fonts:** Inter (Google Fonts), Material Symbols Outlined (icons).
- **Icons:** Use Material Symbols via `<link>` or inline SVG; weight 400 default, `FILL` 1 for active states.

### Component Requirements
- **Reusable components:**
  - `Badge` (pill / rounded-full, label-sm, uppercase tracking)
  - `Card` (`soft-depth-card`, `rounded-2xl`, optional glass overlay)
  - `SectionTitle` (`headline-lg`, tight letter-spacing, bold)
  - `CodeBlock` (dark bg, monospace, rounded-xl, syntax-like coloring)
  - `Table` (responsive, alternating rows, clean borders)
  - `Accordion` (for troubleshooting; keyboard accessible)
- **State:** Theme toggle (`localStorage`); mobile menu (`useState`); accordion open states.

### Design Token Integration (from design files)
Copy or reference the exact `tailwind.config` theme from `design/flousy_dashboard_dark/code.html`:
- `colors` map as shown (primary, surface, inverse-surface, surface-variant, outline-variant, primary-fixed-dim, etc.).
- `fontFamily`: `Inter` for all text roles.
- `fontSize`: `label-sm`, `body-md`, `body-lg`, `headline-md`, `headline-lg-mobile`, `headline-lg`.
- `borderRadius`: `DEFAULT` (`0.25rem`), `lg`, `xl`, `2xl`, `full`.
- `spacing`: `base` (`4px`), `sm` (`8px`), `md` (`16px`), `lg` (`24px`), `xl` (`32px`), `margin-mobile` (`16px`), `margin-desktop` (`48px`).

### Accessibility (from README `#accessibility`)
- `aria-label` on every icon-only button.
- `aria-pressed`, `aria-current`, `aria-expanded` on toggles and tabs.
- Dialog patterns (if any modals are added): `role="dialog"`, `aria-modal`, focus trap, `Escape` to close, focus restored to trigger.
- `prefers-reduced-motion`: disable transitions/animations for users who prefer reduced motion.
- `:focus-visible` rings on all interactive elements (no `outline-none` without replacement).

### PWA / Offline
- Include `manifest.json` (if not existing) with name "Flousy", short name, icons (reference design assets in `public/`), theme color (`#00685f`), background (`#f5faf8` or `#2c3130`).
- Service worker registration in production only; do not cache Firestore/auth traffic.

---

## 5. COPY TEXT (FULL EXTRACTS) — USE EXACTLY

Below is the authoritative copy for each section. Do not paraphrase core claims; keep exact phrasing for accuracy.

### Hero
> A private, mobile-first budget tracker that knows the difference between what your money is for and where it actually is.

### Why Flousy (Intro)
> Most budget apps conflate two different questions:
> - What is this money **for**? (Rent is a need, dinner out is a want) → **Budget envelope**
> - Where is this money **sitting**? (In the bank, in a drawer, in my wallet) → **Money place**
> Mixing them produces nonsense — like a budgeting rule deciding how much cash you keep at home. Flousy keeps the two axes strictly separate, and the accounting honours it: **every dirham is conserved**.

### Invariant Note
> That invariant — money is never silently created or destroyed — is enforced by **57 tests**.

### Features — Budgeting (Full)
- Four strategies — 50/30/20, Zero-Based, Envelope, Pay-Yourself-First. Each splits income into needs / wants / savings envelopes whose shares always sum to exactly 100%.
- Auto-scaled category budgets. Your chosen categories are scaled to fill their envelope to the dirham. Pick fewer categories and each gets a bigger slice — the envelope is never left underspent.
- Guided onboarding — income → categories → bills → strategy → review.
- Editable per-category caps and a live **Budget Plan** card tracking spend against each envelope.

### Features — Money Tracking (Full)
- Three money places — Bank, Home, Wallet. All income starts in the bank; **Move money** transfers between them, always conserving the total.
- Every expense records **which place it was paid from** and debits it. Add, edit and delete all reconcile correctly — including when an edit moves an expense to a different place.
- Variable expenses and fixed monthly charges with full create / edit / delete, search and category filtering.
- Saving goals are global — they survive month rollover — with deposit and withdraw. Deleting a funded goal **returns its balance** rather than vaporising it.
- Month-to-month navigation; a new month inherits your plan with a clean slate of transactions.

### Features — Platform (Full)
- Email/password and Google sign-in, with redirect fallback for in-app browsers that block popups, password reset and email verification.
- 12 currencies (MAD, EUR, USD, GBP, CAD, CHF, AED, SAR, EGP, TND, DZD, XOF) with locale-aware formatting.
- Custom categories with colour and icon pickers.
- CSV export of everything, and one-click account deletion.
- Live Firestore sync with optimistic writes that roll back on failure.
- Dark mode, keyboard-accessible dialogs, installable PWA with an offline app shell.

### Quick Start (Commands)
Copy exactly as shown in Section D above.

### Firebase Setup Warning
> **Always deploy `firestore.rules`.** Without it, Firestore either blocks every read/write (the app looks broken) or — if you picked *test mode* — lets **anyone read and write anyone's financial data**.

### Security Rules (Key Points)
> Only `request.auth.uid == uid` can read or write a user's documents.
- Field whitelists — unknown fields are rejected.
- Numeric ranges on every money field (`0 … 1e9`).
- Array caps: 2,000 variable expenses, 500 fixed, 200 goals.
- 400 KB document ceiling.
- Month IDs must match `^[0-9]{4}-[0-9]{2}$`.
- `plan` is pinned to `'free'` — a client cannot promote itself to Pro.
- Everything else denied by default.

### Core Concepts — Category Buckets
Use the TypeScript snippet exactly:
```ts
bucketOf('Autre', 'variable')  // → 'wants'  (a miscellaneous purchase)
bucketOf('Autre', 'fixed')     // → 'needs'  (a miscellaneous recurring bill)
```
Explanation: *Unknown custom categories default to wants for variable spending and needs for fixed bills, so a user-invented category can never quietly inflate the essentials envelope.*

### Data Model Note
> **Saving goals are global, not per-month.** Money set aside in April is still saved in May. Months only ever move money into or out of a goal — they never own it, so nothing resets at rollover.

### Testing Assertions
- Envelope shares sum to exactly `1`
- Envelope amounts sum to exactly the income — no rounding leak
- Category budgets fill their envelope to the dirham
- Add → edit → delete returns to the exact starting balance
- Fund → withdraw → delete conserves total cash

### PWA Note
> The service worker deliberately never caches Firestore or Auth traffic. Showing stale financial data would be worse than an honest offline state, and the Firebase SDK has its own offline persistence. It also only registers in production, so it can't serve stale bundles during development.

### Roadmap — Shipped (Exact List)
Edit everywhere · money-place accounting · goal withdrawals · real spend trajectory · legal pages · CSV export · account deletion · hardened rules · 12 currencies · dark mode · offline shell · CI · 57 tests

### Roadmap — Next (Table)
Replicate the markdown table exactly with Features, Effort, Notes.

---

## 6. IMAGE / ASSET REFERENCES

Reference these workspace design assets in the new site design (do not copy raw files unless needed for icons; reference for color/styling):
- `design/flousy_dashboard_dark/code.html` — main dark layout, colors, spacing.
- `design/flousy_dashboard_dark/screen.png` — visual reference for card layout.
- `design/login_to_flousy/`, `design/welcome_to_flousy/` — onboarding / login visuals.
- `design/onboarding_*` — onboarding step visuals (income, categories, fixed bills, strategy, summary).
- `design/serene_finance/` — alternative calm aesthetic.

If generating new hero illustrations or icons, use a **calm, editorial, slightly editorial-finance** style: muted teal backgrounds, glass cards, minimal icons, no stock-photo people. Keep everything abstract / geometric.

---

## 7. DELIVERABLE FORMAT

Produce the updated site as a deployable directory or a set of changed files. At minimum:
- Updated `README.md` (optional — can keep original for reference).
- Updated landing page (`page.tsx` or `index.html`).
- Updated global CSS (`globals.css`) with design token variables.
- Updated `tailwind.config.ts` if needed for colors.
- Updated `public/` manifest/icons if PWA updates are needed.
- Updated `/app` route files if the site structure changes.

**Before finishing:** Confirm the deployed site reflects:
1. Brand name changed to Flousy.
2. Hero tagline and intro text match README exactly.
3. All feature sections have accurate copy (no omissions of key claims like "57 tests", "every dirham is conserved", "global goals").
4. Accessibility attributes are present (`aria-label`, focus management).
5. Dark/light mode works and uses the design token palette.
6. Mobile layout is responsive (`md:` breakpoints, `px-margin-mobile` / `md:px-margin-desktop`).

---
*Prompt generated from `mybudget-app/README.md` (Flousy budget tracker) with design references from `design/` folder and deployment target at the provided Vercel URL.*
