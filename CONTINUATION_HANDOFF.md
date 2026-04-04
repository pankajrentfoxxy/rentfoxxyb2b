# Rentfoxxy — continuation handoff (for Cursor / implementers)

Use this file when opening the project in a **new machine or folder** so work continues without losing context.

## Canonical project path (recommended)

**`C:\Users\bibha\Downloads\b2b\rentfoxxy`**

Reason: Prisma `generate` / `migrate dev` often hit **EPERM** when the repo lived under **OneDrive** (file locking on `query_engine-windows.dll.node`). A copy under **Downloads** + fresh `npm install` fixed it.

An older copy may still exist at `...\OneDrive\Desktop\b2b\rentfoxxy` — treat it as **archive** once you confirm Downloads works.

---

## Completed work (chronological summary)

### Original “Phase 6” (pre–addendum)

- **Shiprocket (optional):** `src/lib/shipping.ts`, `src/lib/order-tracking.ts`, `GET /api/customer/orders/[id]/tracking`, customer tracking page uses same pipeline; carrier masked as **“Logistics Partner”**.
- **Emails:** `src/lib/email.ts`, `src/emails/*` (OrderConfirmation, BidApproved, BidRejected, BidCounterOffer, OrderDispatched, PayoutReleased, InvoiceReady, EmailLayout).
- **Notifications:** `src/lib/notifications.ts`, `createNotification`, `NOTIFICATION_TYPES` (+ extensions like `LISTING_GRADE_C_APPROVED`).
- **Cron:** `GET /api/cron/expire-bids`, `vercel.json` hourly; optional `CRON_SECRET` + `Authorization: Bearer …`.
- **Misc:** `src/lib/app-url.ts` (`NEXT_PUBLIC_APP_URL` / `VERCEL_URL`), `orders-notify` uses `OrderConfirmation`; invoice / payout / bid / dispatch wired to emails where applicable.

### PRD Addendum v1.1 — **Cursor Prompt 6A** (product grading)

- **Schema:** `enum ProductCondition`, fields on `ProductListing` (`condition`, `batteryHealth`, `conditionNotes`, `warrantyMonths`, `warrantyType`, `refurbImages`, `requiresAdminApproval`).
- **Migrations:** `20260330190000_add_product_condition` (and possibly `20260401130642_add_product_condition` for Invoice FK/index tweak — check `prisma/migrations/`).
- **Constants:** `src/constants/grading.ts` (`GRADE_CONFIG`, filters, sort rank).
- **Vendor UI:** `src/components/vendor/VendorListingEditor.tsx` (condition cards, refurb fields, **image URLs** ×3 — UploadThing not wired).
- **APIs:** `POST/PATCH /api/vendor/listings` with validation; Grade **C** → `requiresAdminApproval=true`, `isActive=false` until admin approves; min bid ≤ **85%** of list price for Grade C.
- **Public API:** `STOREFRONT_LISTING_WHERE` in `src/lib/public-api.ts`; `?condition=` filter on product list; listing detail includes condition fields; **no** `requiresAdminApproval` listings on storefront.
- **Admin:** `POST /api/admin/listings/[id]/approve`, `POST .../reject-grade-c`, `AdminGradeCApprovals`, product catalog **Condition** column + `?pendingGradeC=1`.
- **Storefront:** `ProductsBrowser` condition checkboxes; `ProductCard` badge + “Multiple conditions”; `ProductDetailView` options **table** + `GradeGuideDialog` + Grade C as-is note.
- **Helpers:** `src/lib/listing-condition.ts`.

### Tooling / database fixes you may have hit

- **Init migration BOM:** `20260327000000_init/migration.sql` had UTF-8 BOM → stripped (EF BB BF). If DB already applied the old checksum, either **`prisma migrate reset`** or **`UPDATE "_prisma_migrations" SET checksum = …`** for that migration row (see team notes / chat history).
- **Prisma EPERM on OneDrive:** resolved by working under **Downloads** and re-running `npm install` + `npx prisma generate`.

### Docs updated (stakeholder / dev)

- `BUSINESS_STAKEHOLDER_UPDATE_LOG.md` — Phase 6 + grading line items.
- `IMPLEMENTATION_REFERENCE.md` — Phase 6 + Addendum 6A–style bullets, env hints.

---

## Next implementation: **Cursor Prompt 6B** — dual rating & review

**Source of truth:** `document/Rentfoxxy_Addendum_v1.1.docx` (or extracted `document/_addendum_extracted.txt` if present). Implement in order **6B-1 → 6B-6**.

### 6B scope (short)

| Area | What to build |
|------|----------------|
| **Schema** | `ReviewType`, `Review` model, `Order.reviews`, `User.reviewsWritten`, `VendorProfile` / `CustomerProfile` `avgRating` + `reviewCount`, `@@unique([orderId, reviewerId, type])`. |
| **APIs** | `POST /api/customer/reviews`, `POST /api/vendor/reviews`, `GET /api/public/products/[slug]/reviews` (paginated, stripped), `GET /api/vendor/bids/[id]/customer-trust`. |
| **Customer UI** | Order detail: “Review your purchase” within 7 days of delivery, stars + tags + optional comment. |
| **Vendor UI** | Order detail: “Rate this buyer” after delivered; bid detail: buyer trust card (Gold/Silver/New). |
| **Product page** | “Customer reviews” block: aggregate rating, distribution, list, **never** show vendor identity — **“Verified B2B Buyer”** only. |

**Note:** Prompt references `subjectId` as vendorProfileId or customerProfileId; `CUSTOMER_EXPERIENCE` reviews aggregate per **vendor** (anonymised on product). Recompute averages on write.

### 6C / 6D / 6E (later)

- **6C:** Token payment / balance / order statuses — large schema + payment flow change.
- **6D:** Vendor payment preferences.
- **6E:** Seed data updates.

---

## Quick commands (new clone / folder)

```powershell
cd C:\Users\bibha\Downloads\b2b\rentfoxxy
npm install
npx prisma generate
npx prisma migrate dev   # if schema behind
npm run dev
```

Ensure **Postgres** matches `DATABASE_URL` in `.env` / `.env.local`.

---

## Optional: copy reference docs into this repo

If `_docx_extract`, PRD/addendum **.docx** files only exist under **Desktop** `b2b\`, copy them into `rentfoxxy\document\` here so everything is self-contained.

---

*Last updated: continuity handoff for implementing **6B** and beyond.*
