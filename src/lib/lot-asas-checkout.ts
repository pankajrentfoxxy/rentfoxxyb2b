import {
  getPaymentOptionConfig,
  parsePaymentOption,
  roundMoney,
  type PaymentOptionId,
} from "@/constants/payment-options";
import { gstBreakdown } from "@/lib/gst";

export function lotPurchasePricing(pricePerLot: number, lotsCount: number) {
  const subtotalExGst = roundMoney(pricePerLot * lotsCount);
  return gstBreakdown(subtotalExGst);
}

export function lotPayNowAmount(gstTotal: number, paymentOption: PaymentOptionId) {
  const cfg = getPaymentOptionConfig(paymentOption);
  if (paymentOption === "FULL") return gstTotal;
  return roundMoney(gstTotal * (cfg.tokenPct / 100));
}

export function asAsPurchasePricing(avgUnitPrice: number, quantity: number) {
  const subtotalExGst = roundMoney(avgUnitPrice * quantity);
  return gstBreakdown(subtotalExGst);
}

export function parsePayOpt(v: string | null | undefined): PaymentOptionId {
  return parsePaymentOption(v);
}

export function checkoutReference(prefix: "LP" | "AS") {
  return `RFX-${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}
