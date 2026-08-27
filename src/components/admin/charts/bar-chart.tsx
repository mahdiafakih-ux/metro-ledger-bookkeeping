"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function SimpleBarChart({
  data,
  dataKey,
  color = "#2354eb",
  format = "number",
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  color?: string;
  format?: "currency" | "number";
}) {
  const formatValue = (v: number) => (format === "currency" ? `$${v.toLocaleString()}` : v.toLocaleString());
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e7f4" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64749f" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64749f" }} width={36} />
        <Tooltip
          formatter={(value) => [formatValue(Number(value)), ""] as [string, string]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e3e7f4", fontSize: 13 }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
