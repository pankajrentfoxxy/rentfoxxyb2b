export type PaymentOptionId = "FULL" | "TOKEN_2" | "TOKEN_3" | "TOKEN_4" | "TOKEN_5";

export const PAYMENT_OPTIONS: {
  id: PaymentOptionId;
  label: string;
  tokenPct: number;
  windowHours: number;
  description: string;
}[] = [
  {
    id: "FULL",
    label: "Full payment",
    tokenPct: 100,
    windowHours: 0,
    description: "Pay 100% now. Fastest dispatch once the supplier fulfils.",
  },
  {
    id: "TOKEN_2",
    label: "Pay 2% token now",
    tokenPct: 2,
    windowHours: 48,
    description: "Lock stock with a small advance; pay the balance within 48 hours.",
  },
  {
    id: "TOKEN_3",
    label: "Pay 3% token now",
    tokenPct: 3,
    windowHours: 72,
    description: "Lock stock with 3% advance; balance due within 72 hours.",
  },
  {
    id: "TOKEN_4",
    label: "Pay 4% token now",
    tokenPct: 4,
    windowHours: 96,
    description: "Lock stock with 4% advance; balance due within 96 hours (4 days).",
  },
  {
    id: "TOKEN_5",
    label: "Pay 5% token now",
    tokenPct: 5,
    windowHours: 120,
    description: "Lock stock with 5% advance; balance due within 5 days.",
  },
];

export function parsePaymentOption(v: string | null | undefined): PaymentOptionId {
  if (!v || v === "FULL") return "FULL";
  if (v === "TOKEN_2" || v === "TOKEN_3" || v === "TOKEN_4" || v === "TOKEN_5") return v;
  return "FULL";
}

export function getPaymentOptionConfig(id: PaymentOptionId) {
  return PAYMENT_OPTIONS.find((o) => o.id === id) ?? PAYMENT_OPTIONS[0]!;
}

export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}
