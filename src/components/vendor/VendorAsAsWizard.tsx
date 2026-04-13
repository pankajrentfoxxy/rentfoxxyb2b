"use client";

import { CSVUploadCleaner } from "@/components/vendor/CSVUploadCleaner";
import type { AsAsCSVRow } from "@/lib/lot-ai-cleaner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  brand: string;
  model: string;
  generation?: string | null;
  processor: string;
  ramGb: number;
  storageGb: number;
  storageType: string;
  condition: string;
  count: number;
  estimatedValue: number;
  notes?: string | null;
};

export function VendorAsAsWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [generating, setGenerating] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [aiHighlights, setAiHighlights] = useState<string[]>([]);
  const [suggestedLotCount, setSuggestedLotCount] = useState(0);
  const [avgUnitPrice, setAvgUnitPrice] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedCsvSnapshot, setUploadedCsvSnapshot] = useState("");

  async function runGenerate(data: Row[]) {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/asas/generate-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: data.map((x) => ({
            brand: x.brand,
            model: x.model,
            condition: x.condition,
            count: x.count,
            estimatedValue: x.estimatedValue,
          })),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "Name generation failed");
      setAiTitle(j.name ?? "");
      setAiDescription(j.description ?? "");
      setAiHighlights(Array.isArray(j.highlights) ? j.highlights : []);
      setSuggestedLotCount(j.suggestedLotCount ?? 0);
      setAvgUnitPrice(j.avgUnitPrice ?? 0);
      setTotalValue(j.totalValue ?? 0);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/asas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: aiTitle.trim(),
          description: aiDescription.trim() || null,
          highlights: aiHighlights,
          avgUnitPrice,
          totalValue,
          aiSuggestedLots: suggestedLotCount,
          items: rows,
          uploadedCsvSnapshot: uploadedCsvSnapshot.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submit failed");
        return;
      }
      router.push("/vendor/asas/new?done=1");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-2 text-sm font-medium text-slate-600">
        <span className={step === 1 ? "text-teal-800" : ""}>1. Upload</span>
        <span>→</span>
        <span className={step === 2 ? "text-teal-800" : ""}>2. AI details</span>
        <span>→</span>
        <span className={step === 3 ? "text-teal-800" : ""}>3. Review</span>
      </div>

      {step === 1 ? (
        <div className="space-y-4 rounded-xl border border-teal-100 bg-white p-6">
          <div>
            <h2 className="text-xl font-bold text-primary">Upload AsAs inventory</h2>
            <p className="mt-1 text-sm text-muted">
              Template:{" "}
              <Link href="/templates/asas_upload_template.csv" className="font-medium text-accent hover:underline">
                asas_upload_template.csv
              </Link>
            </p>
          </div>
          <CSVUploadCleaner
            mode="asas"
            apiEndpoint="/api/vendor/asas/clean-csv"
            templateUrl="/templates/asas_upload_template.csv"
            onConfirmed={(data, snap) => {
              const r = data as AsAsCSVRow[];
              const normalized: Row[] = r.map((x) => ({
                brand: x.brand,
                model: x.model,
                generation: x.generation ?? null,
                processor: x.processor,
                ramGb: x.ramGb,
                storageGb: x.storageGb,
                storageType: x.storageType,
                condition: String(x.condition),
                count: x.count,
                estimatedValue: x.estimatedValue,
                notes: x.notes ?? null,
              }));
              setRows(normalized);
              setUploadedCsvSnapshot(snap ?? "");
              void runGenerate(normalized);
            }}
            onReset={() => {
              setRows([]);
              setUploadedCsvSnapshot("");
              setAiTitle("");
              setAiDescription("");
              setAiHighlights([]);
            }}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6 rounded-xl border border-teal-100 bg-white p-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-primary">
              <span aria-hidden>🤖</span> AI-generated listing details
            </h2>
            <p className="mt-1 text-sm text-muted">Edit as needed before review.</p>
          </div>
          {generating ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700" />
              <p className="text-sm text-muted">Generating title and description…</p>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-semibold text-primary">Title</label>
                <input
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  maxLength={80}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-primary">Description</label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  rows={3}
                  maxLength={300}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-primary">Highlights</label>
                <div className="flex flex-wrap gap-2">
                  {aiHighlights.map((h, i) => (
                    <div
                      key={`${h}-${i}`}
                      className="flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1.5 text-sm text-purple-900"
                    >
                      <span>{h}</span>
                      <button
                        type="button"
                        onClick={() => setAiHighlights((hs) => hs.filter((_, j) => j !== i))}
                        className="text-xs text-purple-600 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {aiHighlights.length < 5 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const val = window.prompt("Highlight (max 40 chars):");
                        if (val && val.length <= 40) setAiHighlights((h) => [...h, val.trim()]);
                      }}
                      className="rounded-full border border-dashed px-3 py-1.5 text-xs text-muted"
                    >
                      + Add
                    </button>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void runGenerate(rows)}
                className="text-xs text-muted underline hover:text-purple-700"
              >
                Regenerate with AI
              </button>
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-slate-300 py-3 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!aiTitle.trim()}
                  onClick={() => setStep(3)}
                  className="flex-[2] rounded-xl bg-purple-700 px-8 py-3 font-semibold text-white disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4 rounded-xl border border-teal-100 bg-white p-6">
          <p className="text-sm text-slate-700">
            <strong>{rows.length}</strong> lines · <strong>{rows.reduce((s, r) => s + r.count, 0)}</strong> units · ~₹
            {avgUnitPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/unit
          </p>
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="font-semibold">{aiTitle}</p>
            <p className="mt-1 text-sm text-muted">{aiDescription}</p>
          </div>
          <button type="button" className="text-sm text-accent hover:underline" onClick={() => setStep(2)}>
            ← Edit details
          </button>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit()}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit for verification"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
