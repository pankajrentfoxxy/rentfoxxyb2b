import Logo from "@/components/ui/Logo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 lg:hidden">
        <Logo size="md" variant="nav-on-light" />
      </div>
      <h1 className="mb-1 text-[24px] font-medium text-ink-primary">Forgot password</h1>
      <p className="text-[13px] leading-relaxed text-ink-muted">
        Self-serve password reset is coming soon. Please contact{" "}
        <a href="mailto:support@rentfoxxy.com" className="font-medium text-lot hover:underline">
          support@rentfoxxy.com
        </a>{" "}
        for help accessing your account.
      </p>
      <p className="mt-8 text-center text-sm">
        <Link href="/auth/login" className="font-medium text-lot hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
