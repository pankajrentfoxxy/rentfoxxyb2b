"use client";

import { AlertCircle, ClipboardCheck, Loader2 } from "lucide-react";
import { getSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function InspectorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (!result?.ok) {
        setError("Invalid email or password.");
        return;
      }
      const session = await getSession();
      const r = session?.user?.role as string | undefined;
      if (r !== "INSPECTOR" && r !== "INSPECTION_MANAGER") {
        await signOut({ redirect: false });
        setError("Access denied. This portal is for inspectors only.");
        return;
      }
      const cb = searchParams.get("callbackUrl");
      router.push(cb?.startsWith("/") ? cb : "/inspector/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-900 to-indigo-900 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100">
            <ClipboardCheck className="h-8 w-8 text-teal-700" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Inspector Portal</h1>
          <p className="mt-1 text-sm text-muted">Rentfoxxy verification team login</p>
        </div>
        <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-primary">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-teal-500"
              placeholder="inspector@rentfoxxy.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-primary">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 py-3.5 font-bold text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Sign in to Inspector Portal
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted">
          Authorised inspectors only.{" "}
          <Link href="/auth/login" className="text-teal-700 underline">
            Customer / vendor login
          </Link>
        </p>
      </div>
    </div>
  );
}
