import { auth } from "@/lib/auth";
import { parsePaymentOption, type PaymentOptionId } from "@/constants/payment-options";
import { prisma } from "@/lib/prisma";
import { validateVendorBidPayment } from "@/lib/vendor-payment-rules";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_PAY: PaymentOptionId[] = ["FULL", "TOKEN_2", "TOKEN_3", "TOKEN_4", "TOKEN_5"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Customer profile not found" }, { status: 400 });
  }

  const body = (await req.json()) as {
    listingId?: string;
    quantity?: number;
    bidPricePerUnit?: number;
    note?: string;
    paymentOption?: string;
  };

  const { listingId, quantity, bidPricePerUnit, note } = body;
  const paymentOptionRaw = body.paymentOption ?? "FULL";
  if (!ALLOWED_PAY.includes(paymentOptionRaw as PaymentOptionId)) {
    return NextResponse.json({ error: "Invalid payment option" }, { status: 400 });
  }
  const paymentOption = parsePaymentOption(paymentOptionRaw);
  if (!listingId || !quantity || bidPricePerUnit == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const listing = await prisma.productListing.findFirst({
    where: { id: listingId, isActive: true },
    include: {
      vendor: {
        select: {
          acceptedPaymentMethods: true,
          requiresFullAdvance: true,
          minOrderForRTGS: true,
          minTokenPercentage: true,
          acceptsTokenPayment: true,
        },
      },
    },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not available" }, { status: 404 });
  }

  if (quantity < listing.minOrderQty) {
    return NextResponse.json(
      { error: `Minimum order quantity is ${listing.minOrderQty}` },
      { status: 400 },
    );
  }
  if (quantity > listing.stockQty) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }
  if (bidPricePerUnit < listing.minBidPrice) {
    return NextResponse.json(
      {
        error:
          "Your price is below the minimum acceptable offer for this option. Try a higher amount.",
      },
      { status: 400 },
    );
  }

  const totalBidAmount = Math.round(quantity * bidPricePerUnit * 100) / 100;

  const payCheck = validateVendorBidPayment({
    vendor: listing.vendor,
    paymentOption,
    bidSubtotalExGst: totalBidAmount,
  });
  if (!payCheck.ok) {
    return NextResponse.json({ error: payCheck.error }, { status: 400 });
  }

  const bid = await prisma.bid.create({
    data: {
      customerId: profile.id,
      listingId: listing.id,
      quantity,
      bidPricePerUnit,
      totalBidAmount,
      status: "PENDING",
      vendorNote: note ?? null,
      paymentOption,
    },
  });

  return NextResponse.json({ bid: { id: bid.id, status: bid.status } });
}
