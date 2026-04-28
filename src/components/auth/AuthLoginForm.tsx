"use client";

import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AuthLoginForm({
  className,
  callbackUrl: callbackUrlProp = "/",
}: {
  className?: string;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? callbackUrlProp;
  const justRegistered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password, or registration is not complete yet.");
      return;
    }
    await router.refresh();
    const session = await getSession();
    let dest = callbackUrl;
    if (!dest || dest === "/") {
      const role = session?.user?.role;
      if (role === "CUSTOMER") dest = "/customer/dashboard";
      else if (role === "VENDOR") dest = "/vendor/dashboard";
      else if (role === "ADMIN") dest = "/admin/dashboard";
      else dest = "/";
    }
    router.push(dest);
    router.refresh();
  }

  return (
    <div className={cn("mx-auto w-full max-w-sm", className)}>
      <div className="mb-8 lg:hidden">
        <Logo size="md" variant="nav-on-light" />
      </div>
      <h1 className="mb-1 text-[24px] font-medium text-ink-primary">Sign in to Rentfoxxy</h1>
      <p className="mb-6 text-[13px] text-ink-muted">Welcome back. Enter your credentials to continue.</p>
      {justRegistered ? (
        <p className="mb-4 rounded-lg border border-verified-border bg-verified-bg px-3 py-2 text-[12px] text-verified-text">
          Account created. Sign in with your email and password.
        </p>
      ) : null}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-[12px] font-medium text-ink-primary">
            Email address
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px] text-ink-primary outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
        <div>
          <div className="mb-1.5 flex justify-between">
            <label htmlFor="auth-password" className="text-[12px] font-medium text-ink-primary">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-[12px] text-lot hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="auth-password"
              name="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border py-2.5 pl-3 pr-10 text-[13px] text-ink-primary outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle size={14} className="flex-shrink-0 text-red-500" />
            <p className="text-[12px] text-red-700">{error}</p>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-navy-light disabled:opacity-60"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Continue
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
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[11px] text-ink-muted">New to Rentfoxxy?</span>
        </div>
      </div>
      <Link
        href="/auth/register"
        className="block w-full rounded-lg border border-border py-2.5 text-center text-[13px] font-medium text-ink-secondary transition-colors hover:border-navy/30 hover:bg-surface"
      >
        Create your Rentfoxxy account
      </Link>
    </div>
  );
}
