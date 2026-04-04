"use client";

import { cn } from "@/lib/utils";
import type { Address } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const tabs = [
  { id: "personal", label: "Personal info" },
  { id: "addresses", label: "Addresses" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function CustomerProfileClient({
  initialUser,
  initialCompanyName,
  initialGstin,
  initialAddresses,
}: {
  initialUser: { name: string | null; email: string; phone: string | null };
  initialCompanyName: string | null;
  initialGstin: string | null;
  initialAddresses: Address[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("personal");
  const [name, setName] = useState(initialUser.name ?? "");
  const [phone, setPhone] = useState(initialUser.phone ?? "");
  const [companyName, setCompanyName] = useState(initialCompanyName ?? "");
  const [gstin, setGstin] = useState(initialGstin ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [addresses, setAddresses] = useState(initialAddresses);

  const [addrForm, setAddrForm] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  async function savePersonal(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || null, phone: phone || null, companyName, gstin }),
    });
    if (!res.ok) {
      const d = await res.json();
      setMsg(d.error ?? "Save failed");
      return;
    }
    setMsg("Saved.");
    router.refresh();
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/customer/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addrForm),
    });
    const d = await res.json();
    if (!res.ok) {
      setMsg(d.error ?? "Failed");
      return;
    }
    setAddresses((prev) => [...prev, d.address]);
    setAddrForm({
      label: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
    setMsg("Address added.");
  }

  async function removeAddress(id: string) {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/customer/addresses/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.next !== pw.confirm) {
      setMsg("New passwords do not match");
      return;
    }
    const res = await fetch("/api/customer/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
    });
    const d = await res.json();
    if (!res.ok) {
      setMsg(d.error ?? "Failed");
      return;
    }
    setPw({ current: "", next: "", confirm: "" });
    setMsg("Password updated.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-muted">Account and company details for B2B invoices.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setMsg(null);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              tab === t.id ? "bg-accent text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg ? (
        <p className="text-sm text-emerald-800" role="status">
          {msg}
        </p>
      ) : null}

      {tab === "personal" ? (
        <form onSubmit={savePersonal} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input disabled className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm" value={initialUser.email} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Company name</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">GSTIN</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={gstin} onChange={(e) => setGstin(e.target.value)} />
          </div>
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
        </form>
      ) : null}

      {tab === "addresses" ? (
        <div className="space-y-6">
          <ul className="space-y-2">
            {addresses.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <div>
                  <p className="font-medium">{a.label}</p>
                  <p className="text-muted">
                    {a.line1}, {a.city}, {a.state} {a.pincode}
                  </p>
                  {a.isDefault ? <span className="text-xs text-accent">Default</span> : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeAddress(a.id)}
                  className="text-xs text-danger hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={addAddress} className="space-y-3 rounded-xl border border-dashed border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900">Add address</h3>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Label"
              value={addrForm.label}
              onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))}
              required
            />
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Line 1"
              value={addrForm.line1}
              onChange={(e) => setAddrForm((f) => ({ ...f, line1: e.target.value }))}
              required
            />
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Line 2"
              value={addrForm.line2}
              onChange={(e) => setAddrForm((f) => ({ ...f, line2: e.target.value }))}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className="rounded border px-3 py-2 text-sm"
                placeholder="City"
                value={addrForm.city}
                onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                required
              />
              <input
                className="rounded border px-3 py-2 text-sm"
                placeholder="State"
                value={addrForm.state}
                onChange={(e) => setAddrForm((f) => ({ ...f, state: e.target.value }))}
                required
              />
              <input
                className="rounded border px-3 py-2 text-sm"
                placeholder="Pincode"
                value={addrForm.pincode}
                onChange={(e) => setAddrForm((f) => ({ ...f, pincode: e.target.value }))}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={addrForm.isDefault}
                onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
              Set as default
            </label>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
              Add address
            </button>
          </form>
        </div>
      ) : null}

      {tab === "security" ? (
        <form onSubmit={savePassword} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Current password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">New password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Confirm new</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
            Update password
          </button>
        </form>
      ) : null}

      {tab === "notifications" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted">
          <p className="font-medium text-slate-900">Email preferences</p>
          <p className="mt-2">
            Granular toggles (orders, bids, marketing) will connect to your notification settings in a future
            release. Critical transactional emails are always sent.
          </p>
        </div>
      ) : null}
    </div>
  );
}
