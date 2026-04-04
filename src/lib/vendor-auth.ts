import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { VendorStatus } from "@prisma/client";

export type VendorContext = {
  userId: string;
  vendorId: string;
  vendor: { id: string; companyName: string; status: VendorStatus };
};

export async function getVendorContext(): Promise<VendorContext | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "VENDOR") return null;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, companyName: true, status: true },
  });
  if (!vendor) return null;
  return { userId: session.user.id, vendorId: vendor.id, vendor };
}
