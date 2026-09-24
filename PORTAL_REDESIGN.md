# Client Portal Redesign: Change Notes & Deployment Runbook

Branch: `portal-redesign`. **Not deployed.** The production database migration has **not** been run and needs explicit approval first.

## What changed

### Security fixes
- **Admin and client sessions are now separate.** Tokens carry an issuer, an audience (`notare:admin` / `notare:client`) and a `typ` claim (`src/lib/session-tokens.ts`). The proxy, `requireAdminSession` and the client portal each accept only their own type. A client-portal cookie can no longer open `/admin`. Existing sessions (tokens without the new claims) are rejected, so admin and clients sign in once more.
- **Availability actions now require an admin session.** Before, anyone could call `saveAvailability`, `addBlackoutDate` or `removeBlackoutDate`.
- **Login codes are harder to guess.** Codes come from a cryptographic random generator, expire after 10 minutes, and requesting a new code retires older ones. Each code allows **5 wrong attempts**, counted in the database (`ClientAccessSession.failedAttempts`) so the limit holds across servers, and the code is consumed atomically. There are also IP and email rate limits. Error messages are the same whether or not the account exists.
- **Stripe billing portal (`/api/portal`).** Business owners and admins open the **business's** Stripe customer. Other members get a 403. Nothing is taken from the request body.

### Timezone (America/Detroit)
- `src/lib/tz.ts` is a small helper with no dependencies that handles daylight saving time. It was tested against both DST transitions with the server clock set to UTC, Detroit and Tokyo.
- Time inputs are treated as Detroit time and converted to a UTC instant. This covers booking slots, public booking, portal requests, admin create/edit, admin time blocks and the calendar grid. Displays convert back to Detroit time: emails show "EDT/EST", and the shared `formatDateTime`/`formatTime` helpers use Detroit time.
- Date-only values (blackout dates, invoice dates) are stored and compared as UTC-midnight calendar days, which matches what production already stores.
- **Existing appointment data was not changed.** `npm run db:tz-audit` is read-only and lists appointments that were likely saved shifted by the old code, so you can review them manually.

### Usage counting (no automatic overage billing)
- `src/lib/usage.ts` `syncBusinessUsage()` keeps the `BusinessUsage` ledger and `Business.monthlyUsageCount` accurate. It counts completed appointments inside the Stripe billing period and marks the ones beyond the included amount, using `PricingPlan.appointmentsIncluded` and `overageFeeCents` from the admin pricing editor.
- It runs after admin appointment create, edit, status change and delete, and after Stripe subscription created/updated events.
- **It never creates invoices or charges.** `createOverageInvoice` is still not called anywhere, and rows stay `billingStatus = "unbilled"`.

### Client portal (`src/app/portal`)
- **Navigation.** New layout (`components/portal/shell.tsx`): a compact grouped sidebar with an account menu on desktop; on mobile, a header, a slide-out drawer with focus trapping and Escape to close, and a bottom tab bar with Request a Notary in the center.
- **Pages.** Dashboard, Appointments (Upcoming / Completed / Cancelled / Preferred notaries), appointment detail at `/portal/appointments/[id]` (this fixes the old 404 links), Request a Notary, Billing, Invoices, Payments, Profile (editable) and Support.
- **Real data.** Everything comes from `src/lib/portal/account.ts`, which reads the plan from the **Business** through `BusinessClient`, and prices from `PricingPlan`. Owners and admins see the whole business; members see their own records; viewers can't make requests.
- **Invoices.** Drafts are hidden from clients. "Outstanding" counts only sent, overdue and partially paid invoices. View, pay and PDF use the existing `/invoice/[id]` and `/api/invoices/[id]/pdf` routes.
- **Recent activity** is built only from real records. Events without a reliable timestamp are left out.
- **Bug fixed:** the dashboard crashed for any client with invoices, because the line items weren't loaded.
- **Support FAQ:** removed the claim that there's a "Reschedule" button.

### Preferred notaries
- New `Notary` and `PreferredNotary` tables. The Appointment table gets `assignedNotaryId`, `preferredNotaryId`, `notaryPreference` and `completedAt`.
- Preferences belong to either one business (a shared team list) or one individual client; a CHECK constraint enforces exactly one. Up to 3 per owner and one "primary", both enforced in code inside a serializable transaction.
- Clients can only add notaries who **completed** one of their appointments. Requests only accept notaries the account is eligible for.
- The wording always says a preference is not guaranteed.
- **Admin:** new `/admin/notaries` page (add, edit, deactivate) and a notary card on each admin appointment page showing the client's preference and an assignment dropdown.

### Request a Notary pricing
- Pay-as-you-go: statutory fee × acts plus the service fee from the `individual` plan, the same as public booking.
- Business 30 / Unlimited: submitted under the subscription with statutory and service amounts at **$0**. **No per-act charge is assumed.** Any applicable statutory notarial-act fees are recorded separately on the appointment afterward, and a note explaining this is added to the appointment.

## Database migration

`prisma/migrations/20260924030000_add_notaries_preferences_and_login_attempts/migration.sql`

Additive only: 2 new tables, 4 nullable or defaulted columns on `Appointment`, 1 defaulted column on `ClientAccessSession`, plus indexes, foreign keys and 1 CHECK constraint. No drops, renames or data rewrites.

Verification: all 10 migrations applied in order to a fresh PostgreSQL 16 database. All 29 models and 365 columns match `schema.prisma` in type and nullability.

## Deploy (after approval)

1. **Back up production.** In Supabase: Database → Backups, or run `pg_dump`.
2. **Preview first.** Push the branch and let Vercel build a Preview deployment. Point the Preview's `DATABASE_URL` at a **staging copy**, not production, and run `npx prisma migrate deploy` there first.
3. **Check pending migrations:** `DATABASE_URL="<prod>" npx prisma migrate status`. It should list exactly one pending migration.
4. **Apply to production (only after approval):** `DATABASE_URL="<prod>" npx prisma migrate deploy`. Never run `migrate dev` or `migrate reset` against production.
5. **Merge `portal-redesign` → `main`.** Vercel builds with `prisma generate && next build`. There are **no new environment variables**.
6. **Sign in again.** You and all clients sign in once, since old sessions are invalidated.
7. **Set up notaries.** Go to Admin → Notaries and add yourself (and any team), then assign notaries to upcoming appointments.
8. **Review timestamps.** Run `ALLOW_REMOTE_DB=true DATABASE_URL="<prod>" npm run db:tz-audit` (read-only) and fix any flagged appointments by hand in admin.
9. **Smoke test:** sign into the portal, submit a request, mark it completed in admin with a notary assigned, add that notary as preferred, request them again, and open the billing portal.

**Rollback:** redeploy the previous Vercel deployment. The migration only adds things, so the old code keeps working with the new columns in place.
