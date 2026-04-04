import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Briefcase,
  Building2,
  CreditCard,
  Link as LinkIcon,
  Percent,
  Smartphone,
  Wallet,
} from "lucide-react";

export const PAYMENT_METHOD_IDS = [
  "UPI",
  "NET_BANKING",
  "CARD",
  "NEFT_RTGS",
  "CORPORATE_CARD",
  "RAZORPAY_LINK",
  "TOKEN_PAYMENT",
  "FULL_ADVANCE",
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number];

export const DEFAULT_VENDOR_PAYMENT_METHODS: PaymentMethodId[] = [
  "UPI",
  "NET_BANKING",
  "CARD",
  "RAZORPAY_LINK",
  "TOKEN_PAYMENT",
];

export const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethodId,
  { label: string; description: string; icon: LucideIcon }
> = {
  UPI: {
    label: "UPI / QR",
    description: "GPay, PhonePe, Paytm — instant",
    icon: Smartphone,
  },
  NET_BANKING: {
    label: "Net banking",
    description: "IMPS/NEFT via internet banking",
    icon: Building2,
  },
  CARD: {
    label: "Debit / credit card",
    description: "Visa, Mastercard, RuPay",
    icon: CreditCard,
  },
  NEFT_RTGS: {
    label: "NEFT / RTGS",
    description: "Bank wire for high value",
    icon: ArrowLeftRight,
  },
  CORPORATE_CARD: {
    label: "Corporate card",
    description: "Business card + GST invoice",
    icon: Briefcase,
  },
  RAZORPAY_LINK: {
    label: "Payment link",
    description: "Checkout via Razorpay",
    icon: LinkIcon,
  },
  TOKEN_PAYMENT: {
    label: "Token + balance",
    description: "Advance token with deferred balance on bids",
    icon: Percent,
  },
  FULL_ADVANCE: {
    label: "Full advance",
    description: "100% upfront before dispatch",
    icon: Wallet,
  },
};

export function normalizePaymentMethodIds(methods: string[]): PaymentMethodId[] {
  const allowed = new Set<string>(PAYMENT_METHOD_IDS);
  return methods.filter((m): m is PaymentMethodId => allowed.has(m));
}

export const MIN_TOKEN_PERCENT_OPTIONS = [2, 3, 4, 5, 100] as const;
