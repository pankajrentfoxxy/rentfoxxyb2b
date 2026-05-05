import { auth } from "@/lib/auth";
import { orderMatchesFilter, type OrderFilterTab } from "@/lib/customer-order-filters";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CustomerOrdersListClient, { type CustomerOrderRow } from "./CustomerOrdersListClient";

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const sp = await searchParams;
  const tab = (sp.tab ?? "all") as OrderFilterTab;

  const orders = await prisma.order.findMany({
    where: { customerId: profile.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const rows: CustomerOrderRow[] = orders
    .filter((o: (typeof orders)[number]) => orderMatchesFilter(o.status, tab))
    .map((o: (typeof orders)[number]) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt.toISOString(),
      itemCount: o.items.length,
      totalAmount: o.totalAmount,
      status: o.status,
    }));

  return (
    <div className="mx-auto max-w-7xl">
      <CustomerOrdersListClient initialData={rows} tab={tab} />
    </div>
  );
}
