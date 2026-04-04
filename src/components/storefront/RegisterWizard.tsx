"use client";

import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Tab = Extract<Role, "CUSTOMER" | "VENDOR">;

export function RegisterWizard({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  const [tab, setTab] = useState<Tab>("CUSTOMER");
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (intent === "vendor") setTab("VENDOR");
    if (intent === "buyer") setTab("CUSTOMER");
  }, [intent]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        email,
        password,
        role: tab,
        name: name || undefined,
        phone: phone || undefined,
        companyName: companyName || undefined,
        gstin: gstin || undefined,
      };
      if (tab === "VENDOR") {
        body.companyName = companyName;
        body.gstin = gstin;
        body.pan = pan;
        body.bankAccount = bankAccount;
        body.ifscCode = ifscCode;
        body.accountName = accountName || undefined;
      }

      const res = await fetch("/api/public/register/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      if (data.devOtp) setDevOtp(data.devOtp as string);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function submitComplete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/public/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }
      router.push("/auth/login?registered=1");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
      {step === 1 ? (
        <form onSubmit={submitRequest} className="space-y-4">
          <div className="flex rounded-lg border border-slate-200 p-1">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium",
                tab === "CUSTOMER" ? "bg-primary text-white" : "text-slate-600",
              )}
              onClick={() => setTab("CUSTOMER")}
            >
              Buyer
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium",
                tab === "VENDOR" ? "bg-primary text-white" : "text-slate-600",
              )}
              onClick={() => setTab("VENDOR")}
            >
              Vendor
            </button>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700">
              Name <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="reg-phone" className="block text-sm font-medium text-slate-700">
              Phone <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>

          {tab === "CUSTOMER" ? (
            <>
              <div>
                <label htmlFor="reg-company" className="block text-sm font-medium text-slate-700">
                  Company <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="reg-company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="reg-gstin" className="block text-sm font-medium text-slate-700">
                  GSTIN <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="reg-gstin"
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="v-company" className="block text-sm font-medium text-slate-700">
                  Company name
                </label>
                <input
                  id="v-company"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="v-gstin" className="block text-sm font-medium text-slate-700">
                  GSTIN
                </label>
                <input
                  id="v-gstin"
                  type="text"
                  required
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="v-pan" className="block text-sm font-medium text-slate-700">
                  PAN
                </label>
                <input
                  id="v-pan"
                  type="text"
                  required
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="v-bank" className="block text-sm font-medium text-slate-700">
                  Bank account number
                </label>
                <input
                  id="v-bank"
                  type="text"
                  required
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="v-ifsc" className="block text-sm font-medium text-slate-700">
                  IFSC
                </label>
                <input
                  id="v-ifsc"
                  type="text"
                  required
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="v-accname" className="block text-sm font-medium text-slate-700">
                  Account name <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="v-accname"
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                />
              </div>
            </>
          )}

          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
          >
            {loading ? "Sending code…" : "Send verification code"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitComplete} className="space-y-4">
          <p className="text-sm text-slate-700">
            Enter the code we sent to <strong>{email}</strong>.
          </p>
          {devOtp ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Dev mode — your code: <strong>{devOtp}</strong>
            </p>
          ) : null}
          <div>
            <label htmlFor="reg-otp" className="block text-sm font-medium text-slate-700">
              Verification code
            </label>
            <input
              id="reg-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify & create account"}
          </button>
          <button
            type="button"
            className="w-full text-sm font-medium text-accent hover:underline"
            onClick={() => {
              setStep(1);
              setOtp("");
              setError(null);
              setDevOtp(null);
            }}
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
