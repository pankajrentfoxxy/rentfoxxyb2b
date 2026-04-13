/** Addendum v1.6: only Full payment and 5% token (7-day / 168h balance window). */

export type PaymentOptionId = "FULL" | "TOKEN_5";

export const TOKEN_WINDOW_HOURS = 168; // 7 days
export const TOKEN_PERCENTAGE = 5;

export const PAYMENT_OPTIONS: {
  id: PaymentOptionId;
  label: string;
  subtitle: string;
  tokenPct: number;
  windowHours: number;
  windowLabel: string | null;
  badge: string;
  badgeColor: "green" | "amber";
  description: string;
}[] = [
  {
    id: "FULL",
    label: "Full Payment",
    subtitle: "Pay 100% now — fastest dispatch",
    tokenPct: 100,
    windowHours: 0,
    windowLabel: null,
    badge: "✓ Recommended",
    badgeColor: "green",
    description: "Pay 100% now. Fastest dispatch once the supplier fulfils.",
  },
  {
    id: "TOKEN_5",
    label: "Pay 5% Token Now",
    subtitle: "Lock stock now, pay balance within 7 days",
    tokenPct: 5,
    windowHours: TOKEN_WINDOW_HOURS,
    windowLabel: "7 days",
    badge: "🔒 Stock Locked",
    badgeColor: "amber",
    description: "Lock stock with 5% advance; balance due within 7 days (168 hours).",
  },
];

export function parsePaymentOption(v: string | null | undefined): PaymentOptionId {
  if (!v || v === "FULL") return "FULL";
  // Legacy token options map to 5% / 7-day window
  if (v === "TOKEN_2" || v === "TOKEN_3" || v === "TOKEN_4" || v === "TOKEN_5") return "TOKEN_5";
  return "FULL";
}

export function getPaymentOptionConfig(id: PaymentOptionId) {
  return PAYMENT_OPTIONS.find((o) => o.id === id) ?? PAYMENT_OPTIONS[0]!;
}

export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}
