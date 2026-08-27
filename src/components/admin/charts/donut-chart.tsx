"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#2354eb", "#6690ff", "#9bb6ff", "#16b364", "#d97706", "#94a1c4", "#c8d7ff"];

export function DonutChart({
  data,
  format = "currency",
}: {
  data: { label: string; value: number }[];
  format?: "currency" | "number";
}) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) {
    return <p className="flex h-64 items-center justify-center text-sm text-navy-400">No data yet</p>;
  }
  const formatValue = (v: number) => (format === "currency" ? `$${v.toLocaleString()}` : v.toLocaleString());
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={filtered} dataKey="value" nameKey="label" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {filtered.map((entry, i) => (
            <Cell key={entry.label} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [formatValue(Number(value)), ""] as [string, string]} contentStyle={{ borderRadius: 12, border: "1px solid #e3e7f4", fontSize: 13 }} />
        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
