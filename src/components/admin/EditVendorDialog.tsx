"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { VendorStatus } from "@prisma/client";
import {
  Activity,
  Building2,
  ChevronDown,
  CreditCard,
  Hash,
  Landmark,
  Loader2,
  Lock,
  Mail,
  Percent,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const BRAND_COLOR = "bg-amber-600";
const BRAND_TEXT = "text-amber-600";
const BRAND_RING = "focus:ring-amber-500";
const BRAND_SHADOW = "shadow-amber-100";

type VendorFormPayload = {
  email: string;
  companyName: string;
  gstin: string;
  pan: string;
  bankAccount: string;
  ifscCode: string;
  accountName: string;
  commissionRate: string;
  status: VendorStatus;
};

const emptyForm: VendorFormPayload = {
  email: "",
  companyName: "",
  gstin: "",
  pan: "",
  bankAccount: "",
  ifscCode: "",
  accountName: "",
  commissionRate: "8",
  status: "PENDING_APPROVAL",
};

const inputBaseClass = `w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] outline-none focus:outline-none focus:ring-1 ${BRAND_RING} focus:border-amber-500 transition-all shadow-sm hover:border-slate-300`;

export function EditVendorDialog({
  vendorId,
  onOpenChange,
  onSaved,
}: {
  vendorId: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const open = vendorId !== null;
  const [busy, setBusy] = useState(false);
  const [load, setLoad] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState<VendorFormPayload>(emptyForm);

  const reset = useCallback(() => {
    setForm(emptyForm);
    setNewPassword("");
  }, []);

  useEffect(() => {
    if (!vendorId) {
      reset();
      return;
    }

    let cancelled = false;
    setLoad(true);
    (async () => {
      try {
        const res = await fetch(`/api/admin/vendors/${vendorId}/editor`);
        const data = await res.json();
        if (!res.ok) {
          alert(data.error ?? "Failed to load vendor");
          onOpenChange(false);
          return;
        }
        if (cancelled) return;
        setForm({
          email: data.email ?? "",
          companyName: data.companyName ?? "",
          gstin: data.gstin ?? "",
          pan: data.pan ?? "",
          bankAccount: data.bankAccount ?? "",
          ifscCode: data.ifscCode ?? "",
          accountName: data.accountName ?? "",
          commissionRate: String(data.commissionRate ?? 8),
          status: data.status ?? "PENDING_APPROVAL",
        });
        setNewPassword("");
      } finally {
        if (!cancelled) setLoad(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vendorId, onOpenChange, reset]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) return;
    const commission = Number(form.commissionRate);
    if (!Number.isFinite(commission)) {
      alert("Invalid commission");
      return;
    }

    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        email: form.email.trim(),
        companyName: form.companyName.trim(),
        gstin: form.gstin.trim(),
        pan: form.pan.trim(),
        bankAccount: form.bankAccount.trim(),
        ifscCode: form.ifscCode.trim(),
        accountName: form.accountName.trim(),
        commissionRate: commission,
        status: form.status,
      };
      if (newPassword.trim()) body.newPassword = newPassword;

      const res = await fetch(`/api/admin/vendors/${vendorId}/editor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to save");
        return;
      }
      onOpenChange(false);
      reset();
      onSaved?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[95vw] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm ${BRAND_TEXT}`}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-[15px] font-bold leading-none text-slate-900">
                  Vendor configuration
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-[11px] text-slate-500">
                  Manage entity credentials and financial settlement rules.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              type="button"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="edit-vendor-scrollbar flex-1 overflow-y-auto p-5">
            {load ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
                <div className="rounded-full bg-amber-50 p-3">
                  <Loader2 className={`h-6 w-6 animate-spin ${BRAND_TEXT}`} />
                </div>
                <span className="text-[12px] font-medium tracking-tight">Syncing data…</span>
              </div>
            ) : (
              <form id="vendor-edit-form" onSubmit={submit} className="space-y-5">
                <section>
                  <SectionHeader title="Authentication & access" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Contact email">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          required
                          type="email"
                          className={inputBaseClass}
                          placeholder="vendor@email.com"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                    </Field>
                    <Field label="Reset password">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          className={inputBaseClass}
                          placeholder="New security key (min 8 chars)"
                          value={newPassword}
                          autoComplete="new-password"
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                    </Field>
                  </div>
                </section>

                <section>
                  <SectionHeader title="Legal identity" />
                  <div className="space-y-3">
                    <Field label="Company legal name">
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          required
                          className={inputBaseClass}
                          placeholder="Registered business name"
                          value={form.companyName}
                          onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                        />
                      </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="GSTIN number">
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            required
                            className={`${inputBaseClass} font-mono uppercase tracking-wider`}
                            placeholder="GST NO"
                            value={form.gstin}
                            onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
                          />
                        </div>
                      </Field>
                      <Field label="PAN identifier">
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            required
                            className={`${inputBaseClass} font-mono uppercase tracking-wider`}
                            placeholder="PAN NO"
                            value={form.pan}
                            onChange={(e) => setForm((f) => ({ ...f, pan: e.target.value }))}
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                </section>

                <section>
                  <SectionHeader title="Payout & commissions" />
                  <div className="space-y-3">
                    <Field label="Beneficiary name">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          required
                          className={inputBaseClass}
                          placeholder="Name as per bank record"
                          value={form.accountName}
                          onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                        />
                      </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Account number">
                        <div className="relative">
                          <Landmark className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            required
                            className={`${inputBaseClass} font-mono`}
                            placeholder="Digits only"
                            value={form.bankAccount}
                            onChange={(e) => setForm((f) => ({ ...f, bankAccount: e.target.value }))}
                          />
                        </div>
                      </Field>
                      <Field label="IFSC code">
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            required
                            className={`${inputBaseClass} font-mono uppercase tracking-wider`}
                            placeholder="Bank code"
                            value={form.ifscCode}
                            onChange={(e) => setForm((f) => ({ ...f, ifscCode: e.target.value }))}
                          />
                        </div>
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Commission (%)">
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            max={100}
                            className={inputBaseClass}
                            value={form.commissionRate}
                            onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))}
                          />
                        </div>
                      </Field>
                      <Field label="Lifecycle status">
                        <div className="relative">
                          <Activity className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <select
                            className={`${inputBaseClass} cursor-pointer appearance-none bg-white pr-9`}
                            value={form.status}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, status: e.target.value as VendorStatus }))
                            }
                          >
                            <option value="PENDING_APPROVAL">Pending approval</option>
                            <option value="ACTIVE">Active</option>
                            <option value="SUSPENDED">Suspended</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                        </div>
                      </Field>
                    </div>
                  </div>
                </section>
              </form>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-3 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              Discard
            </button>
            <button
              form="vendor-edit-form"
              type="submit"
              disabled={busy || load}
              className={`flex min-w-[120px] items-center justify-center gap-2 rounded-lg px-5 py-1.5 text-[12px] font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-40 ${BRAND_COLOR} ${BRAND_SHADOW}`}
            >
              {busy ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing
                </>
              ) : (
                "Update profile"
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .edit-vendor-scrollbar::-webkit-scrollbar { width: 4px; }
            .edit-vendor-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .edit-vendor-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            .edit-vendor-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
          `,
        }}
      />
    </Dialog.Root>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h3 className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {title}
      </h3>
      <div className="h-px w-full bg-slate-100" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="ml-0.5 block text-[11px] font-bold tracking-tight text-slate-500">{label}</label>
      {children}
    </div>
  );
}
