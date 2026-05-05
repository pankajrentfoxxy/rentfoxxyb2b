import { CustomerProfileClient } from "@/components/customer/CustomerProfileClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function CustomerProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { customerProfile: true, addresses: { orderBy: [{ isDefault: "desc" }, { label: "asc" }] } },
  });
  if (!user?.customerProfile) redirect("/auth/login");

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-6 px-2">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
        </div>
      }
    >
      <CustomerProfileClient
        initialUser={{ name: user.name, email: user.email, phone: user.phone }}
        initialCompanyName={user.customerProfile.companyName}
        initialGstin={user.customerProfile.gstin}
        initialAddresses={user.addresses}
      />
    </Suspense>
  );
}
