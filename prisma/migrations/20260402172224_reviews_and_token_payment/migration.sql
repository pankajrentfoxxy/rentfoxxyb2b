-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('CUSTOMER_EXPERIENCE', 'VENDOR_CUSTOMER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'TOKEN_PAID';
ALTER TYPE "OrderStatus" ADD VALUE 'STOCK_RESERVED';
ALTER TYPE "OrderStatus" ADD VALUE 'BALANCE_OVERDUE';
ALTER TYPE "OrderStatus" ADD VALUE 'BALANCE_PAID';
ALTER TYPE "OrderStatus" ADD VALUE 'TOKEN_FORFEITED';

-- DropIndex
DROP INDEX "Payment_orderId_key";

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "paymentOption" TEXT NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE "CustomerProfile" ADD COLUMN     "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "balanceDueAt" TIMESTAMP(3),
ADD COLUMN     "balancePaidAt" TIMESTAMP(3),
ADD COLUMN     "balanceReminder12hSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "balanceReminder2hSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTokenForfeited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokenAmount" DOUBLE PRECISION,
ADD COLUMN     "tokenForfeitedAt" TIMESTAMP(3),
ADD COLUMN     "tokenPaidAt" TIMESTAMP(3),
ADD COLUMN     "tokenPercentage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentPurpose" TEXT NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "tokenForfeitVendorShare" DOUBLE PRECISION NOT NULL DEFAULT 30.0;

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "type" "ReviewType" NOT NULL,
    "orderId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "adminFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_subjectId_type_idx" ON "Review"("subjectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_reviewerId_type_key" ON "Review"("orderId", "reviewerId", "type");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
