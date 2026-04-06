"use client";

export function RazorpayTestBanner() {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  if (!key.startsWith("rzp_test_")) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-amber-400 bg-amber-100 px-4 py-2 text-sm text-amber-950"
    >
      <strong>Test mode.</strong> Use card 4111 1111 1111 1111, any future expiry, any CVV — or UPI{" "}
      <code className="rounded bg-amber-200/80 px-1">success@razorpay</code>.
    </div>
  );
}
