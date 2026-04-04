"use client";

import type { CartLine } from "@/types/cart";
import { useCartStore } from "@/store/cart-store";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

function mergeCarts(local: CartLine[], remote: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of remote) {
    map.set(line.listingId, { ...line });
  }
  for (const line of local) {
    const ex = map.get(line.listingId);
    if (ex) {
      const sum = ex.quantity + line.quantity;
      const qty = Math.min(Math.max(sum, ex.minOrderQty), ex.maxQty);
      map.set(line.listingId, { ...ex, quantity: qty });
    } else {
      map.set(line.listingId, { ...line });
    }
  }
  return Array.from(map.values());
}

export function CartSync() {
  const { data: session, status } = useSession();
  const replaceAll = useCartStore((s) => s.replaceAll);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      lastUserId.current = null;
      return;
    }
    if (status !== "authenticated" || session.user.role !== "CUSTOMER") {
      return;
    }

    const userId = session.user.id;
    if (lastUserId.current === userId) return;
    lastUserId.current = userId;

    (async () => {
      const res = await fetch("/api/customer/cart");
      if (!res.ok) return;
      const data = (await res.json()) as { items?: CartLine[] };
      const remote = data.items ?? [];
      const local = useCartStore.getState().items;
      if (local.length === 0 && remote.length === 0) return;

      const merged = mergeCarts(local, remote);
      replaceAll(merged);

      const remoteNorm = JSON.stringify(remote);
      const mergedNorm = JSON.stringify(merged);
      if (mergedNorm !== remoteNorm) {
        await fetch("/api/customer/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: merged }),
        });
      }
    })();
  }, [status, session?.user?.id, session?.user?.role, replaceAll]);

  return null;
}
