import { orderTimelineSteps } from "@/lib/customer-order-filters";
import type { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  const steps = orderTimelineSteps(status);
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-0">
      {steps.map((s, i) => (
        <div key={s.title} className="flex items-center">
          {i > 0 ? (
            <div
              className={cn(
                "mx-1 hidden h-0.5 w-6 md:block",
                steps[i - 1]?.done ? "bg-accent" : "bg-slate-200",
              )}
            />
          ) : null}
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
              s.done
                ? "border-accent bg-accent-light text-accent"
                : "border-slate-200 bg-white text-muted",
            )}
          >
            {s.done ? <Check className="h-3.5 w-3.5" /> : null}
            {s.title}
          </div>
        </div>
      ))}
    </div>
  );
}
