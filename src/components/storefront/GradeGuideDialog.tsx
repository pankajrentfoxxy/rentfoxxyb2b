"use client";

import { GRADE_CONFIG, GRADE_ORDER } from "@/constants/grading";
import * as Dialog from "@radix-ui/react-dialog";
import type { ProductCondition } from "@prisma/client";
import { X } from "lucide-react";

export function GradeGuideDialog({ triggerLabel }: { triggerLabel?: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="text-sm font-medium text-accent hover:underline">
          {triggerLabel ?? "What do these grades mean?"}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(100%,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-bold text-slate-900">Rentfoxxy condition grades</Dialog.Title>
            <Dialog.Close
              className="rounded p-1 text-muted hover:bg-surface"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Official definitions for product condition grades on Rentfoxxy.
          </Dialog.Description>
          <div className="mt-4 space-y-3 text-sm">
            {GRADE_ORDER.map((key) => {
              const g = GRADE_CONFIG[key as ProductCondition];
              return (
                <div
                  key={key}
                  className="rounded-lg border border-slate-100 bg-surface px-3 py-2"
                  style={{ borderLeftWidth: 4, borderLeftColor: g.color }}
                >
                  <p className="font-semibold text-slate-900">
                    <span className="mr-1">{g.dot}</span>
                    {g.label}
                  </p>
                  <p className="mt-1 text-muted">{g.description}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted">
            Grade C may be sold as-is with shorter warranty. Vendors certify listings match these standards.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
