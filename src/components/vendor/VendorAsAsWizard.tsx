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
};

export function VendorAsAsWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<{
    name: string;
    description: string;
    highlights: string[];
    suggestedLotCount: number;
    avgUnitPrice: number;
    totalValue: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!meta) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/asas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meta.name,
          description: meta.description,
          highlights: meta.highlights,
          avgUnitPrice: meta.avgUnitPrice,
          totalValue: meta.totalValue,
          aiSuggestedLots: meta.suggestedLotCount,
          items: rows,
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
            beforeConfirm={async (data) => {
              const r = data as AsAsCSVRow[];
              const res = await fetch("/api/vendor/asas/generate-name", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: r.map((x) => ({
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
              setMeta({
                name: j.name,
                description: j.description,
                highlights: j.highlights ?? [],
                suggestedLotCount: j.suggestedLotCount ?? 0,
                avgUnitPrice: j.avgUnitPrice,
                totalValue: j.totalValue,
              });
            }}
            onConfirmed={(data) => {
              setRows(data as Row[]);
              setStep(2);
            }}
            onReset={() => {
              setRows([]);
              setMeta(null);
            }}
          />
        </div>
      ) : null}

      {step === 2 && meta ? (
        <div className="space-y-4 rounded-xl border border-teal-100 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">{meta.name}</h2>
          <p className="text-sm text-slate-700">{meta.description}</p>
          <p className="text-xs text-muted">
            ~₹{meta.avgUnitPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })} / unit ·{" "}
            {rows.reduce((s, r) => s + r.count, 0)} units
          </p>
          <button type="button" className="text-sm text-accent hover:underline" onClick={() => setStep(1)}>
            ← Back
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
