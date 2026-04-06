-- One-time backfill: set AsAsListing.totalUnits from sum of line items.
-- Run in Supabase SQL editor if live rows show 0 available but inventory items exist.
-- Table names match Prisma defaults for PostgreSQL.

UPDATE "AsAsListing" AS a
SET "totalUnits" = COALESCE(sub.sum_count, 0)
FROM (
  SELECT "asasId", SUM("count")::integer AS sum_count
  FROM "AsAsInventoryItem"
  GROUP BY "asasId"
) AS sub
WHERE a.id = sub."asasId"
  AND COALESCE(sub.sum_count, 0) > 0
  AND (
    a."totalUnits" IS NULL
    OR a."totalUnits" = 0
    OR a."totalUnits" <> sub.sum_count
  );
