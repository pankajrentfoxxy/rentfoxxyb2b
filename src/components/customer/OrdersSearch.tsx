"use client";

import type { OrderFilterTab } from "@/lib/customer-order-filters";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function OrdersSearch({ tab, initialQ }: { tab: OrderFilterTab; initialQ: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQ);

  const apply = useCallback(() => {
    const sp = new URLSearchParams(params?.toString());
    sp.set("tab", tab);
    if (q.trim()) sp.set("q", q.trim());
    else sp.delete("q");
    router.push(`/customer/orders?${sp.toString()}`);
  }, [router, params, tab, q]);

  return (
    <div className="flex max-w-md gap-2">
      <input
        type="search"
        placeholder="Search by order number"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && apply()}
        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={apply}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
      >
        Search
      </button>
    </div>
  );
}
