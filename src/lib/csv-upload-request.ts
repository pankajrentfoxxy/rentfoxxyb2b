import { NextRequest } from "next/server";

export type RawCsvReadResult =
  | { ok: true; raw: string }
  | { ok: false; error: string; status: number };

/** Multipart `file` or JSON `{ rawCSV }` — body consumed once per branch. */
export async function readRawCSVFromRequest(req: NextRequest): Promise<RawCsvReadResult> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");
    if (file instanceof File) {
      const raw = (await file.text()).trim();
      if (!raw) return { ok: false, error: "Empty file", status: 400 };
      return { ok: true, raw };
    }
    return { ok: false, error: "No file uploaded", status: 400 };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, error: "Expected multipart file or JSON with rawCSV", status: 400 };
  }
  const raw = typeof (body as { rawCSV?: unknown }).rawCSV === "string" ? (body as { rawCSV: string }).rawCSV.trim() : "";
  if (!raw) return { ok: false, error: "rawCSV required", status: 400 };
  return { ok: true, raw };
}
