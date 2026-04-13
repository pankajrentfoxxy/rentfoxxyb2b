import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LotItemCondition } from "@prisma/client";
import Papa from "papaparse";

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
  cosmeticSummary?: string | null;
  functionalCount?: number;
  nonFunctionalCount?: number;
};

export type NonFunctionalUnit = { brand: string; model: string; count: number; reason: string };

export type CleanLotCSVResult = {
  cleaned: LotCSVRow[];
  issues: string[];
  stats: {
    total: number;
    cleaned: number;
    flagged: number;
    totalRowsInput?: number;
    totalFunctional?: number;
    totalNonFunctional?: number;
    groupsCreated?: number;
    format?: string;
  };
  format?: "A" | "B";
  nonFunctional: NonFunctionalUnit[];
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
  /** Inspection / operational notes (shown in Status column on CSV export). */
  notes?: string | null;
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
    REFURB_D: "Refurb D",
  };
  if (map[raw]) return map[raw];
  const t = raw.toLowerCase();
  if (t.includes("brand") && t.includes("new")) return "Brand New";
  if (t.includes("a+") || t.includes("a plus") || t.includes("like new") || t.includes("open box")) return "Refurb A+";
  if (t === "a" || t.includes("grade a") || t.includes("lightly used")) return "Refurb A";
  if (t === "b" || t.includes("grade b") || t.includes("good") || t === "used") return "Refurb B";
  if (t === "c" || t.includes("grade c") || t.includes("poor") || t.includes("heavy use") || t.includes("as is"))
    return "Refurb C";
  if (t === "d" || t.includes("grade d")) return "Refurb D";
  if (t === "e" || t.includes("grade e")) return "Refurb D";
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
  if (s === "d" || s.includes("grade d")) return "REFURB_D";
  if (s === "e" || s.includes("grade e")) return "REFURB_D";
  const u = raw.replace(/[\s_]+/g, "_").toUpperCase();
  if (u.includes("A+") || u === "REFURB_A_PLUS" || u === "A+") return "REFURB_A_PLUS";
  if (u.includes("BRAND") && u.includes("NEW")) return "BRAND_NEW";
  if (u === "REFURB_A" || u === "A" || u.includes("GRADE_A")) return "REFURB_A";
  if (u === "REFURB_B" || u === "B") return "REFURB_B";
  if (u === "REFURB_C" || u === "C") return "REFURB_C";
  if (u === "D" || u === "REFURB_D") return "REFURB_D";
  if (u === "E" || u === "REFURB_E") return "REFURB_D";
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
  "REFURB_D",
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
    notes:
      r.notes != null && String(r.notes).trim() !== "" ? String(r.notes).trim().slice(0, 8000) : null,
    cosmeticSummary:
      r.cosmeticSummary != null && String(r.cosmeticSummary).trim() !== ""
        ? String(r.cosmeticSummary).trim().slice(0, 500)
        : null,
    functionalCount:
      r.functionalCount != null && !Number.isNaN(Number(r.functionalCount))
        ? Math.max(0, Math.floor(Number(r.functionalCount)))
        : undefined,
    nonFunctionalCount:
      r.nonFunctionalCount != null && !Number.isNaN(Number(r.nonFunctionalCount))
        ? Math.max(0, Math.floor(Number(r.nonFunctionalCount)))
        : undefined,
  };
}

function normalizeAsAsRow(r: Record<string, unknown>): AsAsCSVRow {
  const ev = r.estimatedValue ?? r.estimated_value_inr ?? r.Estimated_Value_INR;
  const notesRaw = r.notes ?? r.status_notes ?? r.status ?? r.Status;
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
    notes:
      notesRaw != null && String(notesRaw).trim() !== "" ? String(notesRaw).trim().slice(0, 8000) : null,
  };
}

