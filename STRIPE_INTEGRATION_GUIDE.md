# Stripe Integration Guide - Notar-E Services

Complete guide for setting up and using Stripe payments in the Notar-E Services platform.

## 🔧 Prerequisites

- Stripe account (stripe.com)
- Production domain (for webhooks)
- .env.local configured with Stripe keys

## 📋 Step-by-Step Setup

### 1. Create Stripe Account
1. Visit stripe.com
2. Sign up for a new account
3. Complete verification
4. Access Stripe Dashboard

### 2. Create Three Products

#### Product 1: Individual Service
**Settings**:
- Name: "Individual Service"
- Description: "Professional Michigan notary service - single appointment"
- Type: "One-time"
- Price: $125.00 USD

**After Creation**:
- Copy Price ID (format: `price_...`)
- Add to .env.local as `STRIPE_PRICE_INDIVIDUAL`

#### Product 2: Business 30
**Settings**:
- Name: "Business 30"
- Description: "Monthly notary service - up to 30 appointments"
- Type: "Monthly recurring subscription"
- Price: $2,500.00 USD
- Metadata: `business30_included_appointments: 30`

**After Creation**:
- Copy Price ID
- Add to .env.local as `STRIPE_PRICE_BUSINESS30`

#### Product 3: Business Unlimited
**Settings**:
- Name: "Business Unlimited"
- Description: "Unlimited monthly notary appointments"
- Type: "Monthly recurring subscription"
- Price: $4,000.00 USD

**After Creation**:
- Copy Price ID
- Add to .env.local as `STRIPE_PRICE_BUSINESS_UNLIMITED`

### 3. Generate API Keys

**Test Mode** (for development):
1. Dashboard → Developers → API Keys
2. Copy "Secret Key" (format: `sk_test_...`)
3. Add to .env.local as `STRIPE_SECRET_KEY`
4. Copy "Publishable Key" (format: `pk_test_...`)
5. Add to .env.local as `STRIPE_PUBLISHABLE_KEY`

**Live Mode** (after testing):
- Same steps but for "Live" keys
- Format: `sk_live_...` and `pk_live_...`
- Only set up after thorough testing

### 4. Configure Webhooks

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. **URL**: `https://yourdomain.com/api/webhooks/stripe`
   - For local dev: Use ngrok or LocalTunnel
   - `ngrok http 3000` then use ngrok URL
4. **Events**: Select these specific events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. Click "Add endpoint"
6. Copy "Signing secret" (format: `whsec_...`)
7. Add to .env.local as `STRIPE_WEBHOOK_SECRET`

### 5. Enable Customer Portal

1. Dashboard → Settings → Billing Portal Settings
2. Enable "Billing Portal"
3. Allow customers to:
   - Update payment method
   - Change subscription
   - View invoices
   - Download invoices

## 💻 Implementation Details

### Checkout Flow

```typescript
// User clicks "Subscribe"
POST /api/checkout
{
  planType: "business30",  // or "individual" or "unlimited"
  clientId: "client_123",
  appointmentId: "apt_456" // for individual
}

// Backend:
1. Fetch client details from database
2. Calculate correct price based on planType
3. Create Stripe Checkout Session
4. Return checkout URL

// Client redirects to Stripe
// After payment, user returns to:
// /booking/success or /booking/cancel
```

### Webhook Processing

```typescript
// Stripe sends webhook to /api/webhooks/stripe
// For each event type:

1. customer.subscription.created
   - Create Stripe Customer
   - Update Client/Business with subscription ID
   - Set plan and billing date

2. customer.subscription.updated
   - Update subscription status
   - Update next billing date

3. customer.subscription.deleted
   - Mark subscription as canceled
   - Disable plan features

4. checkout.session.completed
   - One-time payment for individual
   - Create payment record

5. invoice.paid
   - Update payment status in Invoice table
```

### Subscription Management

**Business 30 Overage Logic**:
```
Monthly Usage Counter = X

if X <= 30:
  - No additional charge
  - All included in $2,500

if X > 30:
  - Additional 1 appointment = $50
  - Additional 2 appointments = $100
  - etc.

Invoice generated at end of month for overage
```

## 🧪 Testing Workflow

### Test Cards for Stripe
Use these card numbers in Test Mode:

**Successful Payment**:
- Card: `4242 4242 4242 4242`
- Exp: `12/25`
- CVC: `123`

**Payment Declined**:
- Card: `4000 0000 0000 0002`
- Exp: `12/25`
- CVC: `123`

