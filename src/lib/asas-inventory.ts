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

/** Units sold from confirmed AsAs purchases (authoritative vs stale `listing.unitsSold`). */
export function asasUnitsSoldFromPurchases(purchases: { quantity: number; status: string }[]): number {
  return purchases
    .filter((p) => p.status !== "PENDING_PAYMENT")
    .reduce((s, p) => s + Math.max(0, Math.floor(Number(p.quantity) || 0)), 0);
}

export function asasUnitsAvailableFromPurchases(
  listing: { totalUnits: number },
  items: { count: number }[] | undefined,
  purchases: { quantity: number; status: string }[],
): number {
  const cap = asasInventoryCap(listing, items);
  const sold = asasUnitsSoldFromPurchases(purchases);
  return Math.max(0, cap - sold);
}

export function asasPublicLotProgress(
  listing: {
    totalUnits: number;
    allowMultiBuyer: boolean;
    aiSuggestedLots: number | null;
  },
  cap: number,
  unitsSold: number,
) {
  const isLotMode = listing.allowMultiBuyer && !!listing.aiSuggestedLots && listing.aiSuggestedLots > 0;
  const totalLots = isLotMode ? listing.aiSuggestedLots! : null;
  const lotSize =
    isLotMode && totalLots && totalLots > 0 ? Math.max(1, Math.round(cap / totalLots)) : null;
  const lotsSold =
    lotSize && totalLots != null ? Math.min(totalLots, Math.floor(unitsSold / lotSize)) : null;
  const lotsRemaining =
    totalLots != null && lotsSold != null ? Math.max(0, totalLots - lotsSold) : null;
  const percentSold =
    totalLots != null && totalLots > 0 && lotsSold != null
      ? Math.round((lotsSold / totalLots) * 100)
      : cap > 0
        ? Math.min(100, Math.round((unitsSold / cap) * 100))
        : 0;
  return {
    isLotMode,
    totalLots,
    lotSize,
    lotsSold,
    lotsRemaining,
    percentSold,
  };
}

export function asasUnitsAvailable(
  listing: { totalUnits: number; unitsSold: number },
  items?: { count: number }[],
): number {
  const cap = asasInventoryCap(listing, items);
  const sold = Math.max(0, Math.floor(Number(listing.unitsSold) || 0));
  return Math.max(0, cap - sold);
}
