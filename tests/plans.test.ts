// Run with: npm test   (Node's built-in test runner via tsx — no extra deps)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SUBSCRIPTION_PLANS,
  allocateOverage,
  business30BreakEven,
  cheapestPlanFor,
  ENTERPRISE_OFFER,
  INDIVIDUAL_PRICE_CENTS,
  feeBreakdown,
  isSubscriptionPlanKey,
  monthlyCostCents,
  planDisplayName,
  savingsVersus,
  suggestsEnterprise,
  syncPlanFeatureNumbers,
} from "../src/lib/plans";
import * as plans from "../src/lib/plans";
import { DEFAULT_PRICING_PLANS } from "../src/lib/pricing-defaults";

const { business10, business30 } = SUBSCRIPTION_PLANS;

test("catalog prices: Business10 $1,250 / 10 incl, Business30 $3,000 / 30 incl, $100 overage", () => {
  assert.equal(business10.monthlyCents, 125_000);
  assert.equal(business10.includedNotarizations, 10);
  assert.equal(business30.monthlyCents, 300_000);
  assert.equal(business30.includedNotarizations, 30);
  assert.equal(business10.overagePerNotarizationCents, 10_000);
  assert.equal(business30.overagePerNotarizationCents, 10_000);
  assert.equal(INDIVIDUAL_PRICE_CENTS, 15_000);
});

test("Business10 monthly totals", () => {
  assert.equal(monthlyCostCents(business10, 0), 125_000);
  assert.equal(monthlyCostCents(business10, 10), 125_000);
  assert.equal(monthlyCostCents(business10, 11), 135_000);
  assert.equal(monthlyCostCents(business10, 20), 225_000);
  assert.equal(monthlyCostCents(business10, 27), 295_000);
  assert.equal(monthlyCostCents(business10, 28), 305_000);
  assert.equal(monthlyCostCents(business10, 31), 335_000);
});

test("Business30 monthly totals", () => {
  assert.equal(monthlyCostCents(business30, 1), 300_000);
  assert.equal(monthlyCostCents(business30, 30), 300_000);
  assert.equal(monthlyCostCents(business30, 31), 310_000);
  assert.equal(monthlyCostCents(business30, 35), 350_000);
  assert.equal(monthlyCostCents(business30, 50), 500_000);
});

test("recommendation: Business10 for 1–27, Business30 from 28", () => {
  assert.equal(business30BreakEven(), 28);
  for (let n = 0; n <= 27; n++) assert.equal(cheapestPlanFor(n).key, "business10", `n=${n}`);
  for (let n = 28; n <= 200; n++) assert.equal(cheapestPlanFor(n).key, "business30", `n=${n}`);
  for (let n = 0; n <= 200; n++) {
    const best = cheapestPlanFor(n);
    const other = best.key === "business10" ? business30 : business10;
    assert.ok(monthlyCostCents(best, n) <= monthlyCostCents(other, n), `n=${n}`);
  }
});

test("savingsVersus reports what the non-recommended plan costs extra", () => {
  assert.equal(savingsVersus(business10, 27), 0);
  assert.equal(savingsVersus(business30, 27), 5_000); // $3,000 vs $2,950
  assert.equal(savingsVersus(business10, 28), 5_000); // $3,050 vs $3,000
  assert.equal(savingsVersus(business10, 40), 25_000); // $4,250 vs $4,000
});

test("no hard eligibility cap: Business10 stays a normal choice at any volume", () => {
  // The cap helpers from c60cbed must be gone so nothing can block a plan by volume.
  for (const name of ["isPlanEligible", "eligiblePlansFor", "planIneligibilityReason", "BUSINESS10_MAX_MONTHLY_NOTARIZATIONS", "applicablePlanFor"]) {
    assert.equal((plans as Record<string, unknown>)[name], undefined, name);
  }
  assert.equal("maxMonthlyNotarizations" in business10, false);
});

test("Enterprise is a quote-only offer, never a subscription or unlimited plan", () => {
  assert.equal(isSubscriptionPlanKey("enterprise"), false);
  assert.equal(ENTERPRISE_OFFER.suggestedMinMonthlyNotarizations, 50);
  assert.equal(suggestsEnterprise(49), false);
  assert.equal(suggestsEnterprise(50), true);
  assert.equal(DEFAULT_PRICING_PLANS.some((p) => /unlimited/i.test(p.key + p.name)), false);
});

