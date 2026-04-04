/** Use for product/cart image strings: full URL, data URI, or site-root path (`/…` from `public/`). */
export function isUsableImageSrc(src: string | null | undefined): src is string {
  if (!src) return false;
  return (
    src.startsWith("https://") ||
    src.startsWith("http://") ||
    src.startsWith("data:") ||
    src.startsWith("/")
  );
}

/**
 * Files live under `public/` but URLs must not include `public`.
 * e.g. `/public/products/x.webp` → `/products/x.webp`
 */
export function normalizePublicImagePath(src: string): string {
  const t = src.trim().replace(/\\/g, "/");
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("data:")) return t;
  if (t.startsWith("/public/")) return t.slice("/public".length);
  if (t.startsWith("public/")) return `/${t.slice("public/".length)}`;
  if (!t.startsWith("/") && t.includes("/")) return `/${t.replace(/^\.\//, "")}`;
  return t;
}

export function normalizeProductImages(images: string[]): string[] {
  const out = images.map((s) => normalizePublicImagePath(s)).filter(Boolean);
  return Array.from(new Set(out));
}

/** Admin “Images” textarea: one URL per line or comma-separated. */
export function parseProductImageInput(text: string): string[] {
  const parts = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return normalizeProductImages(parts);
}
