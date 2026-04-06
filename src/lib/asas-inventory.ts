/** Sum of AsAs line-item counts (authoritative when rows exist). */
export function asasInventoryFromItems(items: { count: number }[]): number {
  return items.reduce((s, i) => s + Math.max(0, Math.floor(Number(i.count) || 0)), 0);
}

/**
 * Inventory cap for availability / sold-out. Prefer summed line items when non-zero;
 * otherwise `totalUnits` on the listing (legacy or empty manifest in DB).
 */
export function asasInventoryCap(
  listing: { totalUnits: number },
  items?: { count: number }[],
): number {
  const fromItems = items?.length ? asasInventoryFromItems(items) : 0;
  if (fromItems > 0) return fromItems;
  return Math.max(0, Math.floor(Number(listing.totalUnits) || 0));
}

export function asasUnitsAvailable(
  listing: { totalUnits: number; unitsSold: number },
  items?: { count: number }[],
): number {
  const cap = asasInventoryCap(listing, items);
  const sold = Math.max(0, Math.floor(Number(listing.unitsSold) || 0));
  return Math.max(0, cap - sold);
}