/** Parse CSV with proper quote handling (commas inside "..." cells). */
function parseCsvRecords(raw: string): { records: Record<string, string>[]; fields: string[] } {
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().replace(/^\uFEFF/, ""),
  });
  const fields = (parsed.meta.fields ?? []).map((f) => String(f).trim().replace(/^\uFEFF/, ""));
  const records = (parsed.data ?? []).filter((row) =>
    Object.values(row).some((v) => String(v ?? "").trim() !== ""),
  );
  return { records, fields };
}

function pickField(row: Record<string, string>, ...candidates: string[]): string {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const cl = c.toLowerCase().replace(/\s+/g, " ").trim();
    const hit = keys.find(
      (k) =>
        k.toLowerCase().replace(/\s+/g, " ").trim() === cl ||
        k.toLowerCase().replace(/\s+/g, "") === cl.replace(/\s+/g, ""),
    );
    if (hit !== undefined && row[hit] != null) return String(row[hit]).trim();
  }
  return "";
}

function isInspectorInventorySheetFormat(fields: string[]): boolean {
  const norm = fields.map((f) => f.toLowerCase().replace(/\s+/g, " ").trim());
  const has = (name: string) => norm.some((f) => f === name || f.replace(/\s/g, "") === name.replace(/\s/g, ""));
  return has("grade") && has("make") && has("model") && (has("status") || has("cpu"));
}

function parseRamGbFromText(s: string): number {
  const m = s.replace(/,/g, "").match(/(\d+)\s*(?:gb|g\b)?/i);
  return m ? Math.max(0, parseInt(m[1]!, 10)) : 0;
}

function parseStorageFromInspectorRow(row: Record<string, string>): { storageGb: number; storageType: string } {
  const ssd = pickField(row, "ssd capacity", "ssd_capacity", "ssd");
  const hdd = pickField(row, "hdd capacity", "hdd_capacity", "hdd");
  const nSsd = parseInt(ssd.replace(/\D/g, ""), 10);
  const nHdd = parseInt(hdd.replace(/\D/g, ""), 10);
  if (Number.isFinite(nSsd) && nSsd > 0) return { storageGb: nSsd, storageType: "SSD" };
  if (Number.isFinite(nHdd) && nHdd > 0) return { storageGb: nHdd, storageType: "HDD" };
  return { storageGb: 256, storageType: "SSD" };
}

