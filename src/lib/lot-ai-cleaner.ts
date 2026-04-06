import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LotItemCondition } from "@prisma/client";

export type LotCSVRow = {
  brand: string;
  model: string;
  generation?: string | null;
  processor: string;
  ramGb: number;
  storageGb: number;
  storageType: string;
  displayInch: number;
  os: string;
  condition: LotItemCondition | string;
  count: number;
  unitPrice: number;
  notes?: string | null;
};

export type AsAsInventoryInput = {
  brand: string;
  model: string;
  condition: LotItemCondition | string;
  count: number;
  estimatedValue: number;
};

export type AsAsCSVRow = {
  brand: string;
  model: string;
  generation?: string | null;
  processor: string;
  ramGb: number;
  storageGb: number;
  storageType: string;
  condition: LotItemCondition | string;
  count: number;
  estimatedValue: number;
};

export type AsAsNameResult = {
  name: string;
  description: string;
  highlights: string[];
  suggestedLotCount: number;
  avgUnitPrice: number;
  totalValue: number;
};

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const genAI = new GoogleGenerativeAI(key);
  const name = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash-latest";
  return genAI.getGenerativeModel({ model: name });
}

function stripJsonFence(text: string): string {
  return text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

/** Badge label for storefront (maps DB enum → addendum v1.3 wording). */
export function lotConditionToLabel(c: LotItemCondition | string): string {
  const raw = String(c).trim();
  const map: Record<string, string> = {
    BRAND_NEW: "Brand New",
    REFURB_A_PLUS: "Refurb A+",
    REFURB_A: "Refurb A",
    REFURB_B: "Refurb B",
    REFURB_C: "Refurb C",
  };
  if (map[raw]) return map[raw];
  const t = raw.toLowerCase();
  if (t.includes("brand") && t.includes("new")) return "Brand New";
  if (t.includes("a+") || t.includes("a plus") || t.includes("like new") || t.includes("open box")) return "Refurb A+";
  if (t === "a" || t.includes("grade a") || t.includes("lightly used")) return "Refurb A";
  if (t === "b" || t.includes("grade b") || t.includes("good") || t === "used") return "Refurb B";
  if (t === "c" || t.includes("grade c") || t.includes("poor") || t.includes("heavy use") || t.includes("as is"))
    return "Refurb C";
  return raw;
}

export function humanConditionToPrisma(raw: string): LotItemCondition {
  const s = raw.replace(/[\s_]+/g, " ").trim().toLowerCase();
  if (s.includes("brand") && s.includes("new")) return "BRAND_NEW";
  if (s.includes("a+") || s.includes("a plus") || s.includes("like new") || s.includes("open box")) return "REFURB_A_PLUS";
  if (s === "a" || s.includes("grade a") || s.includes("lightly used")) return "REFURB_A";
  if (s === "b" || s.includes("grade b") || s.includes("good")) return "REFURB_B";
  if (s === "c" || s.includes("grade c") || s.includes("poor") || s.includes("heavy use") || s.includes("as is"))
    return "REFURB_C";
  const u = raw.replace(/[\s_]+/g, "_").toUpperCase();
  if (u.includes("A+") || u === "REFURB_A_PLUS" || u === "A+") return "REFURB_A_PLUS";
  if (u.includes("BRAND") && u.includes("NEW")) return "BRAND_NEW";
  if (u === "REFURB_A" || u === "A" || u.includes("GRADE_A")) return "REFURB_A";
  if (u === "REFURB_B" || u === "B") return "REFURB_B";
  if (u === "REFURB_C" || u === "C") return "REFURB_C";
  return "REFURB_B";
}

export function parseCondition(raw: string): LotItemCondition {
  return humanConditionToPrisma(raw);
}

const ALLOWED: LotItemCondition[] = [
  "BRAND_NEW",
  "REFURB_A_PLUS",
  "REFURB_A",
  "REFURB_B",
  "REFURB_C",
];

export function toLotItemCondition(c: string | LotItemCondition): LotItemCondition {
  if (typeof c !== "string") return c;
  const t = c.trim();
  if (/brand\s*new/i.test(t)) return "BRAND_NEW";
  const compact = t.toUpperCase().replace(/[\s-]+/g, "_").replace("REFURB_A+", "REFURB_A_PLUS");
  if (ALLOWED.includes(compact as LotItemCondition)) return compact as LotItemCondition;
  return humanConditionToPrisma(t);
}

function normalizeLotRow(r: Record<string, unknown>): LotCSVRow {
  return {
    brand: String(r.brand ?? "").trim(),
    model: String(r.model ?? "").trim(),
    generation: r.generation != null && String(r.generation).trim() !== "" ? String(r.generation).trim() : null,
    processor: String(r.processor ?? "—").trim() || "—",
    ramGb: Math.max(0, Math.floor(Number(r.ramGb))),
    storageGb: Math.max(0, Math.floor(Number(r.storageGb))),
    storageType: String(r.storageType ?? "SSD").trim() || "SSD",
    displayInch: Number(r.displayInch) || 14,
    os: String(r.os ?? "Windows 11 Pro").trim() || "Windows 11 Pro",
    condition: toLotItemCondition(String(r.condition ?? "Refurb B")),
    count: Math.max(0, Math.floor(Number(r.count))),
    unitPrice: Math.max(0, Number(r.unitPrice)),
    notes: r.notes != null && String(r.notes).trim() !== "" ? String(r.notes).trim() : null,
  };
}

function normalizeAsAsRow(r: Record<string, unknown>): AsAsCSVRow {
  const ev = r.estimatedValue ?? r.estimated_value_inr ?? r.Estimated_Value_INR;
  return {
    brand: String(r.brand ?? "").trim(),
    model: String(r.model ?? "").trim(),
    generation: r.generation != null && String(r.generation).trim() !== "" ? String(r.generation).trim() : null,
    processor: String(r.processor ?? "—").trim() || "—",
    ramGb: Math.max(0, Math.floor(Number(r.ramGb))),
    storageGb: Math.max(0, Math.floor(Number(r.storageGb))),
    storageType: String(r.storageType ?? "SSD").trim() || "SSD",
    condition: toLotItemCondition(String(r.condition ?? "Refurb B")),
    count: Math.max(0, Math.floor(Number(r.count))),
    estimatedValue: Math.max(0, Number(ev)),
  };
}

const LOT_PROMPT = `You are a data cleaning assistant for a B2B laptop marketplace called Rentfoxxy.
Raw CSV data from a vendor lot upload is below.

Rules:
1. Trim all whitespace from every field value.
2. Condition field: standardise to EXACTLY one of these human-readable values (case-sensitive):
   "Brand New" | "Refurb A+" | "Refurb A" | "Refurb B" | "Refurb C"
   Mappings: "new"/"sealed"/"factory new" → "Brand New"
             "a+"/"grade a+"/"like new"/"open box" → "Refurb A+"
             "a"/"grade a"/"lightly used" → "Refurb A"
             "b"/"grade b"/"used"/"good" → "Refurb B"
             "c"/"grade c"/"poor"/"heavy use"/"as is" → "Refurb C"
3. RAM_GB / ramGb: integer (strip "GB", "gb").
4. Storage_GB / storageGb: integer; if TB, multiply by 1024.
5. storageType: "SSD" | "HDD" | "eMMC" | "NVMe SSD" ("nvme"/"m.2" → "NVMe SSD").
6. OS: "win11"/"windows 11" → "Windows 11 Pro", "win10" → "Windows 10 Pro", "macos" → "macOS"; keep sensible others.
7. Brand: proper case — Dell, HP, Lenovo, Apple, Acer, ASUS, MSI.
8. displayInch: decimal; strip "inch" / quotes.
9. count: positive integer — flag in issues if <= 0.
10. unitPrice: positive number — flag if <= 0 or missing.
11. Required: Brand, Model, Condition, Count, Unit_Price (unitPrice). Missing → issues.

Return ONLY valid JSON (no markdown):
{
  "cleaned": [{
    "brand": string,
    "model": string,
    "generation": string,
    "processor": string,
    "ramGb": number,
    "storageGb": number,
    "storageType": string,
    "displayInch": number,
    "os": string,
    "condition": string,
    "count": number,
    "unitPrice": number,
    "notes": string
  }],
  "issues": ["row N: ..."],
  "stats": { "total": number, "cleaned": number, "flagged": number }
}

RAW CSV:
`;

const ASAS_PROMPT = `You are a data cleaning assistant for Rentfoxxy As-Available-As-Is (AsAs) inventory CSV.
Rules mirror lot cleaning but each row has estimatedValue (INR) instead of unitPrice/displayInch/os.
Condition values must be exactly one of: "Brand New" | "Refurb A+" | "Refurb A" | "Refurb B" | "Refurb C" (same mapping rules as lot cleaning).
Required columns conceptually: Brand, Model, Condition, Count, Estimated_Value_INR (output as estimatedValue).
RAM_GB and Storage_GB as integers; storageType SSD/HDD/eMMC/NVMe SSD.

Return ONLY valid JSON (no markdown):
{
  "cleaned": [{
    "brand": string,
    "model": string,
    "generation": string,
    "processor": string,
    "ramGb": number,
    "storageGb": number,
    "storageType": string,
    "condition": string,
    "count": number,
    "estimatedValue": number
  }],
  "issues": ["row N: ..."],
  "stats": { "total": number, "cleaned": number, "flagged": number }
}

RAW CSV:
`;

export async function cleanLotCSV(rawCSVContent: string): Promise<{
  cleaned: LotCSVRow[];
  issues: string[];
  stats: { total: number; cleaned: number; flagged: number };
}> {
  const model = getModel();
  if (!model) {
    return heuristicLotClean(rawCSVContent);
  }

  const prompt = LOT_PROMPT + rawCSVContent.slice(0, 120_000);
  const result = await model.generateContent(prompt);
  const text = stripJsonFence(result.response.text());
  try {
    const parsed = JSON.parse(text) as {
      cleaned: Record<string, unknown>[];
      issues: string[];
      stats: { total: number; cleaned: number; flagged: number };
    };
    const cleaned = (parsed.cleaned ?? []).map(normalizeLotRow).filter((r) => r.brand && r.model);
    return {
      cleaned,
      issues: parsed.issues ?? [],
      stats: parsed.stats ?? {
        total: cleaned.length,
        cleaned: cleaned.length,
        flagged: (parsed.issues ?? []).length,
      },
    };
  } catch {
    throw new Error("AI cleaning failed — check CSV format or GEMINI_API_KEY");
  }
}

export async function cleanAsAsInventory(
  rawCSVContent: string,
): Promise<{ cleaned: AsAsCSVRow[]; issues: string[]; stats: { total: number; cleaned: number; flagged: number } }> {
  const model = getModel();
  if (!model) {
    const { rows, issues } = cleanAsAsCSV(rawCSVContent);
    const cleaned = rows.map((r) => ({
      ...r,
      condition: toLotItemCondition(r.condition),
    }));
    return {
      cleaned,
      issues,
      stats: { total: cleaned.length, cleaned: cleaned.length, flagged: issues.length },
    };
  }

  const prompt = ASAS_PROMPT + rawCSVContent.slice(0, 120_000);
  const result = await model.generateContent(prompt);
  const text = stripJsonFence(result.response.text());
  try {
    const parsed = JSON.parse(text) as {
      cleaned: Record<string, unknown>[];
      issues: string[];
      stats: { total: number; cleaned: number; flagged: number };
    };
    const cleaned = (parsed.cleaned ?? []).map(normalizeAsAsRow).filter((r) => r.brand && r.model);
    return {
      cleaned,
      issues: parsed.issues ?? [],
      stats: parsed.stats ?? {
        total: cleaned.length,
        cleaned: cleaned.length,
        flagged: (parsed.issues ?? []).length,
      },
    };
  } catch {
    throw new Error("AI AsAs cleaning failed — check CSV format or GEMINI_API_KEY");
  }
}

function heuristicLotClean(raw: string): {
  cleaned: LotCSVRow[];
  issues: string[];
  stats: { total: number; cleaned: number; flagged: number };
} {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return { cleaned: [], issues: ["No data rows"], stats: { total: 0, cleaned: 0, flagged: 0 } };
  }
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.findIndex((h) => h === name || h.replace(/\s/g, "_") === name);

  const cleaned: LotCSVRow[] = [];
  const issues: string[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(",").map((c) => c.trim());
    const g = (i: number) => cols[i] ?? "";
    try {
      const brand = g(idx("brand"));
      const modelName = g(idx("model"));
      const conditionRaw = g(idx("condition"));
      const count = parseInt(g(idx("count")), 10) || 0;
      const unitPrice = parseFloat(g(idx("unit_price"))) || 0;
      if (!brand || !modelName) {
        issues.push(`Row ${r + 1}: missing brand/model`);
        continue;
      }
      if (count <= 0 || unitPrice <= 0) issues.push(`Row ${r + 1}: invalid count or price`);
      cleaned.push({
        brand,
        model: modelName,
        generation: g(idx("generation")) || null,
        processor: g(idx("processor")) || "—",
        ramGb: parseInt(g(idx("ram_gb")), 10) || 0,
        storageGb: parseInt(g(idx("storage_gb")), 10) || 0,
        storageType: g(idx("storagetype")) || g(idx("storage_type")) || "SSD",
        displayInch: parseFloat(g(idx("display_inch"))) || 14,
        os: g(idx("os")) || "Windows 11 Pro",
        condition: toLotItemCondition(conditionRaw || "Refurb B"),
        count,
        unitPrice,
        notes: g(idx("notes")) || null,
      });
    } catch {
      issues.push(`Row ${r + 1}: parse error`);
    }
  }
  const flagged = issues.length;
  return {
    cleaned,
    issues,
    stats: { total: cleaned.length, cleaned: cleaned.length, flagged },
  };
}

