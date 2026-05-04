import { prisma } from "@/lib/prisma";
import CustomerListClient, { CustomerData } from "./CustomerListClient";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.customerProfile.findMany({
    orderBy: { user: { createdAt: "desc" } },
    include: {
      user: { select: { email: true, name: true, createdAt: true } },
      orders: { select: { totalAmount: true } },
    },
  });

  const initialData: CustomerData[] = customers.map((c) => ({
    id: c.id,
    name: c.user.name,
    email: c.user.email,
    companyName: c.companyName,
    orderCount: c.orders.length,
    totalSpend: c.orders.reduce((s, o) => s + o.totalAmount, 0),
    joinedDisplay: c.user.createdAt.toLocaleDateString("en-IN"),
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <CustomerListClient initialData={initialData} />
    </div>
  );
}