function parseDisplayInchFromScreenSize(s: string): number {
  const t = s.replace(/""/g, '"').replace(/"/g, "");
  const m = t.match(/(\d+(?:\.\d+)?)/);
  return m ? Math.min(20, Math.max(10, parseFloat(m[1]!))) : 14;
}

function gradeLetterToConditionLabel(letter: string): string {
  const g = letter.trim().toUpperCase();
  if (g === "E" || g === "D") return "Refurb D";
  if (g === "C") return "Refurb C";
  if (g === "B") return "Refurb B";
  if (g === "A") return "Refurb A";
  return "Refurb C";
}

function isDeadInventoryStatus(status: string): boolean {
  const t = status.toLowerCase();
  return t.includes("no power") || t.includes("no display");
}

function defaultEstInrForWorkingUnit(ramGb: number): number {
  if (ramGb >= 16) return 14_000;
  if (ramGb >= 8) return 12_000;
  return 10_000;
}

function formatCpuGeneration(cpu: string, generation: string): string {
  const c = cpu.trim();
  const g = generation.trim();
  if (!c) return "—";
  return g ? `${c.toUpperCase()} ${g.toUpperCase()}` : c.toUpperCase();
}

function briefCosmeticFromInspectorRow(row: Record<string, string>): string | null {
  const parts = [
    pickField(row, "panel"),
    pickField(row, "screen"),
    pickField(row, "keyboard"),
    pickField(row, "base"),
    pickField(row, "touch pad", "touchpad"),
  ]
    .filter((x) => x && !/^ok$/i.test(x) && !/^na$/i.test(x) && !/^not checked$/i.test(x))
    .slice(0, 4);
  if (parts.length === 0) return null;
  return parts.join("; ").slice(0, 500);
}

function buildInspectionStatusNotes(b: {
  dead: boolean;
  count: number;
  statusSamples: string[];
  cosmetic: string | null;
}): string {
  const uniq = Array.from(new Set(b.statusSamples.map((s) => s.trim()).filter(Boolean))).slice(0, 12);
  const inspection = uniq.length ? uniq.join(" | ") : "Not specified";
  if (b.dead) {
    const cos = b.cosmetic ? ` Cosmetic: ${b.cosmetic}.` : "";
    return `Non-functional (${b.count} units). Inspection Status: ${inspection}.${cos}`.trim().slice(0, 8000);
  }
  const cos = b.cosmetic ? ` Cosmetic notes: ${b.cosmetic}.` : "";
  return `Functional (${b.count} units). Inspection Status: ${inspection}.${cos}`.trim().slice(0, 8000);
}

function aggregateInspectorInventory(records: Record<string, string>[]) {
  type Bucket = {
    brand: string;
    model: string;
    generation: string | null;
    processor: string;
    ramGb: number;
    storageGb: number;
    storageType: string;
    displayInch: number;
    conditionLabel: string;
    dead: boolean;
    count: number;
    priceSum: number;
    cosmetic: string | null;
    statusSamples: string[];
  };

  const buckets = new Map<string, Bucket>();
  const nfMap = new Map<string, { brand: string; model: string; reason: string; count: number }>();
  const issues: string[] = [];
  let rowNum = 0;

  for (const row of records) {
    rowNum++;
    const make = pickField(row, "make", "brand", "manufacturer");
    const model = pickField(row, "model");
    if (!make || !model) {
      issues.push(`Row ${rowNum}: missing Make/Model`);
      continue;
    }
    const grade = pickField(row, "grade", "condition");
    const status = pickField(row, "status", "functional status");
    const cpu = pickField(row, "cpu", "processor");
    const generation = pickField(row, "generation") || null;
    const ramGb = parseRamGbFromText(pickField(row, "ram capacity", "ram_gb", "ram"));
    const { storageGb, storageType } = parseStorageFromInspectorRow(row);
    const displayInch = parseDisplayInchFromScreenSize(pickField(row, "screen size", "display inch", "display_inch"));
    const conditionLabel = gradeLetterToConditionLabel(grade || "C");
    const dead = isDeadInventoryStatus(status);
    const proc = formatCpuGeneration(cpu, generation ?? "");
    const unit = dead ? 3500 : defaultEstInrForWorkingUnit(ramGb);
    const cos = briefCosmeticFromInspectorRow(row);

    const key = [
      make,
      model,
      generation ?? "",
      proc,
      ramGb,
      storageGb,
      storageType,
      displayInch,
      conditionLabel,
      dead ? "1" : "0",
    ].join("\t");

    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.priceSum += unit;
      if (status) existing.statusSamples.push(status);
      if (!existing.cosmetic && cos) existing.cosmetic = cos;
    } else {
      buckets.set(key, {
        brand: make,
        model,
        generation,
        processor: proc,
        ramGb,
        storageGb,
        storageType,
        displayInch,
        conditionLabel,
        dead,
        count: 1,
        priceSum: unit,
        cosmetic: cos,
        statusSamples: status ? [status] : [],
      });
    }

    if (dead) {
      const reason = status.slice(0, 240) || "Non-functional (Status)";
      const nfk = `${make}\t${model}\t${reason}`;
      const cur = nfMap.get(nfk);
      if (cur) cur.count += 1;
      else nfMap.set(nfk, { brand: make, model, reason, count: 1 });
    }
  }

  const nonFunctional: NonFunctionalUnit[] = Array.from(nfMap.values()).map((x) => ({
    brand: x.brand,
    model: x.model,
    count: x.count,
    reason: x.reason,
  }));

  return { buckets, nonFunctional, issues, inputRows: records.length };
}

