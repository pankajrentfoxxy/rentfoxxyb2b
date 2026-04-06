"use client";

import { CSVUploadCleaner } from "@/components/vendor/CSVUploadCleaner";
import type { LotCSVRow } from "@/lib/lot-ai-cleaner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VendorLotWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lotSize, setLotSize] = useState(10);
  const [cleaned, setCleaned] = useState<LotCSVRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          lotSize,
          items: cleaned,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submit failed");
        return;
      }
      setStep(4);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex gap-2 text-sm font-medium text-slate-600">
        <span className={step === 1 ? "text-teal-800" : ""}>1. Details</span>
        <span>→</span>
        <span className={step === 2 ? "text-teal-800" : ""}>2. Upload CSV</span>
        <span>→</span>
        <span className={step === 3 ? "text-teal-800" : ""}>3. Review</span>
        <span>→</span>
        <span className={step === 4 ? "text-teal-800" : ""}>4. Done</span>
      </div>

      {step === 1 ? (
        <div className="space-y-4 rounded-xl border border-teal-100 bg-white p-6">
          <p className="text-sm text-muted">
            Template:{" "}
            <Link href="/templates/lot_upload_template.csv" className="font-medium text-accent hover:underline">
              lot_upload_template.csv
            </Link>
          </p>
          <label className="block text-sm font-medium text-slate-800">Title</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Corporate Dell / HP mix"
          />
          <label className="block text-sm font-medium text-slate-800">Description</label>
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="block text-sm font-medium text-slate-800">Lot size (units per lot)</label>
          <input
            type="number"
            min={1}
            className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={lotSize}
            onChange={(e) => setLotSize(Number(e.target.value) || 1)}
          />
          <button
            type="button"
            disabled={!title.trim()}
            onClick={() => setStep(2)}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Continue to upload →
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4 rounded-xl border border-teal-100 bg-white p-6">
          <div>
            <h2 className="text-xl font-bold text-primary">Upload inventory file</h2>
            <p className="mt-1 text-sm text-muted">We clean and standardise with AI before you submit.</p>
          </div>
          <CSVUploadCleaner
            mode="lot"
            apiEndpoint="/api/vendor/lots/clean-csv"
            templateUrl="/templates/lot_upload_template.csv"
            onConfirmed={(data) => {
              setCleaned(data as LotCSVRow[]);
              setStep(3);
            }}
            onReset={() => setCleaned([])}
          />
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm font-medium text-accent hover:underline"
          >
            ← Back to details
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4 rounded-xl border border-teal-100 bg-white p-6">
          <p className="text-sm text-slate-700">
            <strong>{cleaned.length}</strong> line items ·{" "}
            <strong>{cleaned.reduce((s, r) => s + r.count, 0)}</strong> total units
          </p>
          <button type="button" className="text-sm font-medium text-accent hover:underline" onClick={() => setStep(2)}>
            ← Edit upload
          </button>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="button"
            disabled={loading || cleaned.length === 0}
            onClick={() => void submit()}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit for verification"}
          </button>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
          <p className="font-semibold">Lot submitted</p>
          <p className="mt-2 text-sm">Our team will verify before it goes live.</p>
          <Link href="/vendor/lots" className="mt-4 inline-block text-sm font-medium text-teal-800 hover:underline">
            View lots →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
