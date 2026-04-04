import { SignInForm } from "@/components/storefront/SignInForm";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; registered?: string };
}) {
  const callbackUrl = searchParams.callbackUrl ?? "/";
  const justRegistered = searchParams.registered === "1";
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-slate-900">Log in</h1>
      <p className="mt-2 text-center text-sm text-muted">
        Access your buyer, vendor, or admin dashboard.
      </p>
      {justRegistered ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-900">
          Account created. Log in with your email and password.
        </p>
      ) : null}
      <SignInForm className="mt-8" callbackUrl={callbackUrl} />
      <p className="mt-4 text-center text-sm">
        <Link href="/auth/forgot-password" className="font-medium text-accent hover:underline">
          Forgot password?
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/auth/register" className="font-medium text-accent hover:underline">
          Register
        </Link>
      </p>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/" className="font-medium text-accent hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
