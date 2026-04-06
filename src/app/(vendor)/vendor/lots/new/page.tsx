import { VendorLotWizard } from "@/components/vendor/VendorLotWizard";

export default function VendorNewLotPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">New lot listing</h1>
      <p className="mt-1 text-sm text-muted">Upload CSV → AI clean → submit for verification</p>
      <div className="mt-8">
        <VendorLotWizard />
      </div>
    </div>
  );
}
