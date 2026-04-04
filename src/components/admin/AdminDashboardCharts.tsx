"use client";

import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#2563eb", "#0f766e", "#d97706", "#7c3aed", "#dc2626", "#64748b", "#059669"];

export function AdminDashboardCharts({
  gmvSeries,
  statusPie,
}: {
  gmvSeries:Array<{ date: string; gmv: number }>;
  statusPie: Array<{ name: string; value: number }>;
}) {
  const lineData = gmvSeries.map((d) => ({
    ...d,
    label: d.date.slice(8, 10) + "/" + d.date.slice(5, 7),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">GMV (30 days)</h2>
        <p className="text-xs text-muted">Paid / active orders (excl. cancelled).</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${v}`)} />
              <Tooltip formatter={(v) => [`₹${Number(v ?? 0).toLocaleString("en-IN")}`, "GMV"]} />
              <Line type="monotone" dataKey="gmv" stroke="#0f2d5e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Orders by status</h2>
        <p className="text-xs text-muted">All time snapshot.</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                {statusPie.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
