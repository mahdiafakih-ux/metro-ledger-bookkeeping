-- Add Stripe configuration to BusinessSettings
ALTER TABLE "BusinessSettings" ADD COLUMN "business30IncludedAppointments" INTEGER NOT NULL DEFAULT 30;

-- Add Stripe fields to Client
ALTER TABLE "Client" ADD COLUMN "stripeCustomerId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN "stripeSubscriptionId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN "currentPlanKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN "nextBillingDate" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN "monthlyUsageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Client" ADD COLUMN "monthlyUsageResetDate" TIMESTAMP(3);

-- Add Stripe fields to Business
ALTER TABLE "Business" ADD COLUMN "stripeCustomerId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "stripeSubscriptionId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "currentPlanKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Business" ADD COLUMN "nextBillingDate" TIMESTAMP(3);
ALTER TABLE "Business" ADD COLUMN "monthlyUsageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Business" ADD COLUMN "monthlyUsageResetDate" TIMESTAMP(3);

-- Create SubscriptionEvent table
CREATE TABLE "SubscriptionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeEventId" TEXT NOT NULL UNIQUE,
    "eventType" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "clientId" TEXT,
    "businessId" TEXT,
    "dataSnapshot" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SubscriptionEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create ClientAccessSession table for portal magic link login
CREATE TABLE "ClientAccessSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientAccessSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index for faster lookups
CREATE INDEX "ClientAccessSession_clientId_idx" ON "ClientAccessSession"("clientId");
CREATE INDEX "ClientAccessSession_expiresAt_idx" ON "ClientAccessSession"("expiresAt");
