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
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-accent">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {cta ? (
        <Link
          href={cta.href}
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-light"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