test("default pricing rows match the catalog and keep the $10 statutory split", () => {
  const byKey = Object.fromEntries(DEFAULT_PRICING_PLANS.map((p) => [p.key, p]));
  assert.equal(byKey.individual.totalCents, 15_000);
  assert.equal(byKey.individual.statutoryFeeCents + byKey.individual.serviceFeeCents, 15_000);
  for (const key of ["business10", "business30"] as const) {
    const row = byKey[key];
    const plan = SUBSCRIPTION_PLANS[key];
    assert.equal(row.totalCents, plan.monthlyCents, key);
    assert.equal(row.overageFeeCents, plan.overagePerNotarizationCents, key);
    assert.equal(row.statutoryFeeCents * row.actsIncluded + row.serviceFeeCents, plan.monthlyCents, key);
    assert.ok(!row.features.some((f) => f.includes("$75")), key);
  }
});

test("stale dollar amounts in admin-edited feature bullets are replaced from the catalog", () => {
  const out = syncPlanFeatureNumbers(
    ["10 notarizations included every billing month", "$75 per additional notarization", "One monthly invoice"],
    business10
  );
  assert.deepEqual(out, ["10 notarizations included every billing month", "$100 per additional notarization", "One monthly invoice"]);
});

test("Michigan fee breakdown keeps statutory fee at $10/act", () => {
  const b10 = feeBreakdown(business10);
  assert.equal(b10.statutoryCents, 10 * 1000);
  assert.equal(b10.statutoryCents + b10.serviceCents, business10.monthlyCents);
  assert.equal(b10.overageStatutoryCents + b10.overageServiceCents, 10_000);
  const b30 = feeBreakdown(business30);
  assert.equal(b30.statutoryCents, 30 * 1000);
  assert.equal(b30.statutoryCents + b30.serviceCents, business30.monthlyCents);
});

test("overage allocation: first N units included, remainder billed per unit", () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, units: 1, locked: false, lockedOverageUnits: 0 }));
  const out = allocateOverage(rows, 10);
  assert.equal([...out.values()].reduce((s, v) => s + v, 0), 2);
  assert.equal(out.get("r9"), 0);
  assert.equal(out.get("r10"), 1);
  assert.equal(out.get("r11"), 1);
});

test("overage allocation: an appointment with several acts can straddle the limit", () => {
  const out = allocateOverage(
    [
      { id: "a", units: 8, locked: false, lockedOverageUnits: 0 },
      { id: "b", units: 5, locked: false, lockedOverageUnits: 0 }, // crosses 10 → 3 over
    ],
    10
  );
  assert.equal(out.get("a"), 0);
  assert.equal(out.get("b"), 3);
});

test("overage allocation: invoiced rows are never changed but still count", () => {
  const out = allocateOverage(
    [
      { id: "old", units: 11, locked: true, lockedOverageUnits: 1 },
      { id: "new", units: 1, locked: false, lockedOverageUnits: 0 },
    ],
    10
  );
  assert.equal(out.has("old"), false);
  assert.equal(out.get("new"), 1);
});

test("mid-month plan switch keeps each record's own plan allowance", () => {
  const sum = (m: Map<string, number>) => [...m.values()].reduce((s, v) => s + v, 0);
  // 15 on Business10, then switch to Business30 and 10 more: first 5-over stay billable, new 10 are within 30
  const up = [
    ...Array.from({ length: 15 }, (_, i) => ({ id: `a${i}`, units: 1, included: 10, locked: false, lockedOverageUnits: 0 })),
    ...Array.from({ length: 10 }, (_, i) => ({ id: `b${i}`, units: 1, included: 30, locked: false, lockedOverageUnits: 0 })),
  ];
  assert.equal(sum(allocateOverage(up, 30)), 5);
  // 25 on Business30, then switch to Business10 and 3 more: past 25 stay included, the 3 new are overage
  const down = [
    ...Array.from({ length: 25 }, (_, i) => ({ id: `c${i}`, units: 1, included: 30, locked: false, lockedOverageUnits: 0 })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `d${i}`, units: 1, included: 10, locked: false, lockedOverageUnits: 0 })),
  ];
  const d = allocateOverage(down, 10);
  assert.equal(sum(d), 3);
  assert.equal(d.get("c24"), 0);
});

test("Unlimited is not a purchasable plan but keeps a display name", () => {
  assert.equal(isSubscriptionPlanKey("unlimited"), false);
  assert.match(planDisplayName("unlimited"), /discontinued/i);
  assert.equal(planDisplayName("business10"), "Business10");
});
