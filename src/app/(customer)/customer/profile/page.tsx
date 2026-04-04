import { CustomerProfileClient } from "@/components/customer/CustomerProfileClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CustomerProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { customerProfile: true, addresses: { orderBy: [{ isDefault: "desc" }, { label: "asc" }] } },
  });
  if (!user?.customerProfile) redirect("/auth/login");

  return (
    <CustomerProfileClient
      initialUser={{ name: user.name, email: user.email, phone: user.phone }}
      initialCompanyName={user.customerProfile.companyName}
      initialGstin={user.customerProfile.gstin}
      initialAddresses={user.addresses}
    />
  );
}
