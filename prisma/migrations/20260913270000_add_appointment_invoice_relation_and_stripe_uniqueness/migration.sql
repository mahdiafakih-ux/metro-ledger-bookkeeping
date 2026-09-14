-- Step 1: Add invoiceId foreign key to Appointment
ALTER TABLE "Appointment" ADD COLUMN "invoiceId" TEXT;

-- Step 2: Add foreign key constraint from Appointment to Invoice
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL;

-- Step 3: Make stripePaymentIntentId nullable and unique
ALTER TABLE "Payment" ALTER COLUMN "stripePaymentIntentId" DROP NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "stripePaymentIntentId" SET DEFAULT NULL;

-- Step 4: Create unique constraint on stripePaymentIntentId (only for non-null values)
-- In PostgreSQL, unique constraints allow multiple NULL values, so this is safe
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- Step 5: Make stripeCheckoutSessionId nullable and unique
ALTER TABLE "Payment" ALTER COLUMN "stripeCheckoutSessionId" DROP NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "stripeCheckoutSessionId" SET DEFAULT NULL;

-- Step 6: Create unique constraint on stripeCheckoutSessionId
CREATE UNIQUE INDEX "Payment_stripeCheckoutSessionId_key" ON "Payment"("stripeCheckoutSessionId");

-- Step 7: Create index on appointmentId for efficient lookups
CREATE INDEX "Payment_appointmentId_idx" ON "Payment"("appointmentId");

-- Step 8: Create index on invoiceId for efficient lookups
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- Step 9: Create index on Appointment.invoiceId for efficiency
CREATE INDEX "Appointment_invoiceId_idx" ON "Appointment"("invoiceId");
