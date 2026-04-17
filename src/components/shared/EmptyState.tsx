import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface text-ink-hint">
        <Icon className="h-8 w-8" aria-hidden />
      </div>
      <h2 className="mb-2 text-[15px] font-medium text-ink-primary">{title}</h2>
      {description ? (
        <p className="mb-5 max-w-sm text-[13px] leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {cta ? (
        <Link
          href={cta.href}
          className="rounded-lg bg-navy px-5 py-2.5 text-[12px] text-white transition-colors hover:bg-navy-light"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
