"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { AdminOrdersFilterInitial } from "@/components/admin/AdminOrdersFilter";
import { AdminOrdersFilter } from "@/components/admin/AdminOrdersFilter";
import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";
import { useState } from "react";

export function AdminOrdersFilterDrawer({
  vendors,
  initial,
}: {
  vendors: { id: string; companyName: string }[];
  initial: AdminOrdersFilterInitial;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all",
            "hover:border-amber-300 hover:text-amber-700",
            "focus:outline-none focus:ring-1 focus:ring-amber-500",
          )}
          aria-label="Open filters"
        >
          <Filter className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] transition-opacity data-[state=open]:opacity-100 data-[state=closed]:opacity-0" />
        <Dialog.Content
          className={cn(
            "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl outline-none",
            "translate-x-full transition-transform duration-300 ease-out data-[state=open]:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <Dialog.Title className="text-sm font-black uppercase tracking-wide text-slate-900">
              Filter orders
            </Dialog.Title>
            <Dialog.Close
              type="button"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Narrow orders by vendor, status, dates, amount, or bid-only.
          </Dialog.Description>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <AdminOrdersFilter
              vendors={vendors}
              initial={initial}
              variant="drawer"
              onApplied={() => setOpen(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
