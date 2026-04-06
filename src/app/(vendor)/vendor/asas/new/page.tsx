import { VendorAsAsWizard } from "@/components/vendor/VendorAsAsWizard";

export default function VendorNewAsAsPage({
  searchParams,
}: {
  searchParams: { done?: string };
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">New AsAs listing</h1>
      <p className="mt-1 text-sm text-muted">Mixed fleet · AI name · verification before live</p>
      {searchParams.done === "1" ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          AsAs submitted for verification.
        </div>
      ) : null}
      <div className="mt-8">
        <VendorAsAsWizard />
      </div>
    </div>
  );
}
