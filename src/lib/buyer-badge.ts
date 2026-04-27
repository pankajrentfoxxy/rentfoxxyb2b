import { prisma } from "@/lib/prisma";

export type BuyerTier = "GOLD" | "SILVER" | "BRONZE" | "NEW";

export interface BuyerBadge {
  tier: BuyerTier;
  label: string;
  icon: string;
  description: string;
  lifetimeSpend: number;
  completedOrders: number;
}

const DONE_STATUSES = [
  "DELIVERED",
  "DELIVERY_CONFIRMED",
  "PAYOUT_PENDING",
  "PAYOUT_RELEASED",
] as const;

/** Addendum v1.9 P4 */
export async function getBuyerBadge(customerId: string): Promise<BuyerBadge> {
  const orders = await prisma.order.findMany({
    where: {
      customerId,
      status: { in: [...DONE_STATUSES] },
    },
    select: { totalAmount: true },
  });
  const completedOrders = orders.length;
  const lifetimeSpend = orders.reduce((s, o) => s + o.totalAmount, 0);

  if (lifetimeSpend >= 2_000_000 && completedOrders >= 10) {
    return {
      tier: "GOLD",
      label: "Gold Buyer",
      icon: "🏆",
      description: "₹20L+ lifetime · 10+ orders",
      lifetimeSpend,
      completedOrders,
    };
  }
  if (lifetimeSpend >= 500_000 && completedOrders >= 3) {
    return {
      tier: "SILVER",
      label: "Verified Bulk Buyer",
      icon: "💼",
      description: "₹5L+ lifetime · 3+ orders",
      lifetimeSpend,
      completedOrders,
    };
  }
  if (lifetimeSpend >= 100_000 && completedOrders >= 1) {
    return {
      tier: "BRONZE",
      label: "Active Buyer",
      icon: "⭐",
      description: "₹1L+ lifetime",
      lifetimeSpend,
      completedOrders,
    };
  }
  return {
    tier: "NEW",
    label: "New Buyer",
    icon: "🆕",
    description: "Building track record",
    lifetimeSpend,
    completedOrders,
  };
}

export function tierRank(t: BuyerTier): number {
  return { GOLD: 3, SILVER: 2, BRONZE: 1, NEW: 0 }[t];
}

export function getNextTierMessage(badge: BuyerBadge): string {
  if (badge.tier === "NEW") {
    return "Place 1 order worth ₹1L+ to become an Active Buyer.";
  }
  if (badge.tier === "BRONZE") {
    const need = Math.max(0, 500_000 - badge.lifetimeSpend);
    return `₹${(need / 100_000).toFixed(1)}L more spend (and 3+ completed orders) for Verified Bulk Buyer.`;
  }
  if (badge.tier === "SILVER") {
    const need = Math.max(0, 2_000_000 - badge.lifetimeSpend);
    return `₹${(need / 100_000).toFixed(1)}L more spend (and 10+ orders) for Gold Buyer.`;
  }
  return "";
}
