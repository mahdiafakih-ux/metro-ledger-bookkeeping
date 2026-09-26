// Run with: npm test   (Node's built-in test runner via tsx — no extra deps)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SUBSCRIPTION_PLANS,
  allocateOverage,
  business30BreakEven,
  cheapestPlanFor,
  feeBreakdown,
  isSubscriptionPlanKey,
  monthlyCostCents,
  planDisplayName,
} from "../src/lib/plans";

const { business10, business30 } = SUBSCRIPTION_PLANS;

test("Business10 monthly totals match the published examples", () => {
  assert.equal(monthlyCostCents(business10, 10), 100_000);
  assert.equal(monthlyCostCents(business10, 11), 107_500);
  assert.equal(monthlyCostCents(business10, 15), 137_500);
  assert.equal(monthlyCostCents(business10, 20), 175_000);
  assert.equal(monthlyCostCents(business10, 0), 100_000);
});

test("Business30 monthly totals match the published examples", () => {
  assert.equal(monthlyCostCents(business30, 30), 300_000);
  assert.equal(monthlyCostCents(business30, 31), 307_500);
  assert.equal(monthlyCostCents(business30, 35), 337_500);
  assert.equal(monthlyCostCents(business30, 40), 375_000);
});

test("both plans charge $75 per additional notarization", () => {
  assert.equal(business10.overagePerNotarizationCents, 7_500);
  assert.equal(business30.overagePerNotarizationCents, 7_500);
});

test("estimator never claims the wrong plan is cheaper", () => {
  // With $75 overage on both plans, Business10 is lower-cost at every volume:
  // 30 → $2,500 vs $3,000; above 30 it stays exactly $500 lower.
  assert.equal(business30BreakEven(), Infinity);
  assert.equal(cheapestPlanFor(30).key, "business10");
  assert.equal(monthlyCostCents(business10, 40) - monthlyCostCents(business30, 40), -50_000);
  for (let n = 0; n <= 80; n++) {
    const best = cheapestPlanFor(n);
    const other = best.key === "business10" ? business30 : business10;
    assert.ok(monthlyCostCents(best, n) <= monthlyCostCents(other, n), `n=${n}`);
  }
});

test("Michigan fee breakdown keeps statutory fee at $10/act", () => {
  const b10 = feeBreakdown(business10);
  assert.equal(b10.statutoryCents, 10 * 1000);
  assert.equal(b10.statutoryCents + b10.serviceCents, business10.monthlyCents);
  assert.equal(b10.overageStatutoryCents + b10.overageServiceCents, 7_500);
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
