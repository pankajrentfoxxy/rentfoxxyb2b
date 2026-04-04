# Rentfoxxy — Phase-wise implementation reference

Internal snapshot of what is implemented in this repo versus the **PRD** (`_docx_extract/prd_text.txt`) and **Cursor prompts** (`_docx_extract/prompts_text.txt`).  
Last updated: **March 2026**.

| Phase | PRD name (summary) | Status in this codebase |
|------|---------------------|-------------------------|
| 0 | Setup, schema, auth, design | **Done** (baseline app) |
| 1 | Public storefront | **Done** |
| 2 | Customer portal | **Done** |
| 3 | Vendor portal | **Done** |
| 4 | Admin panel | **Done** |
| 5 | Billing / GST / invoices | **Done** |
| 6 | Tracking, notifications, email suite | **Partial** |
| 7 | Polish, SEO, performance | **Partial** |
| 8 | Demo seed, deployment hardening | **Partial** (seed exists; deploy is env-specific) |

---

## Phase 0 — Project setup and foundation

**Implemented (typical contents):**

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Prisma + PostgreSQL schema (`prisma/schema.prisma`), migrations under `prisma/migrations/`
- Auth: NextAuth (`src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`), roles: `CUSTOMER`, `VENDOR`, `ADMIN`
- Shared UI patterns, layouts for `(public)`, `(customer)`, `(vendor)`, `(admin)`
- Environment variables documented via `.env` / `.env.local` (see project README if present)

**Housekeeping scripts (`package.json`):**

- `npm run clean` — removes `.next` (fixes stale chunk errors like missing `1682.js`)

---

## Phase 1 — Public storefront

**Implemented:**

- Home, products listing (`/products`) with filters (category, brand, RAM, CPU, price, sort, pagination)
- Product detail (`/products/[slug]`), gallery, specs, anonymised multi-vendor options
- Cart (`/cart`, Zustand + persistence where wired), checkout (`/checkout`)
- Public APIs: `GET /api/public/categories`, `/api/public/products`, `/api/public/products/[slug]`
- Registration flow: `/api/public/register/request`, `/api/public/register/complete`
- Legal/static pages as routed under `(public)`

**Product images:**

- Stored as URL strings on `Product.images` (`String[]`).
- Static files: **`public/products/`** (URLs like `/products/your-file.webp`).
- **Do not** use `/public/...` in the database — use `/products/...`.
- Helpers: `src/lib/image-url.ts` (`normalizePublicImagePath`, `isUsableImageSrc`, admin textarea parsing).

---

## Phase 2 — Customer portal

**Implemented:**

- Customer dashboard, profile, addresses, password
- Bids list + bid detail, counter-offer actions, bid payment client (Razorpay)
- Orders list + order detail, return request, support ticket modal
- Invoices page + PDF download (Phase 5)
- Notifications APIs + bell pattern (`/api/customer/notifications/*`)
- Cart API (`/api/customer/cart`), payments: `/api/customer/payments/create`, `/api/customer/payments/verify`

**Fixes applied during implementation:**

- Customer orders UI: avoid passing non-serialisable table `cell` functions from Server to Client Components (use client-safe data tables or components marked `"use client"` end-to-end).
- Homepage / CSS: ensure Tailwind runs and global CSS loads; clear `.next` if chunks are stale.

---

## Phase 3 — Vendor portal

**Implemented:**

- Vendor dashboard, profile, catalog products, listings CRUD
- Bid inbox + approve / reject / counter (`PUT /api/vendor/bids/[id]`)
- Order status updates + shipment fields (`/api/vendor/orders/[id]/status`)
- Notifications (`/api/vendor/notifications/*`)
- Payouts view (ledger depends on admin release flow)

**Bid approval → Phase 5:**

- On approve, server triggers **proforma invoice** generation (see Phase 5).

---

## Phase 4 — Rentfoxxy admin panel

**Schema / migrations:**

- `Order.adminNotes` (optional `Text`)
- `PlatformSettings`: `companyPhone`, `companyEmail`, `webhookPublicUrl` (and later Phase 5 fields — see below)

**Libraries:**

