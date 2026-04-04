/**
 * Shiprocket courier tracking (optional — falls back to DB shipment.events when unset or API errors).
 * Env: SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD
 */

export type NormalizedTrackingEvent = {
  date: string;
  status: string;
  description: string;
  location?: string;
};

const LOGIN_URL = "https://apiv2.shiprocket.in/v1/external/auth/login";
const TRACK_BASE = "https://apiv2.shiprocket.in/v1/external/courier/track/awb";

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000; // refresh before 10d expiry

export async function getShiprocketToken(): Promise<string | null> {
  const email = process.env.SHIPROCKET_EMAIL?.trim();
  const password = process.env.SHIPROCKET_PASSWORD?.trim();
  if (!email || !password) return null;

  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { token?: string };
  if (!data.token) return null;

  tokenCache = {
    token: data.token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  return data.token;
}

function normalizeApiEvents(raw: unknown): NormalizedTrackingEvent[] {
  if (!raw || typeof raw !== "object") return [];
  const root = raw as Record<string, unknown>;
  const td = root.tracking_data as Record<string, unknown> | undefined;
  const activities =
    (td?.shipment_track_activities as unknown[]) ||
    (td?.track_activities as unknown[]) ||
    (root.data as { tracking_data?: { shipment_track_activities?: unknown[] } })?.tracking_data
      ?.shipment_track_activities ||
    [];

  if (!Array.isArray(activities)) return [];

  const out: NormalizedTrackingEvent[] = [];
  for (const row of activities) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const date = String(r.date ?? r.created_at ?? r.tracking_date ?? "");
    const status = String(r["sr-status"] ?? r.status ?? r["Shipment Status"] ?? "Update");
    const description = String(r.activity ?? r["activity"] ?? r.status ?? "");
    const location = r.location ? String(r.location) : undefined;
    if (date || description) {
      out.push({ date: date || new Date().toISOString(), status, description, location });
    }
  }
  return out;
}

/** Returns newest events first (best effort). */
export async function trackShipment(awb: string): Promise<NormalizedTrackingEvent[]> {
  const token = await getShiprocketToken();
  if (!token) return [];

  const url = `${TRACK_BASE}/${encodeURIComponent(awb)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return [];
  }
  return normalizeApiEvents(json);
}
