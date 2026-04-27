-- AlterTable
ALTER TABLE "Order" ADD COLUMN "purchaseOrderNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliverySplits" JSONB;

-- CreateTable
CREATE TABLE "PriceWatch" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "targetPrice" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceWatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PriceWatch_customerId_listingId_key" ON "PriceWatch"("customerId", "listingId");
CREATE INDEX "PriceWatch_listingId_idx" ON "PriceWatch"("listingId");
CREATE INDEX "PriceWatch_customerId_idx" ON "PriceWatch"("customerId");

ALTER TABLE "PriceWatch" ADD CONSTRAINT "PriceWatch_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceWatch" ADD CONSTRAINT "PriceWatch_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ProductListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
