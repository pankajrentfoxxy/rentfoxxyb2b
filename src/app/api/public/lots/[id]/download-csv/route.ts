import { lotConditionToLabel } from "@/lib/lot-ai-cleaner";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lot = await prisma.lotListing.findFirst({
    where: { id, status: { in: ["LIVE", "SOLD_OUT", "VERIFIED", "PENDING_VERIFICATION"] } },
    include: { items: { orderBy: [{ brand: "asc" }, { model: "asc" }] } },
  });
  if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const header =
    "Brand,Model,Generation,Processor,RAM_GB,Storage_GB,StorageType,Display_Inch,OS,Condition,Count,Unit_Price,Cosmetic_Notes,Status\n";
  const rows = lot.items.map((item) =>
    [
      escapeCsv(item.brand),
      escapeCsv(item.model),
      escapeCsv(item.generation ?? ""),
      escapeCsv(item.processor),
      item.ramGb,
      item.storageGb,
      escapeCsv(item.storageType),
      item.displayInch,
      escapeCsv(item.os),
      escapeCsv(lotConditionToLabel(item.condition)),
      item.count,
      Math.round(item.unitPrice),
      escapeCsv(item.cosmeticSummary ?? ""),
      escapeCsv(item.notes ?? ""),
    ].join(","),
  );
  const csv = header + rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rentfoxxy-lot-${lot.id}.csv"`,
    },
  });
}

function escapeCsv(s: string) {
  const t = String(s).replace(/"/g, '""');
  return `"${t}"`;
}
