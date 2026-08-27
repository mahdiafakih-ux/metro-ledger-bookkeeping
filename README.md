# Notar-E Services

A complete business platform for a Michigan notary company: a modern public
marketing/booking website, and a private **Notar-E Command Center** admin
dashboard for running and growing the business — scheduling, CRM, sales
pipeline, outreach, revenue/expense tracking, invoicing, analytics, and a
$50,000 revenue goal tracker.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma**.

---

## What's included

**Public website** (`/`) — Home, Services, Business Solutions, Pricing,
multi-step Booking, About, FAQ, Contact, Client Login, Privacy, Terms.
Pricing is Michigan-compliant: every page separates the statutory notarial
fee (capped at $10/act under MCL 55.287) from other lawful, disclosed
service charges. SEO metadata, OpenGraph tags, `sitemap.xml`, `robots.txt`,
and JSON-LD structured data are wired up.

**Admin dashboard** (`/admin`) — protected by cookie-based session auth:

- **Dashboard** — KPIs, monthly revenue chart, upcoming appointments, activity
- **Command Center** — "Today's Mission," today's appointments/follow-ups/prospects, daily outreach and revenue targets
- **Goal Tracker** — animated progress bar, pace (ahead/on-track/behind), projected completion date, milestones with a confetti celebration, manual revenue entry
- **Calendar** — day/week/month views, click-to-book
- **Appointments** — full CRUD, status transitions (complete/no-show/cancel), payment toggles, CSV export
- **Clients** & **Businesses** — lightweight CRM with lead status/source, follow-ups, appointment history
- **Sales Pipeline** — drag-and-drop kanban (lead → won/lost) via `@dnd-kit`
- **Outreach Tracker** — call/email/text/visit log with conversion stats
- **Daily Scorecard** — 0–100% daily score against configurable targets, with streaks
- **Revenue** — manual + auto-computed revenue ledger, an interactive what-if calculator (Conservative/Target/Aggressive presets, savable scenarios), CSV export
- **Expenses** & **Mileage** — categorized logs, profit/margin, CSV export
- **Analytics** — revenue/appointments/clients over time, revenue by service/plan/client/company, recurring revenue, conversion rate
- **Invoices** — itemized (statutory fee vs. other services), tax, balance due, Stripe payment link, printable and a real server-generated downloadable PDF
- **Settings** — business info, homepage wording, pricing plans, availability & blackout dates, daily targets, goal amount/deadline, a central CSV export/backup hub, demo-data clearing — all editable without touching code
- **Universal search**, a notification center, and a first-login **setup wizard**
- **Mobile** — the admin dashboard has an app-like bottom nav with a quick-add sheet, and tap-to-call/email links throughout

All money is stored in cents (integers) to avoid floating-point errors.

**Payments** — Stripe Checkout is wired up for one-time appointments and
business invoices, with pay-now-or-pay-later, itemized statutory-fee line
items, webhook-driven payment status sync into the ledger/goal tracker, and
admin refunds. **Email** — Resend sends branded booking confirmation,
reminder (via a daily Vercel Cron job), changed/cancelled, payment receipt,
invoice, and business-lead-confirmation emails; both are no-ops without an
API key so local dev never requires them.

---

## Tech stack

| Layer      | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Framework  | Next.js 16 (App Router, Server Actions, Turbopack)                 |
| Language   | TypeScript                                                          |
| Styling    | Tailwind CSS v4                                                     |
| Database   | Prisma ORM — **PostgreSQL** (a local instance for dev, **Supabase** in production) |
| Auth       | Custom cookie session (HttpOnly, signed JWT via `jose`) + `bcryptjs` |
| Charts     | Recharts                                                             |
| Drag/drop  | `@dnd-kit`                                                           |
| Validation | Zod                                                                   |
| Toasts     | Sonner                                                                |

No secret keys are ever sent to the browser — all database access and
sensitive logic runs in Server Components / Server Actions / Route Handlers.

---

## Getting started (local development)

**Prerequisites:** Node 20+ and a PostgreSQL database — either a local
Postgres instance (`prisma/schema.prisma` targets `provider = "postgresql"`)
or a free Supabase project used for dev too.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set AUTH_SECRET to a long random string:
#   openssl rand -base64 48

