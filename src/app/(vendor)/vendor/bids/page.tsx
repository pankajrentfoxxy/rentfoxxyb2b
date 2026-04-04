import { VendorBidInbox } from "@/components/vendor/VendorBidInbox";

export default function VendorBidsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bid inbox</h1>
        <p className="mt-1 text-sm text-muted">
          Approve winning prices, send counter-offers, or decline. Buyers are notified instantly.
        </p>
      </div>
      <VendorBidInbox />
    </div>
  );
}
