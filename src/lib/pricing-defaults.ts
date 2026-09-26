// Default pricing plans. Fully editable afterward from /admin/settings.
//
// Michigan compliance note: MCL 55.285 caps the fee a notary may charge for
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
    description: "One appointment — mobile, or online for eligible documents.",
    features: [
      "1 notarial act included",
      "We come to you, or meet online (eligible documents)",
      "Book a time online in minutes",
      "Extra acts at the statutory $10/act rate",
    ],
    highlight: false,
    sortOrder: 1,
    isActive: true,
  },
  // Business plans: numbers mirror src/lib/plans.ts (the billing authority);
  // only the copy below is admin-editable.
  {
    key: "business10",
    name: "Business10",
    billingPeriod: "monthly",
    statutoryFeeCents: 1000,
    actsIncluded: 10,
    serviceFeeCents: 90000,
    serviceFeeLabel: "Mobile/remote service, scheduling & administrative services",
    totalCents: 100000,
    appointmentsIncluded: 10 as number | null,
    overageFeeCents: 7500 as number | null,
    description: "For teams with steady monthly signings.",
    features: [
      "10 notarizations included every billing month",
      "$75 per additional notarization",
      "Mobile or eligible online notarization",
      "Client portal with live usage tracking",
      "One monthly invoice",
    ],
    highlight: true,
    sortOrder: 2,
    isActive: true,
  },
  {
    key: "business30",
    name: "Business30",
    billingPeriod: "monthly",
    statutoryFeeCents: 1000,
    actsIncluded: 30,
    serviceFeeCents: 270000,
    serviceFeeLabel: "Mobile/remote service, scheduling & administrative services",
    totalCents: 300000,
    appointmentsIncluded: 30 as number | null,
    overageFeeCents: 7500 as number | null,
    description: "One fixed monthly bill for up to 30 notarizations.",
    features: [
      "30 notarizations included every billing month",
      "$75 per additional notarization",
      "Mobile or eligible online notarization",
      "Client portal with live usage tracking",
      "One monthly invoice",
    ],
    highlight: false,
    sortOrder: 3,
    isActive: true,
  },
];
