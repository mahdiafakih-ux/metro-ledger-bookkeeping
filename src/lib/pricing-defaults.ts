// Default pricing plans. Fully editable afterward from /admin/settings.
//
// Michigan compliance note: MCL 55.287 caps the fee a notary may charge for
// the notarial act itself at $10 per act. Every plan below separates that
// statutory fee from other lawful, separately-disclosed business charges
// (signing-agent time, travel, scheduling, document handling, administrative
// service, etc.). Public-facing pages must always show this breakdown rather
// than advertising the bundled total as "the notarization fee."
export const DEFAULT_PRICING_PLANS = [
  {
    key: "individual",
    name: "Individual Service",
    billingPeriod: "one_time",
    statutoryFeeCents: 1000,
    actsIncluded: 1,
    serviceFeeCents: 11500,
    serviceFeeLabel: "Signing Agent & Service Fee",
    totalCents: 12500,
    appointmentsIncluded: 1,
    overageFeeCents: null as number | null,
    description: "A single notarization appointment, in-person or remote where eligible — most appointments take about 20 minutes.",
    features: [
      "One appointment, up to 1 notarial act included",
      "In-person or remote/online (where legally eligible)",
      "Choose your own date & time online",
      "Additional notarial acts at the statutory $10/act rate",
      "Text & email appointment reminders",
    ],
    highlight: false,
    sortOrder: 1,
    isActive: true,
  },
  {
    key: "business20",
    name: "Business 20",
    billingPeriod: "monthly",
    statutoryFeeCents: 1000,
    actsIncluded: 1,
    serviceFeeCents: 230000,
    serviceFeeLabel: "Priority Scheduling, Signing Agent & Administrative Services",
    totalCents: 250000,
    appointmentsIncluded: 20,
    overageFeeCents: 5000,
    description: "Built for title companies, law firms, and real estate teams with recurring notary needs.",
    features: [
      "Up to 20 service appointments per month included",
      "Statutory notarial fee ($10/act) billed separately & transparently",
      "Additional appointments at a flat $50 each",
      "Priority scheduling & dedicated point of contact",
      "Centralized monthly invoicing",
      "Usage dashboard & appointment history",
    ],
    highlight: true,
    sortOrder: 2,
    isActive: true,
  },
  {
    key: "unlimited",
    name: "Business Unlimited",
    billingPeriod: "monthly",
    statutoryFeeCents: 1000,
    actsIncluded: 1,
    serviceFeeCents: 400000,
    serviceFeeLabel: "Unlimited Service Plan Fee (flat monthly, fair-use)",
    totalCents: 400000,
    appointmentsIncluded: null as number | null,
    overageFeeCents: null as number | null,
    description: "Unlimited qualifying service appointments for high-volume partners, subject to fair-use business terms.",
    features: [
      "Unlimited qualifying service appointments*",
      "Statutory notarial fee ($10/act) billed separately & transparently",
      "Fastest response times & dedicated account manager",
      "Centralized monthly invoicing, one flat rate",
      "Custom SLAs available",
      "*Subject to fair-use / business terms, editable by Notar-E Services",
    ],
    highlight: false,
    sortOrder: 3,
    isActive: true,
  },
];
