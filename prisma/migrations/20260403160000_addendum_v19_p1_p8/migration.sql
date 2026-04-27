-- CreateTable
CREATE TABLE "VendorScore" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "deliveryScore" INTEGER NOT NULL DEFAULT 0,
    "fulfillmentScore" INTEGER NOT NULL DEFAULT 0,
    "reviewScore" INTEGER NOT NULL DEFAULT 0,
    "disputeScore" INTEGER NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "onTimeDeliveries" INTEGER NOT NULL DEFAULT 0,
    "disputedOrders" INTEGER NOT NULL DEFAULT 0,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VendorScore_vendorId_key" ON "VendorScore"("vendorId");
ALTER TABLE "VendorScore" ADD CONSTRAINT "VendorScore_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProductListing: score snapshot + timestamps
ALTER TABLE "ProductListing" ADD COLUMN IF NOT EXISTS "vendorScoreSnapshot" INTEGER;
ALTER TABLE "ProductListing" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "ProductListing" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "ProductListing" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
UPDATE "ProductListing" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "ProductListing" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "ProductListing" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProductListing" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "ProductListing" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- PriceWatch: product-based (v1.9)
DROP TABLE IF EXISTS "PriceWatch";

CREATE TABLE "PriceWatch" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "targetPrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastAlertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceWatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PriceWatch_customerId_productId_key" ON "PriceWatch"("customerId", "productId");
CREATE INDEX "PriceWatch_productId_idx" ON "PriceWatch"("productId");
CREATE INDEX "PriceWatch_customerId_idx" ON "PriceWatch"("customerId");

ALTER TABLE "PriceWatch" ADD CONSTRAINT "PriceWatch_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceWatch" ADD CONSTRAINT "PriceWatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Order multi-address
ALTER TABLE "Order" DROP COLUMN IF EXISTS "deliverySplits";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isMultiAddress" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "OrderDeliveryAddress" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "trackingAwb" TEXT,
    "trackingCarrier" TEXT,

    CONSTRAINT "OrderDeliveryAddress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderDeliveryAddress_orderId_idx" ON "OrderDeliveryAddress"("orderId");
CREATE INDEX "OrderDeliveryAddress_addressId_idx" ON "OrderDeliveryAddress"("addressId");

ALTER TABLE "OrderDeliveryAddress" ADD CONSTRAINT "OrderDeliveryAddress_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderDeliveryAddress" ADD CONSTRAINT "OrderDeliveryAddress_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Lots: minimum buyer tier
ALTER TABLE "LotListing" ADD COLUMN IF NOT EXISTS "minimumBuyerTier" TEXT;
