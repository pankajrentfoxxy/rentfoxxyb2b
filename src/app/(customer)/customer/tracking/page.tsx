import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CustomerTrackingIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const orders = await prisma.order.findMany({
    where: {
      customerId: profile.id,
      status: { not: "PAYMENT_PENDING" },
    },
    orderBy: { createdAt: "desc" },
    include: { shipment: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tracking</h1>
        <p className="mt-1 text-sm text-muted">Select an order to view shipment progress.</p>
      </div>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {orders.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted">No orders to track.</li>
        ) : (
          orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-4">
              <div>
                <p className="font-mono font-medium text-slate-900">{o.orderNumber}</p>
                <p className="text-xs text-muted">
                  {o.shipment ? "Shipment recorded" : "Dispatch pending"} ·{" "}
                  {o.status.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>
              <Link
                href={`/customer/tracking/${o.id}`}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-light"
              >
                Track
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
