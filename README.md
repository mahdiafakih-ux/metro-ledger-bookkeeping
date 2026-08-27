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
- **Revenue** — manual + auto-computed revenue ledger, an interactive what-if calculator (Conservative/Target/Aggressive presets, savable scenarios)
- **Expenses** & **Mileage** — categorized logs, profit/margin, CSV export
- **Analytics** — revenue/appointments/clients over time, revenue by service/plan/client/company, recurring revenue, conversion rate
- **Invoices** — itemized (statutory fee vs. other services), printable/PDF-via-browser-print
- **Settings** — business info, homepage wording, pricing plans, availability & blackout dates, daily targets, goal amount/deadline, demo-data clearing — all editable without touching code
- **Universal search**, a notification center, and a first-login **setup wizard**

All money is stored in cents (integers) to avoid floating-point errors.

---

## Tech stack

| Layer      | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Framework  | Next.js 16 (App Router, Server Actions, Turbopack)                 |
| Language   | TypeScript                                                          |
| Styling    | Tailwind CSS v4                                                     |
| Database   | Prisma ORM — **SQLite** for local dev, drop-in **Postgres/Supabase** for production |
| Auth       | Custom cookie session (HttpOnly, signed JWT via `jose`) + `bcryptjs` |
| Charts     | Recharts                                                             |
| Drag/drop  | `@dnd-kit`                                                           |
| Validation | Zod                                                                   |
| Toasts     | Sonner                                                                |

No secret keys are ever sent to the browser — all database access and
sensitive logic runs in Server Components / Server Actions / Route Handlers.

---

## Getting started (local development)

**Prerequisites:** Node 20+.

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
      export/*/               # CSV export endpoints
  components/
    site/                    # public-site UI (navbar, footer, booking wizard, ...)
    admin/                    # dashboard UI (sidebar, charts, forms, ...)
    brand/                    # the Notar-E logo (pure SVG, no external assets)
    ui/                       # shared design-system primitives
  lib/
    actions/                  # Server Actions — all writes go through here
    queries/                  # read-side data aggregation for dashboards
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

## Deploying to Postgres / Supabase

The schema is written to be portable. To move off local SQLite:

1. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   to:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` in your production environment to your Supabase/Postgres
   connection string.
3. Delete `prisma/migrations` (SQLite and Postgres migration SQL aren't
   interchangeable) and run `npx prisma migrate dev --name init` once against
   the new database to generate fresh Postgres migrations, then commit them.
4. `npm run db:seed` to create your admin user (skip or adjust the demo data
   block in `prisma/seed.ts` for a real launch).

## Deploying the app

Any Node hosting platform that supports Next.js works (Vercel, Railway,
Render, Fly.io, a VPS, etc.):

1. Provision a Postgres database (Supabase, Neon, Railway, RDS, ...) and
   complete the migration steps above.
2. Set environment variables from `.env.example` in your host's dashboard —
   at minimum `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   `NEXT_PUBLIC_SITE_URL`.
3. Run `npm run build` then `npm run start` (or let the platform do this via
   its Next.js preset).
4. Run migrations + seed against production once
   (`npx prisma migrate deploy && npm run db:seed`).
5. Log into `/admin`, complete the setup wizard, and clear demo data from
   Settings when you're ready to go live.

**Never** commit a real `.env` file or expose `AUTH_SECRET` /
`STRIPE_SECRET_KEY` / other secrets client-side — this app only reads them
in Server Components, Server Actions, and Route Handlers.

---

## Payments & messaging (architecture only)

Stripe, Resend, and Twilio environment variables are present in
`.env.example` so the app can be wired up to real payments, transactional
email, and SMS reminders later — none are required to run the app locally,
and no secret key is ever imported into client-side code. Wiring these up
(creating Stripe Checkout sessions from the booking/invoice flows, sending
email via Resend on booking confirmation, SMS reminders via Twilio) is the
natural next step once you're ready to take real payments.

---

## Security

- Sessions are signed HttpOnly cookies (14-day expiry), verified in
  `src/proxy.ts` before any `/admin` or `/api/export` request is served.
- Passwords are hashed with `bcryptjs` (cost factor 12).
- All mutations run through Zod-validated Server Actions on the server —
  the browser never talks to the database directly.
- Demo/seed data is clearly flagged (`isDemo: true`) and removable in one
  click from Settings, separate from real production data.

---

## Known scope notes

- Recurring appointments store a recurrence flag/rule but don't yet
  auto-generate future instances — a natural follow-up once real recurring
  business clients are onboarded.
- The client-facing self-service portal (`/login`) is currently a "contact
  us" placeholder; wiring it to real client accounts is a good next step.
- Notifications currently fire on new bookings and goal milestones; wiring
  up scheduled reminders for follow-ups/unpaid invoices/renewals would need
  a cron job or scheduled Server Action once deployed.
