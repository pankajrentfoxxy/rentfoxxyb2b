import type { ListingType, ProductCondition } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createVerificationTask(input: {
  listingType: ListingType;
  listingId: string;
  vendorId: string;
}) {
  return prisma.verificationTask.create({
    data: {
      listingType: input.listingType,
      listingId: input.listingId,
      vendorId: input.vendorId,
      status: "PENDING_ASSIGNMENT",
    },
  });
}

export function productListingNeedsVerification(condition: ProductCondition): boolean {
  return condition !== "BRAND_NEW";
}
