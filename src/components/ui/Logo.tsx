import { cn } from "@/lib/utils";

const ICON_SIZES = { sm: 24, md: 32, lg: 48, xl: 64 } as const;

export type LogoSize = keyof typeof ICON_SIZES;
export type LogoVariant = "dark" | "light" | "icon-only" | "nav" | "nav-on-light";

type LogoProps = {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  "aria-label"?: string;
};

const NAVY = "#0F2D5E";
const ACCENT = "#2563EB";
const AMBER = "#F59E0B";
const NAVY_ON_DARK = "#F8FAFC";
const SNUZZLE_ON_DARK = "#CBD5F5";

/** Addendum v1.7 — hex outline amber, amber center disc (navbar). */
function HexNavMark({ px }: { px: number }) {
  const vb = 40;
  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${vb} ${vb}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <polygon
        points="20,3 35.5,12 35.5,28 20,37 4.5,28 4.5,12"
        stroke={AMBER}
        strokeWidth="2"
        fill="none"
      />
      <circle cx="20" cy="20" r="8" fill={AMBER} />
    </svg>
  );
}

function FoxIcon({ px, onDark }: { px: number; onDark?: boolean }) {
  const body = onDark ? NAVY_ON_DARK : NAVY;
  const snuzzle = onDark ? SNUZZLE_ON_DARK : "#1B3A6B";
  const pupil = onDark ? NAVY : NAVY;
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M12 6L18 20L8 22L6 10L12 6Z" fill={ACCENT} />
      <path d="M36 6L30 20L40 22L42 10L36 6Z" fill={body} />
      <path d="M24 14C16 14 10 22 10 30C10 36 14 40 20 42H28C34 40 38 36 38 30C38 22 32 14 24 14Z" fill={body} />
      <path d="M38 28C40 26 44 27 44 31C42 35 38 34 36 32L38 28Z" fill={AMBER} />
      <path d="M24 32L20 38H28L24 32Z" fill={snuzzle} />
      <circle cx="18" cy="26" r="2" fill={onDark ? "#0F172A" : "white"} />
      <circle cx="30" cy="26" r="2" fill={onDark ? "#0F172A" : "white"} />
      <circle cx="18" cy="26" r="0.85" fill={pupil} />
      <circle cx="30" cy="26" r="0.85" fill={pupil} />
    </svg>
  );
}

function NavMarkPx(size: LogoSize): number {
  const px = ICON_SIZES[size];
  if (size === "xl") return Math.min(px, 48);
  if (size === "lg") return Math.min(px, 40);
  if (size === "md") return Math.min(px, 32);
  return Math.min(px, 28);
}

export function LogoIcon({
  size = "md",
  className,
  variant = "dark",
}: Pick<LogoProps, "size" | "className" | "variant">) {
  const px = ICON_SIZES[size];
  if (variant === "nav" || variant === "nav-on-light") {
    return (
      <span className={cn("inline-flex shrink-0", className)}>
        <HexNavMark px={NavMarkPx(size)} />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex shrink-0", className)}>
      <FoxIcon px={px} onDark={variant === "light"} />
    </span>
  );
}

export default function Logo({
  size = "md",
  variant = "dark",
  className,
  "aria-label": ariaLabel = "Rentfoxxy",
}: LogoProps) {
  const px = ICON_SIZES[size];
  const wordClasses = cn(
    "font-sans font-bold tracking-tight select-none lowercase",
    variant === "dark" && "text-primary",
    variant === "light" && "text-white",
  );

  const gap =
    size === "sm" ? "gap-1.5" : size === "md" ? "gap-2" : size === "lg" ? "gap-2.5" : "gap-3";
  const textSize =
    size === "sm"
      ? "text-base"
      : size === "md"
        ? "text-lg"
        : size === "lg"
          ? "text-2xl"
          : "text-3xl";

  if (variant === "icon-only") {
    return (
      <span className={cn("inline-flex items-center", className)} aria-label={ariaLabel}>
        <FoxIcon px={px} onDark={false} />
      </span>
    );
  }

  if (variant === "nav" || variant === "nav-on-light") {
    const onDarkBar = variant === "nav";
    const titleSize =
      size === "sm"
        ? "text-sm"
        : size === "md"
          ? "text-base"
          : size === "lg"
            ? "text-xl"
            : "text-2xl";
    const tagSize =
      size === "sm" ? "text-[8px]" : size === "md" ? "text-[9px]" : "text-[10px]";
    return (
      <span className={cn("inline-flex items-center gap-2", className)} aria-label={ariaLabel}>
        <HexNavMark px={NavMarkPx(size)} />
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-medium tracking-tight lowercase",
              titleSize,
              onDarkBar ? "text-white" : "text-primary",
            )}
          >
            rentfoxxy
          </span>
          <span
            className={cn(
              "font-normal uppercase tracking-widest",
              tagSize,
              onDarkBar ? "text-white/[0.3]" : "text-ink-muted",
            )}
          >
            B2B LAPTOP PROCUREMENT
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center", gap, className)} aria-label={ariaLabel}>
      <FoxIcon px={px} onDark={variant === "light"} />
      <span className={cn(wordClasses, textSize)}>rentfoxxy</span>
    </span>
  );
}
