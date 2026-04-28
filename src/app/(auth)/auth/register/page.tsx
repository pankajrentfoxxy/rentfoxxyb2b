"use client";

import Logo from "@/components/ui/Logo";
import type { Role } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STORAGE_EMAIL = "rentfoxxy_reg_v18_email";
const STORAGE_ROLE = "rentfoxxy_reg_v18_role";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Extract<Role, "CUSTOMER" | "VENDOR">>("CUSTOMER");
  const [error, setError] = useState<string | null>(null);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const em = email.trim().toLowerCase();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Enter a valid email address");
      return;
    }
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_EMAIL, em);
    sessionStorage.setItem(STORAGE_ROLE, role);
    router.push("/auth/register/steps");
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 lg:hidden">
        <Logo size="md" variant="nav-on-light" />
      </div>
      <h1 className="mb-1 text-[24px] font-medium text-ink-primary">Create account</h1>
      <p className="mb-6 text-[13px] text-ink-muted">Enter your email to get started.</p>

      <div className="mb-5 flex overflow-hidden rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setRole("CUSTOMER")}
          className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
            role === "CUSTOMER" ? "bg-navy text-white" : "bg-white text-ink-secondary hover:bg-surface"
          }`}
        >
          I&apos;m a Buyer
        </button>
        <button
          type="button"
          onClick={() => setRole("VENDOR")}
          className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
            role === "VENDOR" ? "bg-navy text-white" : "bg-white text-ink-secondary hover:bg-surface"
          }`}
        >
          I&apos;m a Vendor
        </button>
      </div>

      <form onSubmit={handleContinue} className="space-y-4">
        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-[12px] font-medium text-ink-primary">
            Email address
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px] text-ink-primary outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
        {error ? <p className="text-[12px] text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-navy py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-navy-light"
        >
          Continue →
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-muted">
        By continuing, you agree to Rentfoxxy&apos;s{" "}
        <Link href="/terms" className="text-lot underline">
          Conditions of Use
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-lot underline">
          Privacy Notice
        </Link>
        .
      </p>
      <p className="mt-6 text-center text-[13px] text-ink-secondary">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-lot hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
