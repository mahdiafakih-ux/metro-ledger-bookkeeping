// Default pricing plans — Notar-E Services
// Fully editable afterward from /admin/settings.
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
    description:
      "A single notarization appointment — mobile (we come to you) or remote online where eligible.",
    features: [
      "One appointment, up to 1 notarial act included",
      "Mobile notary (we come to you) or remote online where eligible",
      "Book online in under 2 minutes",
      "Additional notarial acts at the statutory $10/act rate",
      "Text & email appointment reminders",
    ],
    highlight: false,
    sortOrder: 1,
    isActive: true,
  },
  {
    key: "business10",
    name: "Business10",
    billingPeriod: "monthly",
    statutoryFeeCents: 1000,
    actsIncluded: 1,
    serviceFeeCents: 99000,
    serviceFeeLabel: "Priority Scheduling, Signing Agent & Administrative Services",
    totalCents: 100000,
    appointmentsIncluded: 10,
    overageFeeCents: 7500,
    description:
      "For growing teams with steady recurring notary needs. 10 appointments per month, $75 each after that.",
    features: [
      "10 appointments per billing month",
      "$75 per additional appointment beyond 10",
      "Mobile and remote online notarization (where eligible)",
      "Priority scheduling",
      "Centralized billing & invoicing",
      "Usage tracking dashboard",
      "Dedicated business support",
    ],
    highlight: false,
    sortOrder: 2,
    isActive: true,
  },
  {
    key: "business30",
    name: "Business30",
    billingPeriod: "monthly",
    statutoryFeeCents: 1000,
    actsIncluded: 1,
    serviceFeeCents: 299000,
    serviceFeeLabel: "Priority Scheduling, Signing Agent & Administrative Services",
    totalCents: 300000,
    appointmentsIncluded: 30,
    overageFeeCents: 7500,
    description:
      "Built for title companies, law firms, and real estate teams with high-volume recurring needs.",
    features: [
      "30 appointments per billing month",
      "$75 per additional appointment beyond 30",
      "Mobile and remote online notarization (where eligible)",
      "Priority scheduling",
      "Centralized billing & invoicing",
      "Usage tracking dashboard",
      "Dedicated business support",
      "Appointment management",
    ],
    highlight: true,
    sortOrder: 3,
    isActive: true,
  },
  // DISCONTINUED — preserved for historical records only. isActive: false prevents display to new customers.
  {
    key: "unlimited",
    name: "Business Unlimited (Discontinued)",
    billingPeriod: "monthly",
    statutoryFeeCents: 1000,
    actsIncluded: 1,
    serviceFeeCents: 390000,
    serviceFeeLabel: "Unlimited Service Plan Fee (fair-use)",
    totalCents: 400000,
    appointmentsIncluded: null,
    overageFeeCents: null,
    description: "Discontinued plan — preserved for historical records only.",
    features: [],
    highlight: false,
    sortOrder: 99,
    isActive: false,
  },
] as const;

export type PlanKey = "individual" | "business10" | "business30" | "unlimited";

export const PLAN_OVERAGE_CENTS = 7500; // $75 per additional appointment — applies to business10 and business30