function inspectorBucketsToLotRows(agg: ReturnType<typeof aggregateInspectorInventory>): CleanLotCSVResult {
  const { buckets, nonFunctional, issues, inputRows } = agg;
  const cleaned: LotCSVRow[] = [];

  for (const b of Array.from(buckets.values())) {
    const avgPrice = Math.max(1000, Math.round(b.priceSum / Math.max(1, b.count)));
    cleaned.push({
      brand: b.brand,
      model: b.model,
      generation: b.generation,
      processor: b.processor,
      ramGb: b.ramGb,
      storageGb: b.storageGb,
      storageType: b.storageType,
      displayInch: b.displayInch,
      os: "Windows 11 Pro",
      condition: toLotItemCondition(b.conditionLabel),
      count: b.count,
      unitPrice: avgPrice,
      notes: buildInspectionStatusNotes(b),
      cosmeticSummary: b.cosmetic,
      functionalCount: b.dead ? 0 : b.count,
      nonFunctionalCount: b.dead ? b.count : 0,
    });
  }

  const flagged = issues.length;
  return {
    cleaned,
    issues,
    stats: {
      total: cleaned.length,
      cleaned: cleaned.length,
      flagged,
      totalRowsInput: inputRows,
      totalFunctional: cleaned.reduce((s, r) => s + (r.functionalCount ?? 0), 0),
      totalNonFunctional: nonFunctional.reduce((s, x) => s + x.count, 0),
      groupsCreated: cleaned.length,
      format: "A",
    },
    format: "A",
    nonFunctional,
  };
}

function inspectorBucketsToAsAsRows(agg: ReturnType<typeof aggregateInspectorInventory>): {
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
    notes?: string;
  }>;
  issues: string[];
} {
  const { buckets, issues } = agg;
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
    notes?: string;
  }> = [];

  for (const b of Array.from(buckets.values())) {
    const avg = Math.max(500, Math.round(b.priceSum / Math.max(1, b.count)));
    rows.push({
      brand: b.brand,
      model: b.model,
      generation: b.generation,
      processor: b.processor,
      ramGb: b.ramGb,
      storageGb: b.storageGb,
      storageType: b.storageType,
      condition: toLotItemCondition(b.conditionLabel),
      count: b.count,
      estimatedValue: avg,
      notes: buildInspectionStatusNotes(b),
    });
  }

  return { rows, issues };
}

const LOT_PROMPT = `You are a data cleaning assistant for a B2B laptop marketplace called Rentfoxxy.
Raw CSV data from a vendor lot upload is below.

Rules:
1. Trim all whitespace from every field value.
2. Condition field: standardise to EXACTLY one of these human-readable values (case-sensitive):
   "Brand New" | "Refurb A+" | "Refurb A" | "Refurb B" | "Refurb C" | "Refurb D"
   Vendor letter grades: A→Refurb A+, B→Refurb A, C→Refurb B, D→Refurb C, E→Refurb D
   Mappings: "new"/"sealed"/"factory new" → "Brand New"
             "a+"/"grade a+"/"like new"/"open box" → "Refurb A+"
             "a"/"grade a"/"lightly used" → "Refurb A"
             "b"/"grade b"/"used"/"good" → "Refurb B"
             "c"/"grade c" → "Refurb C"
             "d"/"grade d" → "Refurb C"
             "e"/"grade e" → "Refurb D"
             "poor"/"heavy use"/"as is" (no grade) → "Refurb C" or "Refurb D" as fits
3. RAM_GB / ramGb: integer (strip "GB", "gb").
4. Storage_GB / storageGb: integer; if TB, multiply by 1024.
5. storageType: "SSD" | "HDD" | "eMMC" | "NVMe SSD" ("nvme"/"m.2" → "NVMe SSD").
6. OS: "win11"/"windows 11" → "Windows 11 Pro", "win10" → "Windows 10 Pro", "macos" → "macOS"; keep sensible others.
7. Brand: proper case — Dell, HP, Lenovo, Apple, Acer, ASUS, MSI.
8. displayInch: decimal; strip "inch" / quotes.
9. count: positive integer — flag in issues if <= 0.
10. unitPrice: positive number — flag if <= 0 or missing.
11. Required: Brand, Model, Condition, Count, Unit_Price (unitPrice). Missing → issues.

If the CSV is per-unit (many rows, Grade/Status columns), set "format":"A", group rows, add "nonFunctional" for dead units, and include "cosmeticSummary"/"functionalCount"/"nonFunctionalCount" per group when applicable.

Return ONLY valid JSON (no markdown):
{
  "format": "A" | "B",
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
    "notes": string,
    "cosmeticSummary": string,
    "functionalCount": number,
    "nonFunctionalCount": number
  }],
  "nonFunctional": [{ "brand": string, "model": string, "count": number, "reason": string }],
  "issues": ["row N: ..."],
  "stats": { "total": number, "cleaned": number, "flagged": number, "totalRowsInput": number, "totalFunctional": number, "totalNonFunctional": number, "groupsCreated": number, "format": string }
}

RAW CSV:
`;

