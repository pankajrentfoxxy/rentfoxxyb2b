import type { PaymentOptionId } from "@/constants/payment-options";
import { getPaymentOptionConfig } from "@/constants/payment-options";
import type { PaymentMethodId } from "@/constants/payment-methods";
import { gstBreakdown } from "@/lib/gst";
import type { VendorProfile } from "@prisma/client";

export type VendorPaymentFields = Pick<
  VendorProfile,
  | "acceptedPaymentMethods"
  | "requiresFullAdvance"
  | "minOrderForRTGS"
  | "minTokenPercentage"
  | "acceptsTokenPayment"
>;

function hasMethod(vendor: VendorPaymentFields, id: PaymentMethodId) {
  return vendor.acceptedPaymentMethods.includes(id);
}

/** Rentfoxxy checkout uses Razorpay — vendor must allow at least one supported checkout class. */
export function vendorAllowsRazorpayCheckout(vendor: VendorPaymentFields): boolean {
  return (
    hasMethod(vendor, "RAZORPAY_LINK") ||
    hasMethod(vendor, "CARD") ||
    hasMethod(vendor, "UPI") ||
    hasMethod(vendor, "NET_BANKING")
  );
}

export function validateVendorBidPayment(args: {
  vendor: VendorPaymentFields;
  paymentOption: PaymentOptionId;
  bidSubtotalExGst: number;
}): { ok: true } | { ok: false; error: string } {
  const { vendor, paymentOption } = args;
  const gst = gstBreakdown(args.bidSubtotalExGst);
  const totalIncl = gst.total;

  if (vendor.requiresFullAdvance && paymentOption !== "FULL") {
    return {
      ok: false,
      error: "This supplier requires full payment upfront. Please choose full payment.",
    };
  }

  const minTok = vendor.minTokenPercentage;
  const tokenAllowed =
    vendor.acceptsTokenPayment && minTok < 100 && hasMethod(vendor, "TOKEN_PAYMENT");

  if (paymentOption !== "FULL") {
    if (!tokenAllowed) {
      return {
        ok: false,
        error: "This supplier does not accept token payment on this order. Choose full payment.",
      };
    }
    const cfg = getPaymentOptionConfig(paymentOption);
    if (cfg.tokenPct < minTok) {
      return {
        ok: false,
        error: `This supplier requires at least a ${minTok}% token (or full payment).`,
      };
    }
    if (!hasMethod(vendor, "TOKEN_PAYMENT")) {
      return { ok: false, error: "Token payment is not accepted for this supplier listing." };
    }
  } else {
    if (!vendorAllowsRazorpayCheckout(vendor)) {
      return {
        ok: false,
        error:
          "This supplier has not enabled standard online checkout methods. Try another listing or contact support.",
      };
    }
  }

  if (
    vendor.minOrderForRTGS != null &&
    totalIncl >= vendor.minOrderForRTGS &&
    !hasMethod(vendor, "NEFT_RTGS")
  ) {
    return {
      ok: false,
      error: `Orders above ₹${vendor.minOrderForRTGS.toLocaleString("en-IN")} require NEFT/RTGS with this supplier. They must enable that method on their profile.`,
    };
  }

  return { ok: true };
}

type CartLineVendor = { subtotalExGst: number; vendorId: string; vendor: VendorPaymentFields };

/** Full-payment cart: enforce each vendor's RTGS threshold and Razorpay eligibility. */
export function validateCartVendorPayments(lines: CartLineVendor[]): { ok: true } | { ok: false; error: string } {
  const agg = new Map<string, { subEx: number; vendor: VendorPaymentFields }>();
  for (const line of lines) {
    const cur = agg.get(line.vendorId);
    const subEx = (cur?.subEx ?? 0) + line.subtotalExGst;
    agg.set(line.vendorId, { subEx, vendor: line.vendor });
  }

  for (const { subEx, vendor: v } of Array.from(agg.values())) {
    const gst = gstBreakdown(subEx);
    if (!vendorAllowsRazorpayCheckout(v)) {
      return {
        ok: false,
        error:
          "One or more suppliers in your cart has not enabled online checkout. Remove those items or ask the supplier to add Razorpay link / card / UPI / net banking.",
      };
    }
    if (v.minOrderForRTGS != null && gst.total >= v.minOrderForRTGS && !hasMethod(v, "NEFT_RTGS")) {
      return {
        ok: false,
        error: `Your cart exceeds a supplier's NEFT/RTGS threshold (≥ ₹${v.minOrderForRTGS.toLocaleString("en-IN")}) without that method enabled.`,
      };
    }
  }
  return { ok: true };
}
