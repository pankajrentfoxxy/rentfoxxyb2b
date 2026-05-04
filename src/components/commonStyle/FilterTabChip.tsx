"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Matches CommonTable toolbar chips (amber border / fill). */
const brandActive =
  "rounded-md border border-transparent bg-amber-600 text-white shadow-sm";
const brandInactive =
  "rounded-md border border-slate-200 bg-white text-slate-500 hover:border-amber-300";

/** Full pills using theme primary (e.g. page-level tab rails). */
const primaryActive = "rounded-full bg-primary text-white";
const primaryInactive = "rounded-full bg-slate-100 text-slate-800";

export type FilterTabChipVariant = "brand" | "primary";

export interface FilterTabChipProps {
  active: boolean;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: FilterTabChipVariant;
  className?: string;
}

/**
 * Generic tab / filter chip: renders `Link` when `href` is set, otherwise a `button`.
 */
export function FilterTabChip({
  active,
  children,
  href,
  onClick,
  variant = "brand",
  className,
}: FilterTabChipProps) {
  const base =
    "inline-flex items-center justify-center px-3 py-1.5 whitespace-nowrap transition-all";

  const variantClasses =
    variant === "primary"
      ? cn("text-sm font-medium", active ? primaryActive : primaryInactive)
      : cn(
          "border text-[11px] font-bold",
          active ? brandActive : brandInactive,
        );

  const merged = cn(base, variantClasses, className);

  if (href) {
    return (
      <Link href={href} className={merged}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={merged} onClick={onClick}>
      {children}
    </button>
  );
}
