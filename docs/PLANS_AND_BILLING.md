# Plans & Billing — Individual / Business10 / Business30 / Enterprise

Source of truth: `src/lib/plans.ts`. Billing, usage metering, the client portal, admin screens,
calculators and the public pricing cards all read their numbers from that file.

| Plan | Price | Included per billing month | Each additional notarization | Stripe env var |
|---|---|---|---|---|
| Individual | $150 per notarization appointment (one-time) | 1 notarial act | $10/act (statutory) | `STRIPE_PRICE_INDIVIDUAL` |
| Business10 | $1,250 / month | 10 notarizations | $100 | `STRIPE_PRICE_BUSINESS10` |
| Business30 | $3,000 / month | 30 notarizations | $100 | `STRIPE_PRICE_BUSINESS30` |
| Enterprise | Custom quote (~50+ / month) | Quoted | Quoted | none — contact-us only, not in Stripe |
| Business Unlimited | **discontinued** | — | — | `STRIPE_PRICE_BUSINESS_UNLIMITED` (optional, legacy recognition only) |

There is no unlimited plan. Enterprise is a quote, handled as a lead from `/contact?service=enterprise`.

The Individual price shown on the site comes from the admin-editable `individual` PricingPlan row
(Admin → Settings → Pricing Plans); `plans.ts` holds the default (`INDIVIDUAL_PRICE_CENTS`).

Michigan split: each notarization includes the $10 statutory notarial fee (MCL 55.285). The rest is
separately disclosed mobile/remote service, scheduling and administrative services. Overage invoices
itemize `$10 statutory` + `$90 service` per extra notarization.

## Which plan is recommended

There is **no eligibility cap**. Any business may choose either plan at any volume, and nobody is
switched automatically when usage changes. The calculators (public estimator, portal plan picker,
admin Subscription & Usage) compare actual monthly cost and badge the cheaper plan
(`cheapestPlanFor()` in `plans.ts`):

| Notarizations / month | Business10 | Business30 | Recommended |
|---|---|---|---|
| 10 | $1,250 | $3,000 | Business10 |
| 27 | $2,950 | $3,000 | Business10 |
| 28 | $3,050 | $3,000 | Business30 |
| 30 | $3,250 | $3,000 | Business30 |
| 40 | $4,250 | $4,000 | Business30 |

At 50+ a month the calculators also suggest asking for an Enterprise quote. The admin panel shows how much
more a subscriber pays on their current plan at their known volume, as a prompt to offer a switch.

## How usage works

- A notarization = one notarial act (`Appointment.numberOfActs`) on a **completed** appointment linked to a
  business with an active Business10/30 subscription.
- One `BusinessUsage` row per appointment (UNIQUE `appointmentId`), in the Stripe billing period.
- Editing, cancelling or deleting the appointment updates or removes its row, unless that row is
  already invoiced. Invoiced rows are locked.
- Each row keeps the plan and rate it was recorded under. If a customer switches plans partway through
  a month, notarizations already used keep their original terms. New ones use the new plan's allowance.
- Overage is invoiced from **Admin → Businesses → (business) → Subscription & Usage → Invoice overage**.
  That creates a **draft** invoice covering all unbilled overage, inside a Serializable transaction, so
  the same overage can't be billed twice.
- Recurring subscription payments (`invoice.paid`) are recorded as revenue automatically.

## Plan management

- **Start a plan:** admin panel ("Start a plan" gives you a Checkout link to open or send), or the
  client portal for a linked owner/admin.
- **Switch Business10 ↔ Business30:** portal or admin. This swaps the Stripe price in place, and Stripe
  prorates the charge.
- **Payment method, receipts, cancellation:** Stripe Billing Portal ("Manage Billing" in the portal).
- **Who can use the portal:** people linked on the business page (Client portal access). Owners and
  admins can change plans and pay; members and viewers can't.

## Stripe setup (one time)

1. **Business10:** On the Business10 product, add a **new** price: Recurring, Monthly, **$1,250.00 USD**.
   Copy the `price_…` ID into `STRIPE_PRICE_BUSINESS10`. Archive the old $1,000 price once no
   subscription uses it (Stripe prices can't be edited, only replaced).
2. **Business30:** Recurring, Monthly, **$3,000.00 USD** (unchanged) in `STRIPE_PRICE_BUSINESS30`.
3. **Individual:** On the Individual product, add a **new** one-time price of **$150.00 USD** and put it in
   `STRIPE_PRICE_INDIVIDUAL`. Archive the $125 price.
   - Overage ($100) is not a Stripe price: it is billed on app-generated invoices from `plans.ts`.
   - Enterprise has no Stripe price.
4. **Business Unlimited:** Archive the product/price. Optionally put its old price ID in
   `STRIPE_PRICE_BUSINESS_UNLIMITED` so any legacy subscriber still displays correctly.
5. **Webhook endpoint** (`/api/webhooks/stripe`) must send these events:
   - `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`
   - `payment_intent.payment_failed`, `charge.refunded`
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - `invoice.paid` (new)
6. **Customer portal:** Settings → Billing → Customer portal. Allow payment-method updates, invoice
   history and cancellation. Keep plan switching **off** there — the app handles switching itself (and
   records which plan each notarization was used under).

## Existing Business10 subscribers on the old $1,000 price

Stripe keeps charging an existing subscription its original price until you change it. After
`STRIPE_PRICE_BUSINESS10` points at the new $1,250 price, such subscriptions are still recognised as
Business10 through their `planKey` metadata, but:

- their base charge stays $1,000 until you move them to the new price (Stripe Dashboard → the
  subscription → Update subscription → replace the price; choose your proration setting), and
- overage recorded after this deploy uses the new $100 rate from `plans.ts`.

Give customers notice before changing either (Terms: "Plan pricing may be updated with notice").

## Deploy order (production)

1. Back up the database (Supabase → Database → Backups).
2. If not already done for the Business10/Business30 release, run its migration against production
   **before** deploying: `DATABASE_URL=<prod url> npx prisma migrate deploy`. The pricing revision adds
   no migration.
3. Add or update the env vars in Vercel (Production and Preview).
4. Deploy the branch.
5. Admin → Settings → Pricing Plans → Individual Service: set the total to $150 (statutory $10 + service
   $140). Existing database rows are not changed by the seed.
