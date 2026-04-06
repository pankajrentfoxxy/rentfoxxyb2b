import { Resend } from "resend";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

/** Use a verified domain in production. Until then Resend allows onboarding@resend.dev. */
export const fromEmail = () => {
  const name = process.env.FROM_NAME?.trim() || "Rentfoxxy";
  const f = process.env.FROM_EMAIL?.trim();
  if (f) return `${name} <${f}>`;
  return `${name} <onboarding@resend.dev>`;
};
