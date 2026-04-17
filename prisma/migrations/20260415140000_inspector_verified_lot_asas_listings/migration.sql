-- Inspector verification flag on lot and AsAs listings (default true for trusted catalogues)
ALTER TABLE "LotListing" ADD COLUMN IF NOT EXISTS "inspectorVerified" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AsAsListing" ADD COLUMN IF NOT EXISTS "inspectorVerified" BOOLEAN NOT NULL DEFAULT true;
