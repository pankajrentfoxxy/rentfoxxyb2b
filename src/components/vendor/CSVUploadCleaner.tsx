"use client";

import type { AsAsCSVRow, LotCSVRow, NonFunctionalUnit } from "@/lib/lot-ai-cleaner";
import { lotConditionToLabel, toLotItemCondition } from "@/lib/lot-ai-cleaner";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import Papa from "papaparse";
import { useCallback, useState } from "react";
import * as XLSX from "xlsx";

const MAX_BYTES = 10 * 1024 * 1024;

type Stage = "IDLE" | "RAW_PREVIEW" | "CLEANING" | "FINALIZING" | "DIFF_PREVIEW" | "CONFIRMED";

export type CSVUploadMode = "lot" | "asas";

export interface CSVUploadCleanerProps {
  apiEndpoint: string;
  templateUrl: string;
  mode: CSVUploadMode;
  onConfirmed: (data: LotCSVRow[] | AsAsCSVRow[], uploadedCsvSnapshot?: string) => void;
  onReset?: () => void;
  /** Runs after AI clean, before success UI (e.g. AsAs name generation). */
  beforeConfirm?: (data: LotCSVRow[] | AsAsCSVRow[]) => Promise<void>;
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: number;
  tone: "blue" | "green" | "amber";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-900 border-blue-100",
    green: "bg-emerald-50 text-emerald-900 border-emerald-100",
    amber: "bg-amber-50 text-amber-900 border-amber-100",
  } as const;
  return (
    <div className={`rounded-xl border px-3 py-3 text-center ${tones[tone]}`}>
      <p className="text-lg font-bold">
        {icon} {value}
      </p>
      <p className="text-xs font-medium opacity-80">{label}</p>
    </div>
  );
}

async function parseInventoryFile(file: File): Promise<{ rows: Record<string, string>[]; rawText: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { rows: [], rawText: "" };
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const rows = data.map((row) => {
      const o: Record<string, string> = {};
      for (const k of Object.keys(row)) {
        o[k] = String((row as Record<string, unknown>)[k] ?? "");
      }
      return o;
    });
    const rawText = XLSX.utils.sheet_to_csv(sheet);
    return { rows, rawText };
  }
  const rawText = await file.text();
  const parsed = Papa.parse<Record<string, string>>(rawText, {
    header: true,
    skipEmptyLines: true,
  });
  return { rows: parsed.data, rawText };
}

function conditionBadgeClass(mode: CSVUploadMode, conditionLabel: string): string {
  if (mode === "asas") {
    return "bg-slate-100 text-slate-700";
  }
  const c = conditionLabel;
  if (c === "Brand New") return "bg-green-600 text-white";
  if (c === "Refurb A+") return "bg-blue-600 text-white";
  if (c === "Refurb A") return "bg-purple-600 text-white";
  if (c === "Refurb B") return "bg-yellow-600 text-white";
  if (c === "Refurb C") return "bg-red-500 text-white";
  if (c === "Refurb D") return "bg-orange-600 text-white";
  return "bg-slate-600 text-white";
}

