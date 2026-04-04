"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCallback, useEffect, useState } from "react";

type Tab = "sales" | "vendors" | "bids" | "customers";

export function AdminReportsClient() {
  const [tab, setTab] = useState<Tab>("sales");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?type=${tab}&from=${from}&to=${to}`);
      if (!res.ok) return;
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tab, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  function downloadCsv(rows: Record<string, unknown>[], filename: string) {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sales = data as {
    gmv?: number;
    orders?: number;
    aov?: number;
    categoryRows?: { name: string; amount: number }[];
  } | null;

  const vendors = data as { rows?: { companyName: string; revenue: number; commission: number }[] } | null;
  const bids = data as {
    totalBids?: number;
    conversionPct?: number;
    avgDiscountPct?: number;
    byProduct?: { name: string; bids: number }[];
  } | null;
  const customers = data as {
    newCustomers?: number;
    repeatCustomers?: number;
    topSpenders?: { email: string; totalSpend: number; orderCount: number }[];
  } | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          {(["sales", "vendors", "bids", "customers"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                tab === t ? "bg-primary text-white" : "bg-slate-100"
              }`}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <label className="text-xs">
          From
          <input
            type="date"
            className="mt-1 block rounded border px-2 py-1 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-xs">
          To
          <input
            type="date"
            className="mt-1 block rounded border px-2 py-1 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="text-sm text-muted">Loading…</p> : null}

      {tab === "sales" && sales?.categoryRows ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Summary</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              <li>GMV: ₹{(sales.gmv ?? 0).toLocaleString("en-IN")}</li>
              <li>Orders: {sales.orders}</li>
              <li>AOV: ₹{(sales.aov ?? 0).toLocaleString("en-IN")}</li>
            </ul>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-accent hover:underline"
              onClick={() =>
                downloadCsv(
                  (sales.categoryRows ?? []).map((r) => ({ category: r.name, amount: r.amount })),
                  "sales-by-category.csv",
                )
              }
            >
              Export categories CSV
            </button>
          </div>
          <div className="h-72 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sales.categoryRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v) => [`₹${Number(v ?? 0).toLocaleString("en-IN")}`, "Amount"]}
                />
                <Bar dataKey="amount" fill="#0f2d5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {tab === "vendors" && vendors?.rows ? (
        <div className="space-y-3">
          <button
            type="button"
            className="text-sm font-medium text-accent hover:underline"
            onClick={() => downloadCsv(vendors.rows as unknown as Record<string, unknown>[], "vendors.csv")}
          >
            Export CSV
          </button>
          <div className="h-72 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendors.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="companyName" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`₹${Number(v ?? 0).toLocaleString("en-IN")}`, ""]} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {tab === "bids" && bids ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Total {bids.totalBids} · Conversion {bids.conversionPct}% · Avg discount {bids.avgDiscountPct}%
          </p>
          <div className="h-72 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bids.byProduct ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="bids" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-accent hover:underline"
            onClick={() =>
              downloadCsv((bids.byProduct ?? []).map((r) => ({ product: r.name, bids: r.bids })), "bids-by-product.csv")
            }
          >
            Export CSV
          </button>
        </div>
      ) : null}

      {tab === "customers" && customers?.topSpenders ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            New in range: {customers.newCustomers} · Repeat buyers: {customers.repeatCustomers}
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-surface text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Orders</th>
                  <th className="px-3 py-2">Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.topSpenders.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-xs">{c.email}</td>
                    <td className="px-3 py-2">{c.orderCount}</td>
                    <td className="px-3 py-2">₹{c.totalSpend.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-accent hover:underline"
            onClick={() =>
              downloadCsv(customers.topSpenders as unknown as Record<string, unknown>[], "customers.csv")
            }
          >
            Export CSV
          </button>
        </div>
      ) : null}
    </div>
  );
}
