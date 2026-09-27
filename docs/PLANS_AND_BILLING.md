# Plans & Billing — Business10 / Business30

Source of truth: `src/lib/plans.ts`. Billing, usage metering, the client portal, admin screens,
calculators and the public pricing cards all read their numbers from that file.

| Plan | Price | Included per billing month | Each additional notarization | Stripe env var |
|---|---|---|---|---|
| Individual | $125 one-time | 1 notarial act | $10/act (statutory) | `STRIPE_PRICE_INDIVIDUAL` |
| Business10 | $1,000 / month | 10 notarizations | $75 | `STRIPE_PRICE_BUSINESS10` |
| Business30 | $3,000 / month | 30 notarizations | $75 | `STRIPE_PRICE_BUSINESS30` |
| Business Unlimited | **discontinued** | — | — | `STRIPE_PRICE_BUSINESS_UNLIMITED` (optional, legacy recognition only) |

Michigan split: each notarization includes the $10 statutory notarial fee (MCL 55.285). The rest is
separately disclosed mobile/remote service, scheduling and administrative services. Overage invoices
itemize `$10 statutory` + `$65 service` per extra notarization.

## Business10 eligibility cap (30 notarizations/month)

Business10 is only available to customers with **up to 30 notarizations a month**
(`maxMonthlyNotarizations: 30` in `plans.ts`). Prices, included quantities and the $75 overage are
unchanged.

- **1–30 a month:** Business10 can be shown, recommended and chosen.
- **31+ a month:** Business10 is not selectable or recommended anywhere. Business30 is the applicable plan.

**Where it's enforced (server-side, not just the UI):**
`src/lib/plan-eligibility.ts` → `checkPlanEligibility()` runs in `/api/checkout`,
`/api/subscription/change`, the admin "Start a plan" and "Change plan" actions, and inside
`changeBusinessSubscriptionPlan()` as a backstop. A blocked request gets HTTP 422 with the reason.

**Which volume counts:** the highest of the business's `expectedMonthlyVolume`, `monthlyUsage` (admin
"Monthly usage"), `monthlyUsageCount` (metered this billing period) and any volume the customer declares
at checkout. A customer can't get Business10 by under-declaring. A higher declared volume is saved to
`expectedMonthlyVolume`.

**Existing Business10 subscribers above 30:** they are not switched automatically, because that changes
what Stripe bills. The admin Subscription & Usage panel shows a warning, and Business10 can't be
re-selected; move them to Business30 with Change plan.

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

1. **Business10:** Product catalog → Add product "Business10" → Recurring, Monthly, **$1,000.00 USD**.
   Copy the `price_…` ID into `STRIPE_PRICE_BUSINESS10`.
2. **Business30:** On the Business30 product, add a **new** price: Recurring, Monthly, **$3,000.00 USD**.
   Copy the new `price_…` into `STRIPE_PRICE_BUSINESS30`. Then archive the old $2,500 price.
3. **Business Unlimited:** Archive the product/price. Optionally put its old price ID in
   `STRIPE_PRICE_BUSINESS_UNLIMITED` so any legacy subscriber still displays correctly.
4. **Webhook endpoint** (`/api/webhooks/stripe`) must send these events:
   - `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`
   - `payment_intent.payment_failed`, `charge.refunded`
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - `invoice.paid` (new)
5. **Customer portal:** Settings → Billing → Customer portal. Allow payment-method updates, invoice
   history and cancellation. Turn plan switching **off** there. The app handles switching itself, and
   Stripe's portal can't enforce the Business10 30-notarization cap.

## Deploy order (production)

1. Back up the database (Supabase → Database → Backups).
2. Run the migration against production **before** deploying the code:
   `DATABASE_URL=<prod url> npx prisma migrate deploy`. It only adds things, and the currently deployed
   code keeps working after it runs.
3. Add or update the env vars in Vercel (Production and Preview).
4. Deploy the branch.
