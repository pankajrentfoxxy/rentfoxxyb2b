-- AlterTable
ALTER TABLE "User" ADD COLUMN "phoneVerified" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GstinCache" (
    "gstin" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "tradeName" TEXT,
    "status" TEXT NOT NULL,
    "registrationDate" TEXT,
    "entityType" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GstinCache_pkey" PRIMARY KEY ("gstin")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SmsOtpVerification" (
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsOtpVerification_pkey" PRIMARY KEY ("phone")
);
