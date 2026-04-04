import { VendorListingEditor } from "@/components/vendor/VendorListingEditor";

export default function NewVendorListingPage() {
  return (
    <div className="mx-auto max-w-xl py-4 md:py-8">
      <VendorListingEditor mode="create" />
    </div>
  );
}
