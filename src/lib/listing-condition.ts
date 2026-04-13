import type { ProductCondition } from "@prisma/client";

const CONDITIONS: ProductCondition[] = [
  "BRAND_NEW",
  "REFURB_A_PLUS",
  "REFURB_A",
  "REFURB_B",
  "REFURB_C",
  "REFURB_D",
];

export function parseProductCondition(v: unknown): ProductCondition | null {
  if (typeof v !== "string") return null;
  return CONDITIONS.includes(v as ProductCondition) ? (v as ProductCondition) : null;
}

export function validateListingConditionFields(input: {
  condition: ProductCondition;
  conditionNotes: string | null | undefined;
  refurbImages: string[] | undefined;
  unitPrice: number;
  minBidPrice: number;
}): string | null {
  const notes = (input.conditionNotes ?? "").trim();
  if (notes.length > 200) {
    return "Condition notes must be 200 characters or less";
  }
  const imgs = input.refurbImages ?? [];
  if (imgs.length > 3) {
    return "At most 3 refurbished images";
  }
  if (input.condition === "REFURB_C" || input.condition === "REFURB_D") {
    const maxMinBid = input.unitPrice * 0.85 + 1e-6;
    if (input.minBidPrice > maxMinBid) {
      return "Grade C/D listings need minimum bid at least 15% below your list price";
    }
  }
  return null;
}

export function defaultRefurbFieldsForBrandNew() {
  return {
    conditionNotes: null,
    refurbImages: [],
    requiresAdminApproval: false,
  };
}
