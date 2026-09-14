-- Add billing state fields to BusinessUsage for idempotent overage invoicing
ALTER TABLE "BusinessUsage" ADD COLUMN "billingStatus" TEXT NOT NULL DEFAULT 'unbilled',
ADD COLUMN "invoiceId" TEXT,
ADD COLUMN "invoicedAt" TIMESTAMP(3),
ADD COLUMN "stripeInvoiceItemId" TEXT NOT NULL DEFAULT '';

-- Add foreign key constraint from BusinessUsage to Invoice
ALTER TABLE "BusinessUsage" ADD CONSTRAINT "BusinessUsage_invoiceId_fkey" 
FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL;

-- Add critical indexes for preventing concurrent double-billing
CREATE INDEX "BusinessUsage_billingStatus_billingPeriodStart_billingPeriodEnd_idx" 
ON "BusinessUsage"("billingStatus", "billingPeriodStart", "billingPeriodEnd");

CREATE INDEX "BusinessUsage_invoiceId_idx" ON "BusinessUsage"("invoiceId");

-- Add relation on Invoice side
-- (Prisma manages this, but documenting intent: Invoice.usageRecords)