**Requires Authentication**:
- Card: `4000 0025 0000 3155`
- Exp: `12/25`
- CVC: `123`

### Test Workflow

1. **Individual Appointment**:
   ```
   Visit /book → Select service → Checkout
   Use test card 4242... → Submit
   Should see success page and receive confirmation email
   ```

2. **Business 30 Subscription**:
   ```
   Admin adds business client
   Send invoice for Business 30 plan
   Business clicks checkout link
   Use test card 4242... → Submit
   Should see portal access
   ```

3. **Portal Login**:
   ```
   Visit /portal/login
   Enter email
   Receive 6-digit code in test email
   Enter code → Should access portal
   ```

4. **Webhook Testing** (local):
   ```
   Install Stripe CLI: stripe.com/docs/stripe-cli
   
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   
   Copy signing secret to .env.local
   
   Make test payment in Dashboard
   Should see webhook logs
   ```

## 📊 Monitoring Stripe

### Dashboard Views
1. **Transactions** → See all payments and refunds
2. **Customers** → View customer portal activity
3. **Subscriptions** → Track active subscriptions
4. **Invoices** → Monitor billing

### Recommended Alerts
1. Failed payments
2. High refund rates
3. Subscription cancellations
4. Webhook failures

## 🔄 Switching to Live Mode

### Checklist Before Going Live

- [ ] All 3 products created
- [ ] Test mode payments working
- [ ] Webhook endpoint responding
- [ ] Email sending verified
- [ ] Domain purchased and SSL installed
- [ ] Database backups configured
- [ ] Admin password set securely
- [ ] Terms of Service and Privacy Policy written
- [ ] Payment processor policies reviewed

### Going Live Steps

1. **Test Keys → Live Keys**:
   ```
   Stripe Dashboard → Developers → API Keys
   Copy Live Secret Key (sk_live_...)
   Copy Live Publishable Key (pk_live_...)
   Add to production environment
   ```

2. **Update Webhook**:
   ```
   Delete test webhook endpoint
   Create new endpoint with live domain
   Copy signing secret
   Update in production environment
   ```

3. **Verify Everything**:
   ```
   Test real payment with credit card
   Check invoice generation
   Verify email sending
   Review Stripe logs
   ```

4. **Monitor First Week**:
   ```
   Watch for webhook failures
   Monitor payment success rate
   Check customer support emails
   Review Stripe dashboard daily
   ```

## 🐛 Troubleshooting

### Payment Fails
1. Check Stripe Dashboard → Customers → Review error
2. Verify price IDs in database
3. Check webhook logs for processing errors
4. Ensure email is configured

### Webhook Not Received
1. Verify endpoint URL is public (not localhost)
2. Check signing secret matches in code
3. Review Stripe Dashboard → Webhooks → Event log
4. Use Stripe CLI to test locally

### Subscription Issues
1. Check customer status in Stripe Dashboard
2. Verify subscription ID in database
3. Check next billing date is correct
4. Review invoice history in Stripe

### Email Not Sending
1. Verify RESEND_API_KEY is set
2. Check email template renders correctly
3. Review email logs in Resend dashboard
4. Test with test email service first

## 📚 Reference

### Stripe API Documentation
- Payment Intents: stripe.com/docs/payments/payment-intents
- Subscriptions: stripe.com/docs/billing/subscriptions/overview
- Webhooks: stripe.com/docs/webhooks
- Customer Portal: stripe.com/docs/billing/portal

### Related Docs in This Codebase
- `/src/lib/subscriptions.ts` - Subscription logic
- `/src/app/api/checkout/route.ts` - Checkout handler
- `/src/app/api/webhooks/stripe/route.ts` - Webhook handler
- `/src/lib/email.ts` - Email templates

## 💡 Best Practices

1. **Never Log Keys**: Keys should never appear in logs
2. **Always Verify Webhooks**: Check webhook signatures
3. **Idempotent Processing**: Handle duplicate webhooks gracefully
4. **Test Regularly**: Monthly subscription tests
5. **Monitor Logs**: Set up alerts for failures
6. **Document Changes**: Keep records of price changes
7. **Handle Refunds**: Have clear refund policy
8. **Backup Data**: Regular database backups

## 🎯 Key Metrics to Track

- Conversion rate (bookings → payments)
- Subscription churn rate
- Average revenue per customer
- Payment failure rate
- Webhook failure rate
- Customer acquisition cost

---

**Stripe Integration Complete**
See IMPLEMENTATION_SUMMARY.md for full project status.
