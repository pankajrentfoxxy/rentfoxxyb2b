"use client";

import { VendorPaymentPreferencesForm } from "@/components/vendor/VendorPaymentPreferencesForm";
import { useEffect, useState } from "react";

type Profile = {
  vendor: {
    companyName: string;
    gstin: string;
    pan: string;
    bankAccount: string;
    ifscCode: string;
    accountName: string;
    commissionRate: number;
    status: string;
  };
  user: { email: string; name: string | null; phone: string | null };
};

export function VendorProfileForm() {
  const [data, setData] = useState<Profile | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [pan, setPan] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/vendor/profile");
      if (!res.ok) return;
      const p = (await res.json()) as Profile;
      setData(p);
      setCompanyName(p.vendor.companyName);
      setBankAccount(p.vendor.bankAccount);
      setIfscCode(p.vendor.ifscCode);
      setAccountName(p.vendor.accountName);
      setPan(p.vendor.pan);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          bankAccount,
          ifscCode,
          accountName,
          pan,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error ?? "Save failed");
        return;
      }
      setMsg("Saved.");
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return <p className="text-sm text-muted">Loading profile…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-muted">
          Update company and payout details. GSTIN is registered with support and is not editable here.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-slate-800">{data.user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Commission</dt>
            <dd className="font-medium text-slate-800">{data.vendor.commissionRate}%</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">GSTIN</dt>
            <dd className="font-mono text-xs text-slate-800">{data.vendor.gstin}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Vendor status</dt>
            <dd className="font-medium text-slate-800">{data.vendor.status.replace(/_/g, " ")}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
        <div>
          <label className="text-sm font-medium text-slate-700">Company name</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">PAN</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase"
            value={pan}
            onChange={(e) => setPan(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Account holder name</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Bank account number</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">IFSC</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <VendorPaymentPreferencesForm />
    </div>
  );
}
