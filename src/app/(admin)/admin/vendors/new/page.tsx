import { AdminNewVendorForm } from "@/components/admin/AdminNewVendorForm";
import Link from "next/link";

export default function AdminNewVendorPage() {
  return (
    <div className="space-y-4">
      <Link href="/admin/vendors" className="text-sm text-accent hover:underline">
        ← Vendors
      </Link>
      <AdminNewVendorForm />
    </div>
  );
}
