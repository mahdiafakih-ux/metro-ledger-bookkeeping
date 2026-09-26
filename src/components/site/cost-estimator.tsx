"use client";

import { useState } from "react";

const PLANS = [
  { key: "business10", name: "Business10", base: 1000, included: 10, overage: 75 },
  { key: "business30", name: "Business30", base: 3000, included: 30, overage: 75 },
];

function calcCost(base: number, included: number, overage: number, count: number) {
  if (count <= included) return base;
  return base + (count - included) * overage;
}

export function CostEstimator() {
  const [count, setCount] = useState(15);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-navy-100 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <label className="block text-sm font-semibold text-navy-700 mb-2">
          Estimated appointments per month:{" "}
          <span className="text-accent-600">{count}</span>
        </label>
        <input
          type="range"
          min={1}
          max={60}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full accent-accent-500"
        />
        <div className="flex justify-between text-xs text-navy-400 mt-1">
          <span>1</span>
          <span>60</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const total = calcCost(plan.base, plan.included, plan.overage, count);
          const overageCount = Math.max(0, count - plan.included);
          return (
            <div
              key={plan.key}
              className="rounded-xl border-2 border-navy-100 p-5 text-center"
            >
              <div className="text-sm font-semibold text-navy-500 mb-1">{plan.name}</div>
              <div className="text-3xl font-bold text-navy-900">
                ${total.toLocaleString()}
                <span className="text-base font-normal text-navy-400">/mo</span>
              </div>
              {overageCount > 0 ? (
                <div className="mt-2 text-xs text-navy-500">
                  ${plan.base.toLocaleString()} base + {overageCount} overage × $75
                </div>
              ) : (
                <div className="mt-2 text-xs text-success-600 font-medium">
                  ✓ Within included {plan.included} appointments
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-navy-400">
        Estimates exclude the Michigan statutory notarial fee ($10/act, MCL 55.287), which is
        always disclosed separately.
      </p>
    </div>
  );
}
