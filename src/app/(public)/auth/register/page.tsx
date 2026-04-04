import { RegisterWizard } from "@/components/storefront/RegisterWizard";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Register",
};

function RegisterFallback() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-slate-900">Create an account</h1>
      <p className="mt-2 text-center text-sm text-muted">
        Register as a buyer or vendor. We&apos;ll email a one-time code to verify your address.
      </p>
      <Suspense fallback={<RegisterFallback />}>
        <RegisterWizard className="mt-8" />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/" className="font-medium text-accent hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