# 3. Create the database and apply the schema
npm run db:migrate

# 4. Seed demo data + your admin user (uses ADMIN_EMAIL / ADMIN_PASSWORD from .env)
npm run db:seed

# 5. Run the dev server
npm run dev
```

Visit **http://localhost:3000** for the public site, and
**http://localhost:3000/admin/login** for the Command Center (sign in with
the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`). On first login you'll
be walked through a short setup wizard, then land on a dashboard already
populated with realistic demo data — clear it anytime from **Settings → Demo
Data** once you're ready to use the platform for real.

### Other useful scripts

```bash
npm run build          # production build
npm run start           # run the production build
npm run lint             # ESLint
npm run db:studio        # Prisma Studio — browse/edit the database visually
npm run db:reset          # ⚠ wipes the local database and re-seeds it
```

---

## Project structure

```
prisma/
  schema.prisma          # full data model (appointments, clients, businesses,
                          # pipeline, outreach, revenue, expenses, mileage,
                          # invoices, pricing plans, settings, ...)
  seed.ts                 # admin user + demo data (all flagged isDemo: true)
src/
  app/
    (site)/                # public website route group (shares nav/footer)
    admin/
      login/, setup/        # unauthenticated admin entry points
      (dashboard)/           # everything behind the sidebar shell
    api/
      availability/          # booking slot lookup
      export/*/               # CSV export endpoints (admin-only)
      invoices/[id]/pdf/       # server-generated invoice PDF
      webhooks/stripe/          # Stripe webhook handler (signature-verified)
      cron/appointment-reminders/ # daily Vercel Cron job (CRON_SECRET-protected)
  components/
    site/                    # public-site UI (navbar, footer, booking wizard, ...)
    admin/                    # dashboard UI (sidebar, charts, forms, mobile bottom nav, ...)
    brand/                    # the Notar-E logo (pure SVG, no external assets)
    ui/                       # shared design-system primitives
  lib/
    actions/                  # Server Actions — all writes go through here, each auth-guarded
    queries/                  # read-side data aggregation for dashboards
    pdf/                      # invoice PDF document (@react-pdf/renderer)
    stripe.ts, payments.ts, email.ts, rate-limit.ts, milestones.ts,
    goal.ts, scorecard.ts, availability.ts, pricing-defaults.ts, ...
  proxy.ts                    # Next.js "proxy" (middleware) — protects /admin and /api/export
```

---

## Michigan compliance notes

This app encodes the pricing structure requested for Notar-E Services while
keeping public-facing language compliant with Michigan law:

- The **statutory notarial fee** is capped at **$10 per notarial act**
  (MCL 55.287) and is always itemized separately — in pricing cards, the
  booking flow, and invoices — from other lawful charges (travel,
  signing-agent time, document handling, administrative/scheduling
  services).
- The bundled totals from the brief ($125 individual / $2,500 for 20
  appointments / $50 per additional appointment / $4,000 unlimited) are
  modeled as **Statutory Fee + Service Fee**, never advertised as "the
  notarization fee."
- Every pricing surface carries a disclaimer that Notar-E Services is not a
  law firm and does not provide legal advice.
- All of the above — labels, amounts, and wording — are editable from
  **Admin → Settings** without a code change, so the platform can adapt if
  regulations or the business model change.

This is a software implementation of rules described by the project owner,
not legal advice — verify current Michigan notary statutes and fee limits
with a licensed attorney before relying on this in production.

---

## Deploying to Vercel + Supabase

1. **Supabase**: create a project at supabase.com. In Project Settings →
   Database, copy the connection string — use the **pooled** ("Transaction"
   mode, port 6543) connection string for `DATABASE_URL` in serverless
   environments like Vercel, since each function invocation opens a new
   connection and Postgres has a hard connection limit; Supabase's pooler
   (PgBouncer) is what makes that safe at scale.
2. **Vercel**: import the GitHub repo as a new Vercel project. Framework
   preset "Next.js" is auto-detected.
3. Set environment variables in Vercel's Project Settings → Environment
   Variables (see the full list below) — at minimum `DATABASE_URL`,
   `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`.
