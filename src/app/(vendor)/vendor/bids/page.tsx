import { PageHeader } from "@/components/shared/PageHeader";
import { VendorBidInbox } from "@/components/vendor/VendorBidInbox";

export default function VendorBidsPage() {
  return (
    <div className="w-full space-y-2">
      <PageHeader
        title="Bid Inbox"
        subtitle={undefined}
      />
      <VendorBidInbox />
    </div>
  );
}
