import { Resend } from "resend";

const RESEND_SANDBOX_FROM = "onboarding@resend.dev";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

/**
 * Resend returns 403 if `from` uses a domain that is not verified in the dashboard.
 * In development, non-@resend.dev senders are replaced with the sandbox address so local
 * runs do not silently keep a bad FROM_EMAIL (e.g. from shell, IDE, or an old process).
 * Production: set FROM_EMAIL to a verified address, or verify the domain in Resend.
 */
export const fromEmail = () => {
  const name = process.env.FROM_NAME?.trim() || "Rentfoxxy";
  const raw = process.env.FROM_EMAIL?.trim();
  const allowUnverifiedDev =
    process.env.RESEND_DEV_ALLOW_UNVERIFIED_FROM === "true" ||
    process.env.RESEND_DEV_ALLOW_UNVERIFIED_FROM === "1";

  if (
    process.env.NODE_ENV === "development" &&
    raw &&
    !raw.endsWith("@resend.dev") &&
    !allowUnverifiedDev
  ) {
    console.warn(
      `[resend] FROM_EMAIL="${raw}" is not verified with Resend yet (403). Using ${RESEND_SANDBOX_FROM} in development. ` +
        `Set FROM_EMAIL=${RESEND_SANDBOX_FROM} in .env.local, or RESEND_DEV_ALLOW_UNVERIFIED_FROM=true to force this sender.`,
    );
    return `${name} <${RESEND_SANDBOX_FROM}>`;
  }

  if (raw) return `${name} <${raw}>`;
  return `${name} <${RESEND_SANDBOX_FROM}>`;
};
