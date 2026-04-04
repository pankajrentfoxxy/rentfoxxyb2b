import { AdminReportsClient } from "@/components/admin/AdminReportsClient";

export default function AdminReportsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-muted">Sales, vendors, bids, and customers — export ready.</p>
      </div>
      <AdminReportsClient />
    </div>
  );
}
