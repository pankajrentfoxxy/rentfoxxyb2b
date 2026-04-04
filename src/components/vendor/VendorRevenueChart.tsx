"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type VendorChartPoint = { date: string; amount: number };

export function VendorRevenueChart({ data }: { data: VendorChartPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(8, 10) + "/" + d.date.slice(5, 7),
  }));

  return (
    <div className="h-72 w-full rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">Your share of revenue (last 30 days)</h2>
      <p className="mt-0.5 text-xs text-muted">Based on your line items on delivered / settled-stage orders.</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-slate-500" />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `₹${Number(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip
              formatter={(value) => [
                `₹${Number(value ?? 0).toLocaleString("en-IN")}`,
                "Revenue",
              ]}
              labelFormatter={(_, items) => {
                const row = items?.[0]?.payload as { date?: string } | undefined;
                return row?.date ? String(row.date) : "";
              }}
            />
            <Bar dataKey="amount" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
