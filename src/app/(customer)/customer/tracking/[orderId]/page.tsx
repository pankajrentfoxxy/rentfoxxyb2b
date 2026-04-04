import { auth } from "@/lib/auth";
import { getCustomerOrderTracking } from "@/lib/order-tracking";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type TimelineEvent = { at: string; label: string; detail: string; location?: string };

export default async function CustomerTrackingDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) notFound();

  const order = await prisma.order.findFirst({
    where: { id: params.orderId, customerId: profile.id },
    select: { id: true, orderNumber: true },
  });
  if (!order) notFound();

  const tracking = await getCustomerOrderTracking(order.id, profile.id);
  if (!tracking) notFound();

  const events: TimelineEvent[] = tracking.events.map((e) => ({
    at: e.date,
    label: e.status,
    detail: e.description,
    location: e.location,
  }));

  const est = tracking.estimatedDelivery ? new Date(tracking.estimatedDelivery) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <nav className="text-sm text-muted">
        <Link href="/customer/tracking" className="text-accent hover:underline">
          Tracking
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{order.orderNumber}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shipment status</h1>
        <p className="mt-1 text-sm text-muted">
          {tracking.carrier}
          {tracking.currentStatus ? ` — ${tracking.currentStatus}` : ""}
        </p>
        {tracking.awb ? (
          <p className="mt-2 text-sm">
            Tracking reference: <span className="font-mono font-medium">{tracking.awb}</span>
          </p>
        ) : null}
        {est ? (
          <p className="mt-1 text-xs text-muted">
            Estimated delivery (indicative): {est.toLocaleDateString("en-IN")}
          </p>
        ) : null}
        {tracking.trackingUrl ? (
          <a
            href={tracking.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            Track on carrier website
          </a>
        ) : null}
      </div>

      <ol className="relative space-y-6 border-l-2 border-slate-200 pl-6">
        {events.map((ev, i) => (
          <li key={`${ev.at}-${i}`} className={i === 0 ? "font-medium" : ""}>
            <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-accent" />
            <p className="text-sm text-slate-900">{ev.label}</p>
            <p className="text-xs text-muted">{new Date(ev.at).toLocaleString("en-IN")}</p>
            {ev.detail ? <p className="mt-1 text-sm text-slate-700">{ev.detail}</p> : null}
            {ev.location ? <p className="text-xs text-muted">{ev.location}</p> : null}
          </li>
        ))}
      </ol>

      <Link href={`/customer/orders/${order.id}`} className="text-sm font-medium text-accent hover:underline">
        ← Order details
      </Link>
    </div>
  );
}
