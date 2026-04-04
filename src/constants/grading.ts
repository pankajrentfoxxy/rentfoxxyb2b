import type { ProductCondition } from "@prisma/client";

export const GRADE_CONFIG: Record<
  ProductCondition,
  { label: string; color: string; dot: string; description: string }
> = {
  BRAND_NEW: {
    label: "Brand New",
    color: "#15803D",
    dot: "🟢",
    description: "Factory sealed, original packaging, never used",
  },
  REFURB_A_PLUS: {
    label: "Refurb A+",
    color: "#2563EB",
    dot: "🔵",
    description: "Open-box/lightly used (<3mo). Spotless, ≥90% battery.",
  },
  REFURB_A: {
    label: "Refurb A",
    color: "#7C3AED",
    dot: "🟣",
    description: "Lightly used (3–12mo). Minor hairlines only, ≥80% battery.",
  },
  REFURB_B: {
    label: "Refurb B",
    color: "#D97706",
    dot: "🟡",
    description: "Used 1–3yr. Visible light scratches, no dents, ≥70% battery.",
  },
  REFURB_C: {
    label: "Refurb C",
    color: "#DC2626",
    dot: "🟠",
    description: "Heavy use 3+yr. Cosmetically worn, functional. ≥60% battery.",
  },
};

/** Sort: Brand New first, then A+ → A → B → C, then price */
export const CONDITION_SORT_RANK: Record<ProductCondition, number> = {
  BRAND_NEW: 0,
  REFURB_A_PLUS: 1,
  REFURB_A: 2,
  REFURB_B: 3,
  REFURB_C: 4,
};

export const GRADE_ORDER: ProductCondition[] = [
  "BRAND_NEW",
  "REFURB_A_PLUS",
  "REFURB_A",
  "REFURB_B",
  "REFURB_C",
];

export function parseConditionFilters(raw: string | null): ProductCondition[] {
  if (!raw?.trim()) return [];
  const allowed = new Set<string>(GRADE_ORDER);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ProductCondition => allowed.has(s));
}
