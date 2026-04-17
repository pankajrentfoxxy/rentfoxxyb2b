import type { ReactNode } from "react";

interface Props {
  color?: "amber" | "lot" | "asas" | "verified";
  children: ReactNode;
}

export function SectionLabel({ color = "amber", children }: Props) {
  const colors = {
    amber: "text-amber-dark bg-amber-bg border-amber-border",
    lot: "text-lot-text bg-lot-bg border-lot-border",
    asas: "text-asas-text bg-asas-bg border-asas-border",
    verified: "text-verified-text bg-verified-bg border-verified-border",
  };
  return (
    <span
      className={`inline-block rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${colors[color]}`}
    >
      {children}
    </span>
  );
}
