-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "acceptedPaymentMethods" TEXT[] DEFAULT ARRAY['UPI', 'NET_BANKING', 'CARD', 'RAZORPAY_LINK', 'TOKEN_PAYMENT']::TEXT[],
ADD COLUMN     "acceptsTokenPayment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "minOrderForRTGS" DOUBLE PRECISION,
ADD COLUMN     "minTokenPercentage" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "requiresFullAdvance" BOOLEAN NOT NULL DEFAULT false;
