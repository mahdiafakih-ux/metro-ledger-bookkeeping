"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export interface TrajectoryChartPoint {
  label: string;
  requiredCents: number;
  actualCents: number | null;
  projectedCents: number | null;
}

export function TrajectoryChart({ data }: { data: TrajectoryChartPoint[] }) {
  const chartData = data.map((d) => ({
    label: d.label,
    Required: d.requiredCents / 100,
    Actual: d.actualCents !== null ? d.actualCents / 100 : null,
    Projected: d.projectedCents !== null ? d.projectedCents / 100 : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e7f4" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64749f" }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#64749f" }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={44}
        />
        <Tooltip
          formatter={(value) => (value != null ? `$${Number(value).toLocaleString()}` : "—")}
          contentStyle={{ borderRadius: 12, border: "1px solid #e3e7f4", fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="Required" stroke="#94a1c4" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
        <Line type="monotone" dataKey="Actual" stroke="#2354eb" strokeWidth={3} dot={{ r: 3 }} connectNulls />
        <Line type="monotone" dataKey="Projected" stroke="#d97706" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
