# Notar-E Services - Complete Business Platform

A production-ready notary business management and booking platform built with Next.js, Prisma, PostgreSQL, and Stripe integration.

## 🚀 Features

### Public Website
- **Modern Homepage** with hero section and trust indicators, animated with GSAP + ScrollTrigger (pinned scroll sections, respects `prefers-reduced-motion`)
- **Services Page** listing all notarial services
- **Business Solutions** page targeting enterprise clients
- **Dynamic Pricing Page** with editable pricing from admin
- **Booking Wizard** 7-step appointment booking flow
- **Client Portal** with magic-link login
- **Responsive Design** mobile-first

### Client Portal
- **Dashboard** current plan, usage, upcoming appointments
- **Appointments** view all past and upcoming appointments
- **Invoices** track all invoices and payment status
- **Payments** complete payment history
- **Billing** manage subscription via Stripe portal
- **Profile** view account details
- **Support** help center with FAQs

### Admin Dashboard
- **Command Center** daily metrics and goals
- **Goal Tracker** $50K revenue goal with progress
- **Calendar** manage appointments (daily/weekly/monthly)
- **Revenue Calculator** scenario modeling tool
- **Sales Pipeline** kanban board for leads
- **Clients** full CRM system
- **Businesses** dedicated business client management
- **Appointments** complete appointment system
- **Invoices** create, track invoices
- **Expenses** track by category
- **Mileage** log mileage with CSV export
- **Outreach** contact and sales tracking
- **Scorecard** daily metrics and streaks
- **Analytics** comprehensive reporting

### Stripe Integration
- **Checkout Sessions** for appointments and subscriptions
- **Subscription Management** recurring billing plans
- **Customer Portal** payment and subscription management
- **Webhook Handling** idempotent Stripe events
- **Overage Billing** automatic additional charges
- **Usage Tracking** monthly per-client counters

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, Next.js 16, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 5
- **Auth**: JWT sessions + Magic link login
- **Payments**: Stripe SDK
- **Charts**: Recharts, Chart.js

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Stripe account

### Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Seed business settings, pricing plans and your admin user (local DB only)
npm run db:seed

# Confirm the BusinessSettings "default" row exists
npm run db:check

# Start development server
npm run dev

# Open http://localhost:3000
```

### Seeding safely

`npm run db:seed` and `npm run db:check` run as standalone `tsx` scripts, so
they load the project's `.env` themselves (`prisma/load-env.ts`). Before
touching the database they print the target host/database (never the
password) and **refuse to run against any non-local database** unless
`ALLOW_REMOTE_DB=true` is set for that one command. This keeps a local seed
from ever writing to production Supabase by accident.

### Environment Variables (.env.local)

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/notare"

# Auth
AUTH_SECRET="your-secret-key-min-32-chars"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_INDIVIDUAL="price_..."
STRIPE_PRICE_BUSINESS30="price_..."
STRIPE_PRICE_BUSINESS_UNLIMITED="price_..."

# Site
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Email (optional)
RESEND_API_KEY="re_..."
```

## 💳 Stripe Setup

### 1. Create Products
In Stripe Dashboard, create 3 products:
- **Individual**: $125 one-time
- **Business 30**: $2,500/month
- **Business Unlimited**: $4,000/month

Copy price IDs to `.env.local`

### 2. Webhook Configuration
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - checkout.session.completed
   - customer.subscription.created/updated/deleted
   - charge.refunded
   - invoice.paid/payment_failed

4. Copy webhook secret to `.env.local`

## 🔐 Authentication

### Admin Dashboard
- JWT-based login at `/admin/login`
- 14-day session duration
- Secure HTTP-only cookies

### Client Portal
- Magic-link login (email + 6-digit code)
- No passwords
- 15-minute code expiration
- Access at `/portal/login`

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Import on Vercel
# Connect GitHub repo
# Add environment variables
# Deploy

# 3. Apply migrations
npx prisma migrate deploy

# 4. Seed production once (creates the admin user; the seed refuses remote DBs without this flag)
ALLOW_REMOTE_DB=true npm run db:seed
```

### Database Options
- **Supabase**: Easiest PostgreSQL with Stripe integration
- **RDS**: AWS managed PostgreSQL
- **Self-hosted**: Digital Ocean, Linode, etc.

### Live Stripe Keys
After MVP launch:
1. Switch to live API keys
2. Update environment variables
3. Create live webhook endpoint
4. Test transaction

## 💰 Pricing Configuration

All pricing is editable from `/admin/settings` without code changes:
- Individual appointment rate
- Business 30 monthly price & included appointments
- Business Unlimited monthly price
- Overage rate for Business 30

### Michigan Compliance
- Statutory notary fee: $10 max
- Clearly separated from service charges
- Non-legal advice disclaimers on all pages

## 📊 Key Metrics

### Goal Tracking
- $50,000 revenue by May 31, 2027
- Daily/weekly/monthly projections
- Milestone celebrations

### Revenue Models
1. Individual: $125 per appointment
2. Business 30: $2,500/mo (30 incl., $50 each additional)
3. Business Unlimited: $4,000/mo (unlimited)

## 🐛 Troubleshooting

**Prisma generate fails**
```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

**Migration fails**
```bash
# Reset (dev only)
npx prisma migrate reset

# Or manually apply
psql $DATABASE_URL < prisma/migrations/[version]/migration.sql
```

**Build succeeds with implicit any warnings**
- TypeScript configured to allow implicit any (pragma in tsconfig.json)
- All code is functional and production-ready
- Type annotations can be added incrementally

## 📁 Project Structure

```
src/
├── app/
│   ├── (site)/          # Public website
│   ├── admin/           # Admin dashboard
│   ├── portal/          # Client portal
│   └── api/             # API routes
├── components/
│   ├── site/
│   ├── admin/
│   └── portal/
├── lib/
│   ├── actions/         # Server actions
│   ├── queries/         # Database queries
│   ├── auth.ts         # Authentication
│   ├── stripe.ts       # Stripe utilities
│   └── db.ts           # Prisma client
├── styles/
└── types/
```

## 📚 API Endpoints

- `POST /api/checkout` - Create checkout session
- `POST /api/portal` - Get portal URL
- `POST /api/webhooks/stripe` - Webhook
- `POST /api/portal/login/send-code` - Send login code
- `POST /api/portal/login/verify-code` - Verify code
- `GET /api/export/*` - Data exports (CSV)

## 🎉 Launch Checklist

- [ ] Domain purchased and configured
- [ ] SSL certificate installed
- [ ] Supabase/PostgreSQL database created
- [ ] Stripe account with live keys
- [ ] Resend account (optional for emails)
- [ ] First admin user created
- [ ] Business settings configured
- [ ] Stripe webhook verified
- [ ] Migrations applied
- [ ] Mobile responsive tested
- [ ] Payment flow tested end-to-end
- [ ] Backup strategy configured
- [ ] Analytics set up

## 📞 Support

For deployment questions:
- Check Vercel documentation
- Stripe support: stripe.com/support
- Supabase support: supabase.com/support

---

**Notar-E Services Platform**
Built with Next.js, Prisma, PostgreSQL, and Stripe
