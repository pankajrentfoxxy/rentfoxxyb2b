import type { ProductCondition } from "@prisma/client";

const CONDITIONS: ProductCondition[] = [
  "BRAND_NEW",
  "REFURB_A_PLUS",
  "REFURB_A",
  "REFURB_B",
  "REFURB_C",
];

export function parseProductCondition(v: unknown): ProductCondition | null {
  if (typeof v !== "string") return null;
  return CONDITIONS.includes(v as ProductCondition) ? (v as ProductCondition) : null;
}

export function validateListingConditionFields(input: {
  condition: ProductCondition;
  batteryHealth: number | null | undefined;
  warrantyMonths: number | undefined;
  warrantyType: string | null | undefined;
  conditionNotes: string | null | undefined;
  refurbImages: string[] | undefined;
  unitPrice: number;
  minBidPrice: number;
}): string | null {
  if (input.condition === "BRAND_NEW") {
    return null;
  }
  const bh = input.batteryHealth;
  if (bh == null || Number.isNaN(bh) || bh < 50 || bh > 100) {
    return "Battery health (50–100%) is required for refurbished listings";
  }
  const wm = input.warrantyMonths ?? 0;
  if (wm < 0 || wm > 24) {
    return "Warranty duration must be between 0 and 24 months";
  }
  const wt = input.warrantyType?.trim();
  if (!wt) {
    return "Warranty type is required for refurbished listings";
  }
  const allowedWt = ["Rentfoxxy-backed", "Manufacturer", "As-Is"];
  if (!allowedWt.includes(wt)) {
    return "Invalid warranty type";
  }
  const notes = (input.conditionNotes ?? "").trim();
  if (notes.length > 200) {
    return "Condition notes must be 200 characters or less";
  }
  const imgs = input.refurbImages ?? [];
  if (imgs.length > 3) {
    return "At most 3 refurbished images";
  }
  if (input.condition === "REFURB_C") {
    const maxMinBid = input.unitPrice * 0.85 + 1e-6;
    if (input.minBidPrice > maxMinBid) {
      return "Grade C listings need minimum bid at least 15% below your list price";
    }
  }
  return null;
}

export function defaultRefurbFieldsForBrandNew() {
  return {
    batteryHealth: null,
    conditionNotes: null,
    warrantyMonths: 0,
    warrantyType: null,
    refurbImages: [],
    requiresAdminApproval: false,
  };
}
