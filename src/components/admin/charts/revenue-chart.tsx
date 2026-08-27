"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCents } from "@/lib/money";

export function RevenueChart({ data }: { data: { label: string; revenueCents: number }[] }) {
  const chartData = data.map((d) => ({ label: d.label, revenue: d.revenueCents / 100 }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b6bff" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3b6bff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e7f4" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64749f" }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#64749f" }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}k`}
          width={48}
        />
        <Tooltip
          formatter={(value) => [Number(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }), "Revenue"] as [string, string]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e3e7f4", fontSize: 13 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#2354eb" strokeWidth={2.5} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function formatChartCents(v: number) {
  return formatCents(v, { showCents: false });
}
