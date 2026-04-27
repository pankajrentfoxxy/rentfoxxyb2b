import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; registered?: string };
}) {
  const q = new URLSearchParams();
  if (searchParams.callbackUrl) q.set("callbackUrl", searchParams.callbackUrl);
  if (searchParams.registered) q.set("registered", searchParams.registered);
  const suffix = q.toString();
  redirect(suffix ? `/auth/login?${suffix}` : "/auth/login");
}
