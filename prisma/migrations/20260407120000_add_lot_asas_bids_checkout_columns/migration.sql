-- Addendum v1.3/v1.4: LotBid, AsAsBid, Razorpay checkout fields on LotPurchase and AsAsPurchase.

-- AlterTable LotPurchase
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "reference" TEXT;
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "addressId" TEXT;
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "paymentOption" TEXT NOT NULL DEFAULT 'FULL';
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "gstAmount" DOUBLE PRECISION;
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "grandTotal" DOUBLE PRECISION;
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "tokenAmount" DOUBLE PRECISION;
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "balanceDueAt" TIMESTAMP(3);
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "balancePaidAt" TIMESTAMP(3);
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT;
ALTER TABLE "LotPurchase" ADD COLUMN IF NOT EXISTS "customerGstin" TEXT;

ALTER TABLE "LotPurchase" ALTER COLUMN "amountPaid" SET DEFAULT 0;

-- AlterTable AsAsPurchase
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "reference" TEXT;
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "addressId" TEXT;
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "paymentOption" TEXT NOT NULL DEFAULT 'FULL';
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "gstAmount" DOUBLE PRECISION;
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "grandTotal" DOUBLE PRECISION;
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "tokenAmount" DOUBLE PRECISION;
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "balanceDueAt" TIMESTAMP(3);
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "balancePaidAt" TIMESTAMP(3);
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT;
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "customerGstin" TEXT;
ALTER TABLE "AsAsPurchase" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;

ALTER TABLE "AsAsPurchase" ALTER COLUMN "amountPaid" SET DEFAULT 0;

-- CreateTable LotBid
CREATE TABLE IF NOT EXISTS "LotBid" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "lotsCount" INTEGER NOT NULL,
    "bidPricePerLot" DOUBLE PRECISION NOT NULL,
    "totalBidAmount" DOUBLE PRECISION NOT NULL,
    "paymentOption" TEXT NOT NULL DEFAULT 'FULL',
    "note" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable AsAsBid
CREATE TABLE IF NOT EXISTS "AsAsBid" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "asasId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "bidPricePerUnit" DOUBLE PRECISION NOT NULL,
    "totalBidAmount" DOUBLE PRECISION NOT NULL,
    "paymentOption" TEXT NOT NULL DEFAULT 'FULL',
    "note" TEXT,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsAsBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (ignore if exists: run manually on partial failures)
CREATE UNIQUE INDEX IF NOT EXISTS "LotPurchase_reference_key" ON "LotPurchase"("reference");
CREATE INDEX IF NOT EXISTS "LotPurchase_razorpayOrderId_idx" ON "LotPurchase"("razorpayOrderId");

CREATE UNIQUE INDEX IF NOT EXISTS "AsAsPurchase_reference_key" ON "AsAsPurchase"("reference");
CREATE INDEX IF NOT EXISTS "AsAsPurchase_razorpayOrderId_idx" ON "AsAsPurchase"("razorpayOrderId");

CREATE INDEX IF NOT EXISTS "LotBid_customerId_idx" ON "LotBid"("customerId");
CREATE INDEX IF NOT EXISTS "LotBid_lotId_idx" ON "LotBid"("lotId");
CREATE INDEX IF NOT EXISTS "AsAsBid_customerId_idx" ON "AsAsBid"("customerId");
CREATE INDEX IF NOT EXISTS "AsAsBid_asasId_idx" ON "AsAsBid"("asasId");

-- AddForeignKey (Postgres: skip error if duplicate — use DO blocks for idempotency)
DO $$ BEGIN
  ALTER TABLE "LotPurchase" ADD CONSTRAINT "LotPurchase_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AsAsPurchase" ADD CONSTRAINT "AsAsPurchase_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "LotBid" ADD CONSTRAINT "LotBid_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "LotBid" ADD CONSTRAINT "LotBid_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "LotListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AsAsBid" ADD CONSTRAINT "AsAsBid_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AsAsBid" ADD CONSTRAINT "AsAsBid_asasId_fkey" FOREIGN KEY ("asasId") REFERENCES "AsAsListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