export function CSVUploadCleaner({
  apiEndpoint,
  templateUrl,
  mode,
  onConfirmed,
  onReset,
  beforeConfirm,
}: CSVUploadCleanerProps) {
  const [stage, setStage] = useState<Stage>("IDLE");
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [rawText, setRawText] = useState("");
  const [cleanedLot, setCleanedLot] = useState<LotCSVRow[]>([]);
  const [cleanedAsAs, setCleanedAsAs] = useState<AsAsCSVRow[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    cleaned: number;
    flagged: number;
    totalFunctional?: number;
    totalNonFunctional?: number;
    groupsCreated?: number;
  }>({ total: 0, cleaned: 0, flagged: 0 });
  const [csvFormat, setCsvFormat] = useState<"A" | "B" | null>(null);
  const [nonFunctionalUnits, setNonFunctionalUnits] = useState<NonFunctionalUnit[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStage("IDLE");
    setRawRows([]);
    setRawText("");
    setCleanedLot([]);
    setCleanedAsAs([]);
    setIssues([]);
    setStats({ total: 0, cleaned: 0, flagged: 0 });
    setCsvFormat(null);
    setNonFunctionalUnits([]);
    setFileName("");
    setError(null);
    onReset?.();
  }, [onReset]);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("File too large (max 10MB)");
      return;
    }
    setFileName(file.name);
    try {
      const { rows, rawText: text } = await parseInventoryFile(file);
      if (!rows.length) {
        setError("No rows found in file");
        return;
      }
      setRawRows(rows);
      setRawText(text);
      setStage("RAW_PREVIEW");
    } catch {
      setError("Could not read file");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) void processFile(f);
    },
    [processFile],
  );

  const handleClean = async () => {
    if (!rawText.trim()) return;
    setStage("CLEANING");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", new Blob([rawText], { type: "text/csv" }), fileName || "upload.csv");
      const res = await fetch(apiEndpoint, { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : await res.text());
      }
      if (mode === "lot") {
        const lotData = data as {
          cleaned?: LotCSVRow[];
          issues?: string[];
          stats?: {
            total: number;
            cleaned: number;
            flagged: number;
            totalFunctional?: number;
            totalNonFunctional?: number;
            groupsCreated?: number;
          };
          format?: "A" | "B";
          nonFunctional?: NonFunctionalUnit[];
        };
        setCleanedLot((lotData.cleaned ?? []) as LotCSVRow[]);
        setCsvFormat(lotData.format === "A" || lotData.format === "B" ? lotData.format : null);
        setNonFunctionalUnits(Array.isArray(lotData.nonFunctional) ? lotData.nonFunctional : []);
      } else {
        setCleanedAsAs((data.cleaned ?? []) as AsAsCSVRow[]);
        setCsvFormat(null);
        setNonFunctionalUnits([]);
      }
      setIssues(Array.isArray(data.issues) ? data.issues : []);
      setStats(
        (mode === "lot" ? (data as { stats?: typeof stats }).stats : data.stats) ?? {
          total: (data.cleaned ?? []).length,
          cleaned: (data.cleaned ?? []).length,
          flagged: Array.isArray(data.issues) ? data.issues.length : 0,
        },
      );
      setStage("DIFF_PREVIEW");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clean failed");
      setStage("RAW_PREVIEW");
    }
  };

  const handleLooksGood = async () => {
    const lot = cleanedLot;
    const as = cleanedAsAs;
    setError(null);
    try {
      if (beforeConfirm) {
        setStage("FINALIZING");
        if (mode === "lot") await beforeConfirm(lot);
        else await beforeConfirm(as);
      }
      const snap = rawText.trim() ? rawText : undefined;
      if (mode === "lot") onConfirmed(lot, snap);
      else onConfirmed(as, snap);
      setStage("CONFIRMED");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finalize");
      setStage("DIFF_PREVIEW");
    }
  };

  const cleanedRows = mode === "lot" ? cleanedLot : cleanedAsAs;
  const showCosmeticCol =
    mode === "lot" && cleanedLot.some((r) => (r.cosmeticSummary ?? "").trim().length > 0);

  return (
    <div className="space-y-4">
      {stage === "IDLE" ? (
        <div
          className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-10 text-center transition-colors hover:border-accent"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="mb-3 text-5xl">📁</div>
          <h3 className="mb-1 text-lg font-semibold text-primary">Upload your inventory file</h3>
          <p className="mb-4 text-sm text-muted">Supported: .csv or .xlsx · max 10MB</p>
          <input
            type="file"
            id="csv-upload-cleaner"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void processFile(f);
            }}
          />
          <label
            htmlFor="csv-upload-cleaner"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            Choose file
          </label>
          <div className="mt-4">
            <a
              href={templateUrl}
              download
              className="text-sm text-accent underline hover:no-underline"
            >
              Download CSV template
            </a>
          </div>
        </div>
      ) : null}

      {stage === "RAW_PREVIEW" ? (
        <div>
          <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">{fileName}</span>
              <span className="text-xs text-muted">({rawRows.length} rows)</span>
            </div>
            <button type="button" onClick={reset} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          </div>
          <p className="mb-2 text-sm font-medium text-slate-600">Raw preview (first 10 rows)</p>
          <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-100">
                <tr>
                  {Object.keys(rawRows[0] ?? {}).map((col) => (
                    <th key={col} className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-600">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawRows.slice(0, 10).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="whitespace-nowrap px-3 py-2 text-slate-700">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rawRows.length > 10 ? (
            <p className="mb-4 text-xs text-muted">+ {rawRows.length - 10} more rows not shown</p>
          ) : null}
          {error ? (
            <div className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Cleaning failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void handleClean()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-semibold text-white transition hover:opacity-95"
          >
            <Sparkles className="h-5 w-5" />
            Clean &amp; standardise with AI
          </button>
        </div>
      ) : null}

      {stage === "CLEANING" || stage === "FINALIZING" ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-primary">
              {stage === "FINALIZING" ? "Finalising…" : "AI is cleaning your data…"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {stage === "FINALIZING"
                ? "Generating listing details"
                : "Standardising conditions and validating fields"}
            </p>
          </div>
        </div>
      ) : null}

      {stage === "DIFF_PREVIEW" ? (
        <div className="space-y-4">
          {csvFormat === "A" ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
              <strong>Format A</strong> detected — rows include functional / non-functional splits where provided. Grade
              E maps to <strong>Refurb D</strong> in our catalogue.
            </div>
          ) : null}
          {csvFormat === "B" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
              <strong>Format B</strong> — standard line-item layout (no functional split columns in file).
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon="📊" label="Total rows" value={stats.total} tone="blue" />
            <StatCard icon="✅" label="Cleaned" value={stats.cleaned} tone="green" />
            <StatCard icon="⚠️" label="Issues" value={stats.flagged} tone="amber" />
          </div>
          {typeof stats.totalFunctional === "number" || typeof stats.totalNonFunctional === "number" ? (
            <div className="grid grid-cols-2 gap-3 text-center text-sm">
              {typeof stats.totalFunctional === "number" ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 py-2 font-medium text-emerald-900">
                  Functional units (est.): {stats.totalFunctional}
                </div>
              ) : null}
              {typeof stats.totalNonFunctional === "number" ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50/80 py-2 font-medium text-rose-900">
                  Non-functional units (est.): {stats.totalNonFunctional}
                </div>
              ) : null}
            </div>
          ) : null}
          {issues.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 flex items-center gap-2 font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4" /> Issues ({issues.length})
              </p>
              <ul className="space-y-1 text-sm text-amber-900">
                {issues.slice(0, 40).map((issue, i) => (
                  <li key={i} className="flex gap-2">
                    <span>•</span> {issue}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {mode === "lot" && nonFunctionalUnits.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-rose-200 bg-rose-50/50">
              <p className="border-b border-rose-100 px-3 py-2 text-sm font-semibold text-rose-950">
                Non-functional units (detail)
              </p>
              <table className="w-full text-xs">
                <thead className="bg-rose-100/80">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-rose-950">Brand</th>
                    <th className="px-3 py-2 text-left font-medium text-rose-950">Model</th>
                    <th className="px-3 py-2 text-left font-medium text-rose-950">Count</th>
                    <th className="px-3 py-2 text-left font-medium text-rose-950">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {nonFunctionalUnits.map((u, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-rose-50/80"}>
                      <td className="px-3 py-2">{u.brand}</td>
                      <td className="px-3 py-2">{u.model}</td>
                      <td className="px-3 py-2 font-medium">{u.count}</td>
                      <td className="max-w-xs px-3 py-2 text-rose-900">{u.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <p className="text-sm font-semibold text-slate-700">AI-cleaned data</p>
          <div className="overflow-x-auto rounded-xl border border-emerald-200">
            <table className="w-full text-xs">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-emerald-900">Brand</th>
                  <th className="px-3 py-2 text-left font-medium text-emerald-900">Model</th>
                  <th className="px-3 py-2 text-left font-medium text-emerald-900">Processor</th>
                  <th className="px-3 py-2 text-left font-medium text-emerald-900">RAM</th>
                  <th className="px-3 py-2 text-left font-medium text-emerald-900">Storage</th>
                  {showCosmeticCol ? (
                    <th className="px-3 py-2 text-left font-medium text-emerald-900">Cosmetic</th>
                  ) : null}
                  <th className="px-3 py-2 text-left font-medium text-emerald-900">Condition</th>
                  <th className="px-3 py-2 text-left font-medium text-emerald-900">Count</th>
                  <th className="px-3 py-2 text-left font-medium text-emerald-900">
                    {mode === "lot" ? "Unit ₹" : "Est. ₹"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {cleanedRows.map((row, i) => {
                  const condLabel = lotConditionToLabel(toLotItemCondition(row.condition));
                  const price =
                    mode === "lot"
                      ? (row as LotCSVRow).unitPrice
                      : (row as AsAsCSVRow).estimatedValue;
                  const lotRow = row as LotCSVRow;
                  return (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-emerald-50/50"}>
                      <td className="px-3 py-2">{row.brand}</td>
                      <td className="px-3 py-2">{row.model}</td>
                      <td className="px-3 py-2">{row.processor}</td>
                      <td className="px-3 py-2">{row.ramGb}GB</td>
                      <td className="px-3 py-2">
                        {row.storageGb}GB {row.storageType}
                      </td>
                      {showCosmeticCol ? (
                        <td className="max-w-[140px] px-3 py-2 text-slate-700">
                          {(lotRow.cosmeticSummary ?? "").trim() || "—"}
                        </td>
                      ) : null}
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${conditionBadgeClass(mode, condLabel)}`}
                        >
                          {condLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium">{row.count}</td>
                      <td className="px-3 py-2 font-medium">
                        ₹{Number(price).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-xl border border-slate-300 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Upload different file
            </button>
            <button
              type="button"
              onClick={() => void handleLooksGood()}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle className="h-5 w-5" />
              Looks good — use this data
            </button>
          </div>
        </div>
      ) : null}

      {stage === "CONFIRMED" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
          <p className="text-lg font-semibold text-emerald-900">Data confirmed</p>
          <p className="mt-1 text-sm text-emerald-800">
            {cleanedRows.length} line items ·{" "}
            {cleanedRows.reduce((s, r) => s + r.count, 0)} total units
          </p>
          <button type="button" onClick={reset} className="mt-3 text-xs text-emerald-700 underline hover:no-underline">
            Re-upload different file
          </button>
        </div>
      ) : null}
    </div>
  );
}
