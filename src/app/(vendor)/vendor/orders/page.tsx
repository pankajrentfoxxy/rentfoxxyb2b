import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import VendorOrderListClient, { type VendorOrderRow } from "./VendorOrderListClient";

export default async function VendorOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) redirect("/auth/login");

  const orders = await prisma.order.findMany({
    where: { items: { some: { listing: { vendorId: vendor.id } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: { include: { listing: { include: { product: { select: { name: true } } } } } },
    },
  });

  type OrderRow = (typeof orders)[number];
  const initialData: VendorOrderRow[] = orders.map((o: OrderRow) => {
    const mine = o.items.filter((i: OrderRow["items"][number]) => i.listing.vendorId === vendor.id);
    const sub = mine.reduce((s: number, i: OrderRow["items"][number]) => s + i.subtotal, 0);
    const linesLabel = mine.map((i: OrderRow["items"][number]) => `${i.listing.product.name} ×${i.quantity}`).join("; ");
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      linesLabel,
      totalDisplay: `₹${sub.toLocaleString("en-IN")}`,
      statusRaw: o.status,
      statusDisplay: o.status.replace(/_/g, " "),
      dateDisplay: new Date(o.createdAt).toLocaleString("en-IN"),
    };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <VendorOrderListClient initialData={initialData} />
    </div>
  );
}
