import { FLEET_GRADE_CONFIG, FLEET_NEW_UNIT_PRICE, type FleetGradeKey } from "@/constants/fleet-calculator";
import { FleetReportDoc } from "@/lib/fleet-pdf";
import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";

export const dynamic = "force-dynamic";

function isGradeKey(g: string): g is FleetGradeKey {
  return g in FLEET_GRADE_CONFIG;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    fleetSize?: number;
    fleetAge?: number;
    avgAge?: number;
    targetLife?: number;
    avgNewPrice?: number;
    newPricePerUnit?: number;
    avgRefurbPrice?: number;
    refurbPricePerUnit?: number;
    grade?: string;
    newTotal?: number;
    refurbTotal?: number;
    savings?: number;
    savingsPct?: number;
  };

  const fleetSize = Math.max(1, Math.floor(Number(body.fleetSize) || 0));
  const avgAge = Math.max(0, Number(body.fleetAge ?? body.avgAge) || 0);
  const targetLife = Math.max(0, Number(body.targetLife) || 0);
  const gradeStr = typeof body.grade === "string" && body.grade ? body.grade : "Refurb A+";
  const grade = isGradeKey(gradeStr) ? gradeStr : "Refurb A+";

  const avgNewPrice = Math.max(
    0,
    Number(body.newPricePerUnit ?? body.avgNewPrice) || FLEET_NEW_UNIT_PRICE,
  );
  const avgRefurbPrice = Math.max(
    0,
    Number(body.refurbPricePerUnit ?? body.avgRefurbPrice) || FLEET_GRADE_CONFIG[grade].price,
  );

  const renewTotal =
    body.newTotal != null && !Number.isNaN(Number(body.newTotal))
      ? Math.max(0, Number(body.newTotal))
      : fleetSize * avgNewPrice;
  const refurbTotal =
    body.refurbTotal != null && !Number.isNaN(Number(body.refurbTotal))
      ? Math.max(0, Number(body.refurbTotal))
      : fleetSize * avgRefurbPrice;
  const savingsRaw =
    body.savings != null && !Number.isNaN(Number(body.savings))
      ? Number(body.savings)
      : renewTotal - refurbTotal;
  const savings = Math.max(0, savingsRaw);
  const savingsPct =
    body.savingsPct != null && !Number.isNaN(Number(body.savingsPct))
      ? Math.max(0, Math.min(100, Math.round(Number(body.savingsPct))))
      : renewTotal > 0
        ? Math.round((savings / renewTotal) * 100)
        : 0;

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const buf = await renderToBuffer(
    createElement(FleetReportDoc, {
      fleetSize,
      avgAge,
      targetLife: targetLife || 4,
      avgNewPrice,
      avgRefurbPrice,
      renewTotal,
      refurbTotal,
      savings,
      savingsPct,
      grade,
    }) as Parameters<typeof renderToBuffer>[0],
  );

  return new NextResponse(Buffer.from(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="fleet-renewal-report.pdf"',
    },
  });
}
