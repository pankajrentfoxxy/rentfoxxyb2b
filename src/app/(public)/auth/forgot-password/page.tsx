import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-slate-900">Forgot password</h1>
      <p className="mt-3 text-center text-sm text-muted">
        Self-serve password reset is coming soon. Please contact{" "}
        <a href="mailto:support@rentfoxxy.com" className="font-medium text-accent hover:underline">
          support@rentfoxxy.com
        </a>{" "}
        for help accessing your account.
      </p>
      <p className="mt-8 text-center text-sm">
        <Link href="/auth/login" className="font-medium text-accent hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
