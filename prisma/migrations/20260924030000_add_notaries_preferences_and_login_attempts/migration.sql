-- Notar-E portal redesign — ADDITIVE ONLY.
-- No tables or columns are dropped or renamed and no existing rows are
-- rewritten. Every new column on an existing table is nullable or has a
-- constant default, so this is safe to run against live data.

-- ---------------------------------------------------------------------------
-- 1. Notaries
-- ---------------------------------------------------------------------------
CREATE TABLE "Notary" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notary_adminUserId_key" ON "Notary"("adminUserId");

-- ---------------------------------------------------------------------------
-- 2. Preferred notaries (owned by exactly one Business OR one Client)
-- ---------------------------------------------------------------------------
CREATE TABLE "PreferredNotary" (
    "id" TEXT NOT NULL,
    "notaryId" TEXT NOT NULL,
    "businessId" TEXT,
    "clientId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreferredNotary_pkey" PRIMARY KEY ("id"),
    -- Custom constraint (not expressible in schema.prisma; Prisma leaves it alone).
    CONSTRAINT "PreferredNotary_exactly_one_owner_check"
        CHECK (("businessId" IS NULL) <> ("clientId" IS NULL))
);

CREATE INDEX "PreferredNotary_notaryId_idx" ON "PreferredNotary"("notaryId");
CREATE UNIQUE INDEX "PreferredNotary_businessId_notaryId_key" ON "PreferredNotary"("businessId", "notaryId");
CREATE UNIQUE INDEX "PreferredNotary_clientId_notaryId_key" ON "PreferredNotary"("clientId", "notaryId");

ALTER TABLE "PreferredNotary" ADD CONSTRAINT "PreferredNotary_notaryId_fkey" FOREIGN KEY ("notaryId") REFERENCES "Notary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PreferredNotary" ADD CONSTRAINT "PreferredNotary_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PreferredNotary" ADD CONSTRAINT "PreferredNotary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 3. Appointment: notary assignment, client preference, completion time
--    (all nullable / defaulted — existing appointments are unaffected)
-- ---------------------------------------------------------------------------
ALTER TABLE "Appointment" ADD COLUMN "assignedNotaryId" TEXT,
ADD COLUMN "preferredNotaryId" TEXT,
ADD COLUMN "notaryPreference" TEXT NOT NULL DEFAULT '',
ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE INDEX "Appointment_assignedNotaryId_idx" ON "Appointment"("assignedNotaryId");
CREATE INDEX "Appointment_preferredNotaryId_idx" ON "Appointment"("preferredNotaryId");

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_assignedNotaryId_fkey" FOREIGN KEY ("assignedNotaryId") REFERENCES "Notary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_preferredNotaryId_fkey" FOREIGN KEY ("preferredNotaryId") REFERENCES "Notary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 4. Client portal login: persisted wrong-code attempt counter
-- ---------------------------------------------------------------------------
ALTER TABLE "ClientAccessSession" ADD COLUMN "failedAttempts" INTEGER NOT NULL DEFAULT 0;
