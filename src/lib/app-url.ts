/** Base URL for emails and absolute links (no trailing slash). */
export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function absoluteAppPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getAppBaseUrl()}${p}`;
}
