export function VerifiedBadge({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded bg-verified font-medium text-white ${cls}`}
    >
      <span className="text-[9px]">✓</span> Verified
    </span>
  );
}
