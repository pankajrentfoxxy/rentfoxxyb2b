"use client";

import { orderTimelineSteps } from "@/lib/customer-order-filters";
import type { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const steps = orderTimelineSteps(status);
  const activeIndex = steps.findIndex((s) => !s.done);

  return (
    <div className="relative flex flex-col">
      <div className="absolute bottom-0 left-[19px] top-10 w-px bg-border" aria-hidden />
      {steps.map((s, i) => {
        const isDone = s.done;
        const isActive = activeIndex >= 0 && i === activeIndex && !isDone;
        const isFuture = !isDone && !isActive;
        return (
          <div key={`${s.title}-${i}`} className="relative flex items-start gap-4 pb-6 last:pb-0">
            <div
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                isDone && "bg-verified text-white",
                isActive && "bg-navy text-white ring-4 ring-navy/20",
                isFuture && "border-2 border-border bg-surface text-ink-hint",
              )}
            >
                           {isDone ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : isActive ? (
                <span className="text-[11px] font-semibold">{i + 1}</span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p
                className={cn(
                  "text-[13px] font-medium",
                  isActive ? "text-ink-primary" : isDone ? "text-ink-primary" : "text-ink-muted",
                )}
              >
                {s.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
