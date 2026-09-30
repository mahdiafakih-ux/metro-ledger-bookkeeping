-- Add Stripe billing period tracking to Client
ALTER TABLE "Client" ADD COLUMN "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);

-- Add Stripe billing period tracking to Business
ALTER TABLE "Business" ADD COLUMN "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);

-- Create BusinessUsage table (with unique constraint on appointmentId)
CREATE TABLE "BusinessUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "isOverage" BOOLEAN NOT NULL DEFAULT false,
    "overageAmountCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessUsage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE,
    CONSTRAINT "BusinessUsage_appointmentId_key" UNIQUE ("appointmentId")
);

-- Create indexes for BusinessUsage
CREATE INDEX "BusinessUsage_businessId_idx" ON "BusinessUsage"("businessId");
CREATE INDEX "BusinessUsage_stripeSubscriptionId_idx" ON "BusinessUsage"("stripeSubscriptionId");
CREATE INDEX "BusinessUsage_billingPeriodStart_billingPeriodEnd_idx" ON "BusinessUsage"("billingPeriodStart", "billingPeriodEnd");

-- Create ClientUsage table (with unique constraint on appointmentId)
CREATE TABLE "ClientUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL DEFAULT '',
    "amountPaidCents" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClientUsage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE,
    CONSTRAINT "ClientUsage_appointmentId_key" UNIQUE ("appointmentId")
);

-- Create indexes for ClientUsage
CREATE INDEX "ClientUsage_clientId_idx" ON "ClientUsage"("clientId");
CREATE INDEX "ClientUsage_stripePaymentIntentId_idx" ON "ClientUsage"("stripePaymentIntentId");

-- Add indexes for Stripe identifiers (for performance and safety)
CREATE INDEX "Client_stripeCustomerId_idx" ON "Client"("stripeCustomerId") WHERE "stripeCustomerId" != '';
CREATE INDEX "Client_stripeSubscriptionId_idx" ON "Client"("stripeSubscriptionId") WHERE "stripeSubscriptionId" != '';
CREATE INDEX "Business_stripeCustomerId_idx" ON "Business"("stripeCustomerId") WHERE "stripeCustomerId" != '';
CREATE INDEX "Business_stripeSubscriptionId_idx" ON "Business"("stripeSubscriptionId") WHERE "stripeSubscriptionId" != '';
