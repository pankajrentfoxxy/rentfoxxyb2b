import dotenv from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const APPYFLOW_NAMES = ["APPYFLOW_GST_KEY", "APPYFLOW_KEY_SECRET", "APPYFLOW_API_KEY"] as const;

/** Walk up from cwd until we find directories that contain `.env.local`. */
function directoriesContainingEnvLocal(): string[] {
  const hits: string[] = [];
  let dir = process.cwd();
  for (let i = 0; i < 14; i++) {
    if (existsSync(join(dir, ".env.local"))) hits.push(dir);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return hits.length > 0 ? hits : [process.cwd()];
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/** Merge AppyFlow keys from a dotenv file into `process.env`. */
function applyParsedAppyflow(parsed: Record<string, string>): void {
  for (const [rawKey, rawVal] of Object.entries(parsed)) {
    const key = rawKey.replace(/^\ufeff/, "").trim();
    if (!(APPYFLOW_NAMES as readonly string[]).includes(key)) continue;
    const v = String(rawVal ?? "").trim();
    if (v !== "") process.env[key] = v;
  }
}

/**
 * Loads AppyFlow credentials from `.env.local` (and `.env`) on disk.
 * Next.js sometimes does not bind custom server env vars into API routes; `process.cwd()` may
 * also point at a subfolder (e.g. `.next`), so we walk parents until `.env.local` is found.
 */
export function ensureAppyflowEnvFromDisk(): void {
  for (const base of directoriesContainingEnvLocal()) {
    const localPath = join(base, ".env.local");
    try {
      if (!existsSync(localPath)) continue;
      const text = stripBom(readFileSync(localPath, "utf8"));
      applyParsedAppyflow(dotenv.parse(text));
    } catch (e) {
      console.warn("[appyflow-env] failed reading", localPath, e);
    }
  }

  try {
    for (const base of directoriesContainingEnvLocal()) {
      const p = join(base, ".env");
      if (!existsSync(p)) continue;
      applyParsedAppyflow(dotenv.parse(stripBom(readFileSync(p, "utf8"))));
    }
  } catch {
    /* ignore */
  }
}

export function resolveAppyflowKey(): string {
  ensureAppyflowEnvFromDisk();
  return (
    (process.env.APPYFLOW_GST_KEY ?? "").trim() ||
    (process.env.APPYFLOW_KEY_SECRET ?? "").trim() ||
    (process.env.APPYFLOW_API_KEY ?? "").trim() ||
    ""
  );
}

/** Dev-only diagnostics (no secrets). */
export function appyflowEnvDebug(): { cwd: string; rootsWithEnvLocal: string[]; keyLength: number } {
  return {
    cwd: process.cwd(),
    rootsWithEnvLocal: directoriesContainingEnvLocal(),
    keyLength: resolveAppyflowKey().length,
  };
}
