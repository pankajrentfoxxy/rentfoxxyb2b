import { VendorAppShell } from "@/components/vendor/VendorAppShell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vendorHasReducePriceAlert } from "@/lib/vendor-pricing-alert";
import { redirect } from "next/navigation";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "VENDOR") {
    redirect(session.user.role === "CUSTOMER" ? "/customer/dashboard" : "/");
  }
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!vendor) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-slate-900">Vendor profile missing</h1>
        <p className="mt-2 text-muted">
          Run <code className="rounded bg-surface px-1">npm run db:migrate</code> and{" "}
          <code className="rounded bg-surface px-1">npm run db:seed</code>, then sign in as a vendor.
        </p>
      </div>
    );
  }
  const marketIntelAlert = await vendorHasReducePriceAlert(vendor.id);
  return (
    <VendorAppShell
      email={session.user.email}
      role={session.user.role}
      marketIntelAlert={marketIntelAlert}
    >
      {children}
    </VendorAppShell>
  );
}