export async function generateAsAsName(items: AsAsInventoryInput[]): Promise<AsAsNameResult> {
  const model = getModel();
  const totalUnits = items.reduce((s, i) => s + Math.max(0, Math.floor(i.count)), 0);
  const totalVal = items.reduce(
    (s, x) => s + Math.max(0, Math.floor(x.count)) * Math.max(0, Number(x.estimatedValue)),
    0,
  );
  const avg = totalUnits > 0 ? totalVal / totalUnits : 0;

  if (!model) {
    const brands = Array.from(new Set(items.map((x) => x.brand)));
    return {
      name: `Mixed fleet — ${brands.slice(0, 3).join("/")} (${totalUnits} units)`,
      description: `Corporate clearance lot with ${brands.length} brands. Verified listing pending.`,
      highlights: [`${totalUnits} units`, `Brands: ${brands.join(", ")}`, "As-Available-As-Is pricing"],
      suggestedLotCount: totalUnits >= 30 ? Math.max(2, Math.floor(totalUnits / 30)) : 0,
      avgUnitPrice: avg,
      totalValue: totalVal,
    };
  }

  const summary = items.map((i) => ({
    brand: i.brand,
    model: i.model,
    condition: lotConditionToLabel(toLotItemCondition(i.condition)),
    count: i.count,
    estimatedValue: i.estimatedValue,
  }));

  const prompt = `
You are a product naming assistant for Rentfoxxy, a B2B laptop marketplace.
Create a professional collection name for this AsAs (As-Available-As-Is) listing.

Inventory (JSON):
${JSON.stringify(summary).slice(0, 80_000)}

Rules:
- Mention main brands (max 3)
- Mention condition range (e.g. Refurb A to B)
- Mention total unit count
- Professional B2B tone

Return ONLY valid JSON, no markdown:
{
  "name": "max 80 chars",
  "description": "max 200 chars",
  "highlights": ["3 to 5 strings"],
  "suggestedLotCount": 0
}
Use suggestedLotCount 0 if total units < 30.
`;

  const result = await model.generateContent(prompt);
  const text = stripJsonFence(result.response.text());
  try {
    const p = JSON.parse(text) as {
      name: string;
      description: string;
      highlights: string[];
      suggestedLotCount: number;
    };
    return {
      name: p.name,
      description: p.description,
      highlights: p.highlights ?? [],
      suggestedLotCount: p.suggestedLotCount ?? 0,
      avgUnitPrice: avg,
      totalValue: totalVal,
    };
  } catch {
    const brands = Array.from(new Set(items.map((i) => i.brand)));
    return {
      name: `Mixed Laptop Collection — ${brands.slice(0, 3).join(", ")} (${totalUnits} units)`,
      description: `Verified mixed-condition laptops from ${brands.join(", ")}.`,
      highlights: ["Verified by Rentfoxxy team", "Mixed brands and conditions", `${totalUnits} total units`],
      suggestedLotCount: Math.floor(totalUnits / 10),
      avgUnitPrice: avg,
      totalValue: totalVal,
    };
  }
}

