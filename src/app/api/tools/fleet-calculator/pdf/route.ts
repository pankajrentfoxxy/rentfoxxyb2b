import { FleetReportDoc } from "@/lib/fleet-pdf";
import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    fleetSize?: number;
    avgAge?: number;
    targetLife?: number;
    avgNewPrice?: number;
    avgRefurbPrice?: number;
  };

  const fleetSize = Math.max(1, Math.floor(Number(body.fleetSize) || 0));
  const avgAge = Math.max(0, Number(body.avgAge) || 0);
  const targetLife = Math.max(1, Number(body.targetLife) || 4);
  const avgNewPrice = Math.max(0, Number(body.avgNewPrice) || 0);
  const avgRefurbPrice = Math.max(0, Number(body.avgRefurbPrice) || 0);

  const renewTotal = fleetSize * avgNewPrice;
  const refurbTotal = fleetSize * avgRefurbPrice;
  const savings = Math.max(0, renewTotal - refurbTotal);

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const buf = await renderToBuffer(
    createElement(FleetReportDoc, {
      fleetSize,
      avgAge,
      targetLife,
      avgNewPrice,
      avgRefurbPrice,
      renewTotal,
      savings,
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