- `src/lib/admin-auth.ts` — `getAdminUserId()` (ADMIN only)
- `src/lib/admin-kpis.ts` — dashboard KPIs / series

**Admin API routes (all guarded with admin auth):**

- Settings: `GET/PUT /api/admin/settings`
- Payouts: `POST /api/admin/payouts/release`
- Vendors: `POST /api/admin/vendors`, `PATCH /api/admin/vendors/[id]`
- Customers: `PATCH /api/admin/customers/[id]`
- Products: `PATCH /api/admin/products/[id]`
- Orders: `PATCH /api/admin/orders/[id]`, `GET /api/admin/orders/export`
- Bids: `POST /api/admin/bids/[id]` (force approve / reject / extend)
- Notifications: list, mark read, read-all
- Reports: `GET /api/admin/reports` (sales / vendors / bids / customers + date range)

**Admin UI:**

- Layout + `AdminAppShell` (role redirect, notification bell)
- Dashboard (KPIs, charts)
- Vendors (list, pending tab, create, detail)
- Customers (list, detail)
- Products (catalog, edit)
- Orders (filters, export link, detail with PII, admin override)
- Bids (actions)
- Payouts (tabs)
- Reports (tabs, charts, CSV)
- Settings (company, payment, invoice-related fields)
- Invoices list (links to PDF after Phase 5)

---

## Phase 5 — Invoice and GST engine

**Schema / migration (`20260330180000_phase5_invoice_engine`):**

- `Invoice`: optional `orderId`; optional unique `bidId`; `referencesTaxInvoiceId`; `@@unique([orderId, type])`
- `Order`: `invoices Invoice[]` (replaces one-to-one `invoice`)
- `Bid`: `proformaInvoice`
- `PlatformSettings`: `companyState`, `proformaPrefix`, `creditNotePrefix`, `invoiceCounterYear`, `invoiceCounterValue`

**Libraries:**

- `src/lib/invoice-pdf.tsx` — `@react-pdf/renderer` document (tax / proforma / credit note)
- `src/lib/invoice-generator.ts` — allocate numbers, build PDFs, persist, optional Resend for proforma + credit note
- `src/lib/invoice-number.ts` — sequential numbers per year (`RFX-INV-YYYY-NNNNNN`, etc.)
- `src/lib/invoice-gst-split.ts` — intra-state CGST+SGST vs inter-state IGST (18% on taxable base)
- `src/lib/invoice-amount-words.ts` — amount in words
- `src/lib/invoice-storage.ts` — PDF files under `.data/invoices/` (or `INVOICE_PDF_DIR`)

**APIs:**

- `POST /api/admin/invoices/generate/[orderId]` — tax invoice PDF
- `POST /api/admin/orders/[id]/credit-note` — credit note (order must be `REFUNDED` or `CANCELLED`, tax invoice must exist)
- `GET /api/admin/invoices/[id]/download` — admin PDF download
- `GET /api/customer/invoices/[id]/download` — customer PDF (order or bid-linked invoice)
- `POST /api/customer/bids/[id]/proforma` — idempotent proforma ensure (approved bids)

**Triggers:**

- **Tax invoice:** after payment — `ensureTaxInvoiceForOrder` from Razorpay webhook + customer `payments/verify`
- **Proforma:** vendor bid approve (`PUT /api/vendor/bids/[id]`); customer can refresh from bid UI

**UI:**

- Admin order detail: invoice list + `AdminOrderInvoiceTools` (generate tax PDF, issue credit note)
- Customer bid detail: `BidProformaActions` (create / download / regenerate)
- Customer invoices + admin invoices list updated for bid-only proformas

**Config:**

- `next.config.mjs`: `experimental.serverComponentsExternalPackages: ["@react-pdf/renderer"]`
- `.gitignore`: `.data/` for local PDF cache

**Operational notes:**

- Run `npx prisma migrate deploy` (or `migrate dev`) after pulling Phase 4 + 5 migrations.
- If `npx prisma generate` fails with **EPERM** on Windows, close Node processes / exclude `node_modules` from sync locks, then retry.

---

## Phase 6 — Tracking, notifications, email

**6A — Tracking**

