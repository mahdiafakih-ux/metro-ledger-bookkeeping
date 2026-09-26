-- Notar-E: Business10 / Business30 plans, Unlimited discontinued, notarization-based
-- usage metering, and careers.
--
-- SAFE / ADDITIVE ONLY:
--   * no tables or columns are dropped, no rows are deleted
--   * the discontinued "unlimited" PricingPlan row is kept (isActive = false) so any
--     historical subscription, invoice or usage record that references it still renders
--   * every new column has a default, so the currently-deployed code keeps working
--     if this migration is applied before the new code is deployed

-- ---------------------------------------------------------------------------
-- 1. Usage metering: count notarizations (units), not just appointments
-- ---------------------------------------------------------------------------
ALTER TABLE "BusinessUsage" ADD COLUMN IF NOT EXISTS "planKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BusinessUsage" ADD COLUMN IF NOT EXISTS "units" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "BusinessUsage" ADD COLUMN IF NOT EXISTS "overageUnits" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BusinessUsage" ADD COLUMN IF NOT EXISTS "overageUnitCents" INTEGER NOT NULL DEFAULT 0;

-- Backfill rows recorded before this change (one appointment = one unit, old
-- Business30 terms: $50 per additional appointment). They keep those terms.
UPDATE "BusinessUsage" bu
SET "overageUnits" = CASE WHEN bu."isOverage" THEN 1 ELSE 0 END,
    "overageUnitCents" = CASE WHEN bu."isOverage" AND bu."overageAmountCents" > 0 THEN bu."overageAmountCents" ELSE 5000 END,
    "planKey" = CASE
      WHEN b."currentPlanKey" IN ('business30', 'unlimited') THEN b."currentPlanKey"
      ELSE 'business30'
    END
FROM "Business" b
WHERE bu."businessId" = b."id" AND bu."planKey" = '';

-- ---------------------------------------------------------------------------
-- 2. Pricing plans
-- ---------------------------------------------------------------------------
-- Discontinue Business Unlimited for new customers (row preserved for history).
UPDATE "PricingPlan"
SET "isActive" = false, "highlight" = false, "sortOrder" = 99, "updatedAt" = NOW()
WHERE "key" = 'unlimited';

-- Business30: $3,000/mo, 30 notarizations included, $75 each after.
UPDATE "PricingPlan"
SET "name" = 'Business30',
    "billingPeriod" = 'monthly',
    "statutoryFeeCents" = 1000,
    "actsIncluded" = 30,
    "serviceFeeCents" = 270000,
    "serviceFeeLabel" = 'Mobile/remote service, scheduling & administrative services',
    "totalCents" = 300000,
    "appointmentsIncluded" = 30,
    "overageFeeCents" = 7500,
    "description" = 'One fixed monthly bill for up to 30 notarizations.',
    "features" = '["30 notarizations included every billing month","$75 per additional notarization","Mobile or eligible online notarization","Client portal with live usage tracking","One monthly invoice"]',
    "highlight" = false,
    "sortOrder" = 3,
    "isActive" = true,
    "updatedAt" = NOW()
WHERE "key" = 'business30';

-- Legacy key from the original build, if it still exists: keep, but inactive.
UPDATE "PricingPlan" SET "isActive" = false, "highlight" = false, "updatedAt" = NOW() WHERE "key" = 'business20';

-- Business10: $1,000/mo, 10 notarizations included, $75 each after.
INSERT INTO "PricingPlan" (
  "id", "key", "name", "billingPeriod", "statutoryFeeCents", "actsIncluded", "serviceFeeCents",
  "serviceFeeLabel", "totalCents", "appointmentsIncluded", "overageFeeCents", "description",
  "features", "highlight", "sortOrder", "isActive", "updatedAt"
) VALUES (
  'plan_business10', 'business10', 'Business10', 'monthly', 1000, 10, 90000,
  'Mobile/remote service, scheduling & administrative services', 100000, 10, 7500,
  'For teams with steady monthly signings.',
  '["10 notarizations included every billing month","$75 per additional notarization","Mobile or eligible online notarization","Client portal with live usage tracking","One monthly invoice"]',
  true, 2, true, NOW()
)
ON CONFLICT ("key") DO NOTHING;

UPDATE "PricingPlan" SET "sortOrder" = 1, "updatedAt" = NOW() WHERE "key" = 'individual';

-- Individual: shorter copy, only if the admin never customised the original default.
-- Price and fee split are untouched.
UPDATE "PricingPlan"
SET "description" = 'One appointment — mobile, or online for eligible documents.',
    "features" = '["1 notarial act included","We come to you, or meet online (eligible documents)","Book a time online in minutes","Extra acts at the statutory $10/act rate"]',
    "updatedAt" = NOW()
WHERE "key" = 'individual'
  AND "description" = 'A single notarization appointment, in-person or remote where eligible — most appointments take about 20 minutes.';

-- ---------------------------------------------------------------------------
-- 3. Homepage hero copy — only replaced if it is still the original default
--    (an admin-customised headline is left alone).
-- ---------------------------------------------------------------------------
ALTER TABLE "BusinessSettings" ALTER COLUMN "heroHeadline" SET DEFAULT 'Notarization, wherever you are.';
ALTER TABLE "BusinessSettings" ALTER COLUMN "heroSubheadline" SET DEFAULT 'Mobile and online notary services built for individuals and businesses.';
UPDATE "BusinessSettings" SET "heroHeadline" = 'Notarization, wherever you are.' WHERE "heroHeadline" = 'Notarization Made Simple.';
UPDATE "BusinessSettings" SET "heroSubheadline" = 'Mobile and online notary services built for individuals and businesses.'
WHERE "heroSubheadline" = 'Professional Michigan notary services — when and where you need them.';

-- ---------------------------------------------------------------------------
-- 4. Careers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "JobOpening" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL DEFAULT 'other',
    "location" TEXT NOT NULL DEFAULT 'Metro Detroit, MI',
    "employment" TEXT NOT NULL DEFAULT 'Contract',
    "summary" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobOpening_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CareerApplication" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "jobOpeningId" TEXT,
    "isCommissioned" BOOLEAN NOT NULL DEFAULT false,
    "commissionState" TEXT NOT NULL DEFAULT '',
    "commissionExpiration" TIMESTAMP(3),
    "mobileExperience" TEXT NOT NULL DEFAULT 'none',
    "ronExperience" TEXT NOT NULL DEFAULT 'none',
    "signingAgentExperience" TEXT NOT NULL DEFAULT 'none',
    "availability" TEXT NOT NULL DEFAULT '',
    "linkedinUrl" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'new',
    "adminNotes" TEXT NOT NULL DEFAULT '',
    "ipAddress" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CareerResume" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerResume_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CareerApplication_status_idx" ON "CareerApplication"("status");
CREATE INDEX IF NOT EXISTS "CareerApplication_createdAt_idx" ON "CareerApplication"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "CareerResume_applicationId_key" ON "CareerResume"("applicationId");

ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_jobOpeningId_fkey"
  FOREIGN KEY ("jobOpeningId") REFERENCES "JobOpening"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CareerResume" ADD CONSTRAINT "CareerResume_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "CareerApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
