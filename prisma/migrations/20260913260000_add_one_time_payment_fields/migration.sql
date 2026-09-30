-- Add fields to Payment model for one-time Stripe Checkout payments
ALTER TABLE "Payment" ADD COLUMN "stripeCheckoutSessionId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Payment" ADD COLUMN "stripeCustomerId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Payment" ADD COLUMN "paidAt" TIMESTAMP(3);

-- Create indexes for efficient lookup by Checkout Session ID
CREATE INDEX "Payment_stripeCheckoutSessionId_idx" ON "Payment"("stripeCheckoutSessionId");
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");