4. Run migrations against the production database once, from your machine
   or CI, pointed at the Supabase `DATABASE_URL`:
   ```bash
   npx prisma migrate deploy
   npm run db:seed   # creates the admin user; skip the demo-data block for a real launch
   ```
5. Deploy. Vercel builds with `npm run build` and serves with its own
   Next.js runtime — no `npm run start` step needed.
6. Log into `/admin`, complete the setup wizard, and clear demo data from
   Settings → Demo Data when you're ready to go live.
7. `vercel.json` defines a daily Cron job (`/api/cron/appointment-reminders`)
   — Vercel wires this up automatically on deploy; set `CRON_SECRET` to the
   same value Vercel will send as the job's bearer token (Vercel Cron jobs on
   the Hobby plan only fire once a day, at the time the cron expression
   specifies).

**Never** commit a real `.env` file or expose `AUTH_SECRET` /
`STRIPE_SECRET_KEY` / other secrets client-side — this app only reads them
in Server Components, Server Actions, and Route Handlers.

### Supabase backups

Supabase takes automatic daily backups on paid plans, with Point-in-Time
Recovery (restore to any moment, not just a daily snapshot) on Pro and
above — configure and restore from Project Settings → Database → Backups.
The free tier keeps a shorter backup window. Either way, it's worth also
using the CSV export hub under `/admin/settings` (or `pg_dump` against the
Supabase connection string) for an occasional offline copy you control
directly, independent of Supabase's own retention policy.

---

## Payments, email & SMS

**Stripe** — set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and
`STRIPE_WEBHOOK_SECRET` (from a webhook endpoint pointed at
`https://yourdomain.com/api/webhooks/stripe`, listening for
`checkout.session.completed`, `payment_intent.payment_failed`, and
`charge.refunded`) to enable Checkout for appointments and invoices.
Without these set, the app runs fine — customers see "pay at your
appointment" / "pay by check" instead of a Pay Now button, and nothing
breaks.

**Resend** — set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (an address on a
domain verified with Resend) to enable transactional email. Without it, the
email functions silently no-op — no errors, just no email sent — so it's
safe to leave blank in development.

**Twilio** — environment variables are present in `.env.example` for future
SMS reminders but nothing calls them yet; not required to launch.

---

## Security

- Sessions are signed HttpOnly cookies (14-day expiry, `secure` in
  production, `sameSite: lax`), verified in `src/proxy.ts` before any
  `/admin` or `/api/export` request is served.
- Every admin-only Server Action also independently checks the session
  itself via `requireAdminSession()` — not just the page it's declared on —
  since an action reference reaching a shared client bundle would otherwise
  be a way around page-level checks alone.
- Passwords are hashed with `bcryptjs` (cost factor 12).
- All mutations run through Zod-validated Server Actions on the server —
  the browser never talks to the database directly.
- Public write endpoints (login, booking, contact/lead forms, business
  inquiry, Stripe checkout session creation) are rate-limited in-memory per
  IP; login is also limited per IP+email. This is single-instance —
  swap in a shared store (e.g. Upstash Redis) if you scale to multiple
  concurrent instances.
- Stripe webhooks are signature-verified (`stripe.webhooks.constructEvent`)
  before any event is processed.
- Security response headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS) are set site-wide in
  `next.config.ts`.
- Demo/seed data is clearly flagged (`isDemo: true`) and removable in one
  click from Settings, separate from real production data.

---

## Known scope notes

- Recurring appointments store a recurrence flag/rule but don't yet
  auto-generate future instances — a natural follow-up once real recurring
  business clients are onboarded.
- The client-facing self-service portal (`/login`) is currently a "contact
  us" placeholder; wiring it to real client accounts is a good next step.
- The business-inquiry form matches an existing `Business` by company name
  and updates it in place on a repeat submission from the same company —
  intentional for the B2B follow-up workflow, but worth knowing if two
  different people from the same company submit independently.
- The in-memory rate limiter resets on every deploy/restart and doesn't
  share state across multiple server instances; fine for a single-region
  Vercel deployment at this scale, worth revisiting if traffic grows.
