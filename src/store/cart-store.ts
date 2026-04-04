import type { CartLine } from "@/types/cart";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartState = {
  items: CartLine[];
  addItem: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  removeItem: (listingId: string) => void;
  updateQty: (listingId: string, quantity: number) => void;
  clear: () => void;
  replaceAll: (items: CartLine[]) => void;
  itemCount: () => number;
  subtotal: () => number;
};

function normalizeLine(
  line: Omit<CartLine, "quantity"> & { quantity?: number },
): CartLine {
  const qty = line.quantity ?? line.minOrderQty;
  const clamped = Math.min(
    Math.max(qty, line.minOrderQty),
    Math.max(line.minOrderQty, line.maxQty),
  );
  return { ...line, quantity: clamped };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (line) => {
        const normalized = normalizeLine(line);
        set((s) => {
          const existing = s.items.find((i) => i.listingId === normalized.listingId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.listingId === normalized.listingId
                  ? normalizeLine({ ...i, quantity: i.quantity + normalized.quantity })
                  : i,
              ),
            };
          }
          return { items: [...s.items, normalized] };
        });
      },
      removeItem: (listingId) =>
        set((s) => ({ items: s.items.filter((i) => i.listingId !== listingId) })),
      updateQty: (listingId, quantity) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.listingId !== listingId) return i;
            return normalizeLine({ ...i, quantity });
          }),
        })),
      clear: () => set({ items: [] }),
      replaceAll: (items) =>
        set({
          items: items.map((i) => normalizeLine(i)),
        }),
      itemCount: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.unitPrice * i.quantity, 0),
    }),
    { name: "rentfoxxy-cart" },
  ),
);
