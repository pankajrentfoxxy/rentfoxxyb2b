"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminNewVendorForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [commissionRate, setCommissionRate] = useState("8");
  const [activate, setActivate] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          companyName,
          gstin,
          pan,
          bankAccount,
          ifscCode,
          accountName,
          commissionRate: Number(commissionRate),
          status: activate ? "ACTIVE" : "PENDING_APPROVAL",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed");
        return;
      }
      router.push(`/admin/vendors/${data.vendorId}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">Manual vendor onboarding</h1>
      <p className="text-sm text-muted">Creates login + vendor profile. Share credentials securely.</p>
      <input
        required
        type="email"
        className="w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        required
        type="password"
        className="w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="Temporary password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="Company name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />
      <input
        required
        className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
        placeholder="GSTIN"
        value={gstin}
        onChange={(e) => setGstin(e.target.value)}
      />
      <input
        className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
        placeholder="PAN"
        value={pan}
        onChange={(e) => setPan(e.target.value)}
      />
      <input
        className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
        placeholder="Bank account"
        value={bankAccount}
        onChange={(e) => setBankAccount(e.target.value)}
      />
      <input
        className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
        placeholder="IFSC"
        value={ifscCode}
        onChange={(e) => setIfscCode(e.target.value)}
      />
      <input
        className="w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="Account holder name"
        value={accountName}
        onChange={(e) => setAccountName(e.target.value)}
      />
      <input
        type="number"
        className="w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="Commission %"
        value={commissionRate}
        onChange={(e) => setCommissionRate(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
        Activate immediately (skip pending)
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create vendor"}
      </button>
    </form>
  );
}
