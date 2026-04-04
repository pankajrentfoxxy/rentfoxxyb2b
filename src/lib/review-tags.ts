export const CUSTOMER_REVIEW_TAGS_HIGH = [
  "Exactly as described",
  "Great packaging",
  "Fast delivery",
  "Great value",
  "Would reorder",
] as const;

export const CUSTOMER_REVIEW_TAGS_LOW = [
  "Not as described",
  "Poor packaging",
  "Slow delivery",
  "Poor value",
  "Damaged item",
] as const;

export const VENDOR_REVIEW_TAGS = [
  "Paid on time",
  "Clear communication",
  "Legitimate bulk buyer",
  "Requested unreasonable terms",
  "Delayed payment",
  "Good repeat customer",
  "First-time buyer — smooth transaction",
] as const;

export function normalizeCustomerReviewTags(rating: number, tags: string[]) {
  const allowed = new Set<string>([
    ...(rating >= 4 ? CUSTOMER_REVIEW_TAGS_HIGH : CUSTOMER_REVIEW_TAGS_LOW),
  ]);
  return tags.filter((t) => allowed.has(t)).slice(0, 6);
}

export function normalizeVendorReviewTags(tags: string[]) {
  const allowed = new Set<string>([...VENDOR_REVIEW_TAGS]);
  return tags.filter((t) => allowed.has(t)).slice(0, 6);
}