- `src/lib/shipping.ts` — optional Shiprocket auth (`SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`), `trackShipment(awb)` → normalised events
- `src/lib/order-tracking.ts` — `getCustomerOrderTracking(orderId, customerProfileId)` merges Shiprocket + `Shipment.events`, masks carrier as `"Logistics Partner"`, persists refreshed events
- `GET /api/customer/orders/[id]/tracking` — JSON payload for mobile / clients
- `src/app/(customer)/customer/tracking/[orderId]/page.tsx` — server page uses `getCustomerOrderTracking` (same source as API)

**6B — Email (Resend + React Email)**

- `src/lib/email.ts` — `sendEmail`, `sendSimpleAttachmentEmail` (shared `EmailLayout` + PDF attachment)
- `src/emails/` — `OrderConfirmation`, `BidApproved`, `BidRejected`, `BidCounterOffer`, `OrderDispatched`, `PayoutReleased`, `InvoiceReady`, `EmailLayout`
- Triggers: `notifyOrderPlaced` (order confirmation); vendor + admin bid routes (bid emails); vendor order dispatch (`OrderDispatched`); admin payout release (`PayoutReleased`); new tax invoice in `ensureTaxInvoiceForOrder` (`InvoiceReady` + PDF); proforma / credit note use branded attachment email via `sendSimpleAttachmentEmail`
- `src/lib/app-url.ts` — `getAppBaseUrl()` from `NEXT_PUBLIC_APP_URL` or `VERCEL_URL` (email links)

**6C — In-app notifications**

- `src/lib/notifications.ts` — `createNotification`, `NOTIFICATION_TYPES` (Phase 6 set + `BID_COUNTER`, `BID_EXTENDED`, `ORDER_PLACED_VENDOR`, `SUPPORT_TICKET`)
- API routes refactored to use the helper / consistent type strings where touched (orders, bids, dispatch, delivered, payouts, support, invoice ready)

**6D — Bid expiry cron**

- `GET /api/cron/expire-bids` — sets `APPROVED` bids past `expiresAt` to `EXPIRED`, notifies customer (`BID_EXPIRED`). If `CRON_SECRET` is set, requires `Authorization: Bearer <CRON_SECRET>`
- `vercel.json` — `0 * * * *` → `/api/cron/expire-bids`

**Removed:** `src/lib/email/order-placed.tsx` (replaced by `OrderConfirmation.tsx`)

---

## Phase 7 — Polish, SEO, performance (partial)

**Present:**

- Root metadata in `src/app/layout.tsx`
- Mix of static and dynamic routes

**Not fully implemented vs prompt:**

- `robots.txt` / `sitemap.ts` as first-class App Router assets
- `loading.tsx` / `error.tsx` / root `not-found` across all segments
- Product `next/image` remote patterns for arbitrary CDNs
- Full accessibility pass and performance budgets

---

## Phase 8 — Demo seed and deployment (partial)

**Present:**

- `prisma/seed.ts` — admin / vendors / customer / categories / products / listings  
  (documented test accounts in seed console output)

**Deployment:**

- Production requires valid `DATABASE_URL`, auth secrets, Razorpay keys, Resend (if emails desired), and hosting that supports Next.js + file storage for `.data/invoices` or a future S3/UploadThing migration.
- Phase 6: set `NEXT_PUBLIC_APP_URL` (or rely on `VERCEL_URL`) for correct email links; optional `SHIPROCKET_*` for live tracking; optional `CRON_SECRET` plus matching `Authorization` on `/api/cron/expire-bids` if you want the job non-public.

---

## Migrations index (reference)

| Folder / name | Purpose |
|---------------|---------|
| `20260327000000_init` | Initial schema |
| `20260330120000_admin_phase4` | `Order.adminNotes`, extra `PlatformSettings` fields |
| `20260330180000_phase5_invoice_engine` | Invoice model changes, bid proforma link, settings counters |

---

## Quick command reference

```bash
cd rentfoxxy
npm install
npx prisma migrate deploy
npx prisma generate
npm run db:seed        # optional
npm run dev            # or next dev -p 3002
```

---

*This file is for internal reference only. For authoritative requirements, use the PRD and signed-off prompt documents.*
