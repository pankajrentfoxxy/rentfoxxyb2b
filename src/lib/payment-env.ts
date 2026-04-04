/**
 * Razorpay: set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (dashboard test mode keys).
 * Expose RAZORPAY_KEY_ID to the browser as NEXT_PUBLIC_RAZORPAY_KEY_ID for Checkout.
 *
 * Instant "pay without Razorpay" is disabled by default. For local demos without keys:
 *   PAYMENT_DEV_BYPASS=true
 */
export function isRazorpayConfigured(): boolean {
  return !!(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_ID.length > 0 &&
    process.env.RAZORPAY_KEY_SECRET.length > 0
  );
}

export function allowInstantPaymentBypass(): boolean {
  return process.env.PAYMENT_DEV_BYPASS === "true";
}

export function getRazorpayKeyForClient(): string | undefined {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || undefined;
}