const ASAS_PROMPT = `You are a data cleaning assistant for Rentfoxxy As-Available-As-Is (AsAs) inventory CSV.
Rules mirror lot cleaning but each row has estimatedValue (INR) instead of unitPrice/displayInch/os.
Condition values must be exactly one of: "Brand New" | "Refurb A+" | "Refurb A" | "Refurb B" | "Refurb C" | "Refurb D" (vendor grade E → Refurb D; grade D → Refurb C).
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

export async function cleanLotCSV(rawCSVContent: string): Promise<CleanLotCSVResult> {
  const model = getModel();
  if (!model) {
    return heuristicLotClean(rawCSVContent);
  }

  const prompt = LOT_PROMPT + rawCSVContent.slice(0, 120_000);
  const result = await model.generateContent(prompt);
  const text = stripJsonFence(result.response.text());
  try {
    const parsed = JSON.parse(text) as {
      format?: "A" | "B";
      cleaned: Record<string, unknown>[];
      issues: string[];
      nonFunctional?: NonFunctionalUnit[];
      stats: {
        total: number;
        cleaned: number;
        flagged: number;
        totalRowsInput?: number;
        totalFunctional?: number;
        totalNonFunctional?: number;
        groupsCreated?: number;
        format?: string;
      };
    };
    const cleaned = (parsed.cleaned ?? []).map(normalizeLotRow).filter((r) => r.brand && r.model);
    if (cleaned.length === 0) {
      return heuristicLotClean(rawCSVContent);
    }
    const baseStats = parsed.stats ?? {
      total: cleaned.length,
      cleaned: cleaned.length,
      flagged: (parsed.issues ?? []).length,
    };
    return {
      cleaned,
      issues: parsed.issues ?? [],
      stats: {
        ...baseStats,
        totalRowsInput: baseStats.totalRowsInput ?? baseStats.total,
        totalFunctional: baseStats.totalFunctional,
        totalNonFunctional: baseStats.totalNonFunctional,
        groupsCreated: baseStats.groupsCreated ?? cleaned.length,
        format: baseStats.format ?? parsed.format ?? "B",
      },
      format: parsed.format ?? "B",
      nonFunctional: Array.isArray(parsed.nonFunctional) ? parsed.nonFunctional : [],
    };
  } catch {
    return heuristicLotClean(rawCSVContent);
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
    let cleaned = (parsed.cleaned ?? []).map(normalizeAsAsRow).filter((r) => r.brand && r.model);
    if (cleaned.length === 0) {
      const fb = cleanAsAsCSV(rawCSVContent);
      cleaned = fb.rows.map((r) => ({
        ...r,
        condition: toLotItemCondition(r.condition),
      }));
      return {
        cleaned,
        issues: fb.issues,
        stats: {
          total: cleaned.length,
          cleaned: cleaned.length,
          flagged: fb.issues.length,
        },
      };
    }
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
    const fb = cleanAsAsCSV(rawCSVContent);
    const cleaned = fb.rows.map((r) => ({
      ...r,
      condition: toLotItemCondition(r.condition),
    }));
    return {
      cleaned,
      issues: fb.issues,
      stats: { total: cleaned.length, cleaned: cleaned.length, flagged: fb.issues.length },
    };
  }
}

function heuristicLotClean(raw: string): CleanLotCSVResult {
  const { records, fields } = parseCsvRecords(raw);
  if (records.length === 0) {
    return {
      cleaned: [],
      issues: ["No data rows"],
      stats: { total: 0, cleaned: 0, flagged: 0 },
      format: "B",
      nonFunctional: [],
    };
  }

  if (isInspectorInventorySheetFormat(fields)) {
    const agg = aggregateInspectorInventory(records);
    if (agg.buckets.size === 0) {
      return {
        cleaned: [],
        issues: agg.issues.length ? agg.issues : ["No valid rows — check Grade, Make, Model columns"],
        stats: { total: 0, cleaned: 0, flagged: agg.issues.length },
        format: "B",
        nonFunctional: [],
      };
    }
    return inspectorBucketsToLotRows(agg);
  }

  const cleaned: LotCSVRow[] = [];
  const issues: string[] = [];
  let rowNum = 0;
  for (const row of records) {
    rowNum++;
    const brand = pickField(row, "brand");
    const modelName = pickField(row, "model");
    const conditionRaw = pickField(row, "condition");
    const count = parseInt(pickField(row, "count"), 10) || 0;
    const unitPrice = parseFloat(pickField(row, "unit_price", "unit price", "unitprice")) || 0;
    if (!brand || !modelName) {
      issues.push(`Row ${rowNum}: missing brand/model`);
      continue;
    }
    if (count <= 0 || unitPrice <= 0) issues.push(`Row ${rowNum}: invalid count or price`);
    cleaned.push({
      brand,
      model: modelName,
      generation: pickField(row, "generation") || null,
      processor: pickField(row, "processor") || "—",
      ramGb: parseInt(pickField(row, "ram_gb", "ram gb"), 10) || 0,
      storageGb: parseInt(pickField(row, "storage_gb", "storage gb"), 10) || 0,
      storageType: pickField(row, "storagetype", "storage_type", "storage type") || "SSD",
      displayInch: parseFloat(pickField(row, "display_inch", "display inch")) || 14,
      os: pickField(row, "os") || "Windows 11 Pro",
      condition: toLotItemCondition(conditionRaw || "Refurb B"),
      count: Math.max(0, count),
      unitPrice: Math.max(0, unitPrice),
      notes: pickField(row, "notes") || null,
    });
  }
  const flagged = issues.length;
  return {
    cleaned,
    issues,
    stats: { total: cleaned.length, cleaned: cleaned.length, flagged },
    format: "B" as const,
    nonFunctional: [] as NonFunctionalUnit[],
  };
}

export type LotNameAiResult = { name: string; description: string; highlights: string[] };

export async function generateLotName(items: LotCSVRow[]): Promise<LotNameAiResult> {
  const model = getModel();
  const totalUnits = items.reduce((s, i) => s + Math.max(0, Math.floor(i.count)), 0);
  const brands = Array.from(new Set(items.map((i) => i.brand)));
  const conditions = Array.from(
    new Set(items.map((i) => lotConditionToLabel(toLotItemCondition(i.condition)))),
  );
  const avgPrice =
    totalUnits > 0
      ? Math.round(items.reduce((s, i) => s + i.unitPrice * Math.max(0, Math.floor(i.count)), 0) / totalUnits)
      : 0;

  if (!model || totalUnits <= 0) {
    return {
      name: `${brands.slice(0, 2).join(" & ")} Laptop Lot — ${totalUnits} Units`,
      description: `Verified bulk lot of ${totalUnits} laptops. ${conditions.join(", ")} grade. GST invoice included.`,
      highlights: ["Verified by Rentfoxxy team", `${brands.slice(0, 2).join(" + ")} mix`, "GST invoice included"],
    };
  }

  const prompt = `You are naming a bulk laptop lot listing for Rentfoxxy, a B2B marketplace.
