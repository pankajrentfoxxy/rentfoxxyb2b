import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function safeFilename(title: string) {
  const t = title.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 60) || "asas";
  return `rentfoxxy-${t}-original-upload.csv`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.asAsListing.findFirst({
    where: { id, status: { in: ["LIVE", "SOLD_OUT", "RESERVED"] } },
    select: { uploadedCsvSnapshot: true, title: true },
  });
  if (!listing?.uploadedCsvSnapshot?.trim()) {
    return NextResponse.json({ error: "Original upload not available" }, { status: 404 });
  }

  return new NextResponse(listing.uploadedCsvSnapshot, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename(listing.title)}"`,
    },
  });
}
