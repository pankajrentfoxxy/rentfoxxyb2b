import { AuthLoginForm } from "@/components/auth/AuthLoginForm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign in",
};

function LoginFallback() {
  return <div className="mx-auto h-40 max-w-sm animate-pulse rounded-xl bg-surface" />;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; registered?: string };
}) {
  const callbackUrl = searchParams.callbackUrl ?? "/";
  return (
    <Suspense fallback={<LoginFallback />}>
      <AuthLoginForm callbackUrl={callbackUrl} />
    </Suspense>
  );
}
