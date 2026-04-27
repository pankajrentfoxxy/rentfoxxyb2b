import { appyflowEnvDebug, resolveAppyflowKey } from "@/lib/appyflow-env";
import { validateGSTINFormat } from "@/lib/gstin";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AppyAddr = {
  bno?: string;
  bnm?: string;
  st?: string;
  loc?: string;
  dst?: string;
  stcd?: string;
  pncd?: string;
  city?: string;
  flno?: string;
  lg?: string;
};

type AppyPradr = {
  ntr?: string;
  addr?: AppyAddr;
};

type AppyTaxInfo = {
  gstin?: string;
  lgnm?: string;
  tradeNam?: string;
  sts?: string;
  rgdt?: string;
  ctb?: string;
  pradr?: AppyPradr;
  adadr?: Array<{ addr?: AppyAddr }>;
};

type AppyResponse = {
  error?: boolean;
  message?: string;
  taxpayerInfo?: unknown;
  TaxpayerInfo?: unknown;
  data?: unknown;
  result?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** AppyFlow may nest `taxpayerInfo` or use alternate keys / shapes. */
function extractTaxpayerInfo(parsed: unknown): AppyTaxInfo | null {
  if (!isRecord(parsed)) return null;

  const candidates: unknown[] = [
    parsed.taxpayerInfo,
    parsed.TaxpayerInfo,
    parsed.taxPayerInfo,
    isRecord(parsed.data) ? parsed.data.taxpayerInfo : undefined,
    isRecord(parsed.result) ? parsed.result.taxpayerInfo : undefined,
  ];

  for (const c of candidates) {
    if (!isRecord(c)) continue;
    if (Object.keys(c).length === 0) continue;
    return c as AppyTaxInfo;
  }
  return null;
}

function legalName(info: AppyTaxInfo): string {
  const ext = info as AppyTaxInfo & { legalName?: string; lgnm_business?: string };
  return (ext.lgnm ?? ext.legalName ?? ext.lgnm_business ?? "").trim();
}

function tradeName(info: AppyTaxInfo): string {
  const ext = info as AppyTaxInfo & { tradeName?: string };
  return (ext.tradeNam ?? ext.tradeName ?? "").trim();
}

function pickPrincipalAddress(info: AppyTaxInfo): AppyAddr {
  const fromPradr = info.pradr?.addr;
  if (fromPradr && typeof fromPradr === "object") return fromPradr;
  const first = info.adadr?.find((a) => a?.addr && typeof a.addr === "object");
  return first?.addr ?? {};
}

function buildStreetLine(addr: AppyAddr): string {
  const parts = [addr.flno, addr.bno, addr.bnm, addr.st, addr.loc, addr.lg].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  return parts.join(", ") || "";
}

async function fetchAppyFlowGst(gstin: string, key: string): Promise<{ res: Response; text: string }> {
  const baseHeaders = {
    Accept: "application/json",
    "User-Agent": "Rentfoxxy-GSTVerify/1.0",
  } as const;

  const attempts: Array<() => Promise<Response>> = [
    () =>
      fetch(`https://appyflow.in/api/verifyGST?${new URLSearchParams({ gstNo: gstin, key_secret: key })}`, {
        method: "GET",
        cache: "no-store",
        headers: { ...baseHeaders },
      }),
    () =>
      fetch("https://appyflow.in/api/verifyGST", {
        method: "POST",
        cache: "no-store",
        headers: { ...baseHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ gstNo: gstin, key_secret: key }),
      }),
    () =>
      fetch("https://appyflow.in/api/verifyGST", {
        method: "POST",
        cache: "no-store",
        headers: { ...baseHeaders, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ gstNo: gstin, key_secret: key }).toString(),
      }),
  ];

  let last: { res: Response; text: string } | null = null;
  for (const run of attempts) {
    const res = await run();
    const text = await res.text();
    last = { res, text };
    let parsed: AppyResponse;
    try {
      parsed = JSON.parse(text) as AppyResponse;
    } catch {
      continue;
    }
    const info = extractTaxpayerInfo(parsed);
    const hasNames = info && (legalName(info).length > 0 || tradeName(info).length > 0);
    if (parsed.error === true || hasNames || (info && Object.keys(info).length > 0)) {
      return { res, text };
    }
  }

  return last ?? { res: new Response(null, { status: 502 }), text: "{}" };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { gstin?: string };
  const gstin = body.gstin?.trim().toUpperCase() ?? "";
  if (!gstin) {
    return NextResponse.json({ valid: false, error: "GSTIN required" }, { status: 400 });
  }

  if (!validateGSTINFormat(gstin)) {
    return NextResponse.json({ valid: false, error: "Invalid GSTIN format" }, { status: 400 });
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let cached;
  try {
    cached = await prisma.gstinCache.findUnique({ where: { gstin } });
  } catch (e) {
    console.error("[validate-gstin] DB read failed", e);
    cached = null;
  }

  if (cached && cached.cachedAt > dayAgo) {
    if (cached.status !== "Active") {
      return NextResponse.json({
        valid: false,
        error: `GSTIN status: ${cached.status}. Only active GSTINs accepted.`,
      });
    }
    return NextResponse.json({
      valid: true,
      verified: true,
      data: {
        gstin: cached.gstin,
        businessName: cached.businessName,
        tradeName: cached.tradeName,
        status: cached.status,
        registrationDate: cached.registrationDate,
        entityType: cached.entityType,
        address: cached.address,
        city: cached.city,
        state: cached.state,
        pincode: cached.pincode,
      },
      cached: true,
    });
  }

  const key = resolveAppyflowKey();
  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[validate-gstin] No AppyFlow key after loading .env files from disk:", appyflowEnvDebug());
    }
    return NextResponse.json({
      valid: true,
      verified: false,
      warning:
        "GST lookup is not configured on the server. Add APPYFLOW_GST_KEY to .env.local, restart npm run dev, then try again. You can still type business details manually below.",
    });
  }

  try {
    const { res, text: rawText } = await fetchAppyFlowGst(gstin, key);
    let parsed: AppyResponse;
    try {
      parsed = JSON.parse(rawText) as AppyResponse;
    } catch {
      console.error("[validate-gstin] Non-JSON response", res.status, rawText.slice(0, 400));
      return NextResponse.json({
        valid: true,
        verified: false,
        warning: "GST verification returned an unexpected response. Please fill address manually.",
      });
    }

    if (parsed.error === true) {
      const msg = typeof parsed.message === "string" ? parsed.message : "AppyFlow verification failed";
      console.error("[validate-gstin] AppyFlow error:", msg);
      return NextResponse.json({
        valid: true,
        verified: false,
        warning: `${msg} You can still enter business details manually.`,
      });
    }

    if (!res.ok) {
      console.error("[validate-gstin] HTTP", res.status, rawText.slice(0, 400));
      return NextResponse.json({
        valid: true,
        verified: false,
        warning: "GST verification service was unavailable. Please fill address manually.",
      });
    }

    const info = extractTaxpayerInfo(parsed);
    const legal = info ? legalName(info) : "";
    const trade = info ? tradeName(info) : "";
    if (!info || (!legal && !trade)) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[validate-gstin] No taxpayer names in response; keys:", Object.keys(parsed), "sample:", rawText.slice(0, 500));
      }
      return NextResponse.json({
        valid: true,
        verified: false,
        warning:
          "Could not read business name from GST verification. Check your AppyFlow key and credits, or fill details manually.",
      });
    }

    const sts = (info.sts ?? "").trim();
    if (sts && sts.toLowerCase() !== "active") {
      return NextResponse.json({
        valid: false,
        error: `GSTIN status: ${sts}. Only active GSTINs accepted.`,
      });
    }

    const addr = pickPrincipalAddress(info);
    const street = buildStreetLine(addr);
    const city = [addr.dst, addr.city, addr.loc].find((x) => typeof x === "string" && x.trim())?.trim() ?? "";
    const state = (addr.stcd ?? "").trim();
    const pincode = (addr.pncd ?? "").trim();

    const result = {
      gstin: (info.gstin ?? gstin).toUpperCase(),
      businessName: legal || trade,
      tradeName: trade || null,
      status: sts || "Active",
      registrationDate: info.rgdt ?? null,
      entityType: info.ctb ?? null,
      address: street || null,
      city,
      state,
      pincode,
    };

    try {
      await prisma.gstinCache.upsert({
        where: { gstin: result.gstin },
        create: {
          gstin: result.gstin,
          businessName: result.businessName || "—",
          tradeName: result.tradeName,
          status: result.status,
          registrationDate: result.registrationDate,
          entityType: result.entityType,
          address: result.address,
          city: result.city || null,
          state: result.state || null,
          pincode: result.pincode || null,
          cachedAt: new Date(),
        },
        update: {
          businessName: result.businessName || "—",
          tradeName: result.tradeName,
          status: result.status,
          registrationDate: result.registrationDate,
          entityType: result.entityType,
          address: result.address,
          city: result.city || null,
          state: result.state || null,
          pincode: result.pincode || null,
          cachedAt: new Date(),
        },
      });
    } catch (e) {
      console.error("[validate-gstin] cache upsert failed (continuing)", e);
    }

    return NextResponse.json({ valid: true, data: result, verified: true });
  } catch (e) {
    console.error("[validate-gstin]", e);
    return NextResponse.json({
      valid: true,
      verified: false,
      warning: "Could not reach GST verification. Check network and try again, or fill address manually.",
    });
  }
}