/** @deprecated Use generateAsAsName — kept for imports */
export const generateAsAsMeta = generateAsAsName;

export function cleanAsAsCSV(raw: string): {
  rows: Array<{
    brand: string;
    model: string;
    generation?: string | null;
    processor: string;
    ramGb: number;
    storageGb: number;
    storageType: string;
    condition: LotItemCondition;
    count: number;
    estimatedValue: number;
  }>;
  issues: string[];
} {
  const lines = raw.trim().split(/\r?\n/).filter(Boolean);
  const issues: string[] = [];
  if (lines.length < 2) return { rows: [], issues: ["Empty CSV"] };
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.findIndex((h) => h === name || h.replace(/\s/g, "_") === name);
  const rows: Array<{
    brand: string;
    model: string;
    generation?: string | null;
    processor: string;
    ramGb: number;
    storageGb: number;
    storageType: string;
    condition: LotItemCondition;
    count: number;
    estimatedValue: number;
  }> = [];

  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(",").map((c) => c.trim());
    const g = (i: number) => cols[i] ?? "";
    const brand = g(idx("brand"));
    const model = g(idx("model"));
    const count = parseInt(g(idx("count")), 10) || 0;
    const ev = parseFloat(g(idx("estimated_value_inr"))) || 0;
    if (!brand || !model) {
      issues.push(`Row ${r + 1}: missing brand/model`);
      continue;
    }
    rows.push({
      brand,
      model,
      generation: g(idx("generation")) || null,
      processor: g(idx("processor")) || "—",
      ramGb: parseInt(g(idx("ram_gb")), 10) || 0,
      storageGb: parseInt(g(idx("storage_gb")), 10) || 0,
      storageType: g(idx("storagetype")) || "SSD",
      condition: toLotItemCondition(g(idx("condition")) || "Refurb B"),
      count,
      estimatedValue: ev,
    });
  }
  return { rows, issues };
}