Generate a professional, concise listing title and description.
Inventory summary:
- Total units: ${totalUnits}
- Brands: ${brands.join(", ")}
- Conditions: ${conditions.join(", ")}
- Average unit price: ₹${avgPrice.toLocaleString("en-IN")}
- Full breakdown: ${JSON.stringify(items.slice(0, 20))}
Rules:
- Title: max 70 chars. Format: "[Brands] Business Laptop Lot — [Units] units, [Condition range]"
- Description: 1-2 sentences max, 120 chars max. Factual, professional, B2B tone.
- Highlights: 3 strings max, each under 40 chars.
Return ONLY valid JSON (no markdown):
{ "name": "...", "description": "...", "highlights": ["...", "...", "..."] }`;

  const result = await model.generateContent(prompt);
  const text = stripJsonFence(result.response.text());
  try {
    const p = JSON.parse(text) as LotNameAiResult;
    return {
      name: p.name,
      description: p.description,
      highlights: Array.isArray(p.highlights) ? p.highlights.slice(0, 5) : [],
    };
  } catch {
    return {
      name: `${brands.slice(0, 2).join(" & ")} Business Laptop Lot — ${totalUnits} Units, ${conditions[0] ?? "Mixed"} to ${conditions[conditions.length - 1] ?? "Mixed"}`,
      description: `Verified bulk lot of ${totalUnits} laptops. ${conditions.join(", ")} grade. GST invoice included.`,
      highlights: ["Verified by Rentfoxxy team", `${brands.slice(0, 2).join(" + ")} mix`, "GST invoice included"],
    };
  }
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
    notes?: string | null;
  }>;
  issues: string[];
} {
  const { records, fields } = parseCsvRecords(raw);
  const issues: string[] = [];
  if (records.length === 0) return { rows: [], issues: ["Empty CSV"] };

  if (isInspectorInventorySheetFormat(fields)) {
    const agg = aggregateInspectorInventory(records);
    if (agg.buckets.size === 0) {
      return {
        rows: [],
        issues: agg.issues.length ? agg.issues : ["No valid rows — check Grade, Make, Model columns"],
      };
    }
    return inspectorBucketsToAsAsRows(agg);
  }

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
    notes?: string | null;
  }> = [];

  let rowNum = 0;
  for (const row of records) {
    rowNum++;
    const brand = pickField(row, "brand");
    const model = pickField(row, "model");
    const count = parseInt(pickField(row, "count"), 10) || 0;
    const ev = parseFloat(pickField(row, "estimated_value_inr", "estimated value inr", "estimatedvalue")) || 0;
    if (!brand || !model) {
      issues.push(`Row ${rowNum}: missing brand/model`);
      continue;
    }
    rows.push({
      brand,
      model,
      generation: pickField(row, "generation") || null,
      processor: pickField(row, "processor") || "—",
      ramGb: parseInt(pickField(row, "ram_gb", "ram gb"), 10) || 0,
      storageGb: parseInt(pickField(row, "storage_gb", "storage gb"), 10) || 0,
      storageType: pickField(row, "storagetype", "storage_type", "storage type") || "SSD",
      condition: toLotItemCondition(pickField(row, "condition") || "Refurb B"),
      count,
      estimatedValue: ev,
      notes:
        (() => {
          const n = pickField(row, "notes", "status", "status_notes", "inspection status");
          return n ? n.slice(0, 8000) : null;
        })(),
    });
  }
  return { rows, issues };
}
