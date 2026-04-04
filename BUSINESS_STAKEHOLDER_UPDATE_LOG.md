# Rentfoxxy — Business stakeholder update log

**Who this document is for:**  
Owners, investors, and non-technical stakeholders who want a clear picture of **what we have built** and **when**—without developer jargon.

**How to use this file:**

- Read the sections above the line for the **story so far**.
- For anything new, scroll to **“Future changes (add below)”** and add a line with **date**, **short title**, and **what changed in plain English**.

---

## What Rentfoxxy is (in one paragraph)

Rentfoxxy is a **B2B marketplace** for laptops and IT accessories. Business buyers browse one branded catalog, compare offers, place orders or **negotiate prices through bids**, pay online, and get **proper GST paperwork**. **Suppliers (vendors)** work behind the scenes; buyers see **Rentfoxxy** as the brand. **Your team (admin)** can manage vendors, orders, payouts, and reports from a central console.

---

## What we have delivered (simple English)

### For your customers (buyers)

- A **public website** to browse products, filter by category and specs, and see prices from multiple suppliers without seeing supplier names.
- **Shopping cart** and **checkout** with address and payment (Razorpay where configured).
- **Bidding:** buyers can request a better price; vendors can approve, reject, or counter-offer; approved deals can be paid like a normal order.
- **Orders:** buyers can see order status and history.
- **Invoices:** after payment they can get a **tax invoice (PDF)**; after a bid is approved they can get a **proforma (PDF)** for internal approval before payment.
- **Profile** and **company / GST details** for B2B billing.

### For your vendors (suppliers)

- A **vendor portal** to manage their product listings (against your master catalog), see **bids**, **approve or reject** them, and update **order status** (including dispatch details).
- **Payout-related** views tied to how you release money from the platform.

### For your internal team (Rentfoxxy admin)

- An **admin dashboard** with high-level numbers and charts.
- **Vendor management:** onboard, approve, suspend, adjust commission.
- **Customer management:** view and verify B2B details where needed.
- **Catalog management:** edit master products (including images via links to files you host).
- **Orders:** search, filter, export, change status, internal notes.
- **Bids:** override or extend where business rules allow.
- **Payouts:** process releases with reference numbers; vendors can be notified when configured.
- **Reports:** sales, vendors, bids, customers over a date range, with charts and CSV export.
- **Settings:** company legal details, GST-related fields, payment and invoice numbering prefixes.
- **Invoices list** and tools to **generate tax PDFs** and **credit notes** when an order is cancelled or refunded.

### Reliability and housekeeping

- **Database updates** are applied in ordered steps so customer, admin, and invoice features stay in sync.
- **Product photos** can be stored in a standard folder on the server; the admin pastes the correct web link on the product.

---

## Date-wise implementation log (what happened, when)

*Dates reflect when work was completed and rolled into the product. Adjust if your internal records differ.*

| Date | What we did (plain English) |
|------|-----------------------------|
| **27 Mar 2026** | **Foundation:** Core database and application structure went in—users (buyer, vendor, admin), products, listings, orders, payments, bids, and the first full migration so all teams could build on one stable base. |
| **27 Mar 2026 → ongoing** | **Storefront & portals (earlier milestones):** Public catalog, cart, checkout, customer account area, vendor portal, and bid flow were brought to a working state so a buyer could shop, bid, and pay; a vendor could respond; data stayed consistent. |
| **30 Mar 2026** | **Admin console (Phase 4):** Internal “control room” for Rentfoxxy—dashboard, vendors, customers, products, orders (with export), bids, payouts, reports, settings, invoice list, role-based access, and admin-only order notes. |
| **30 Mar 2026** | **Invoices & GST (Phase 5):** Automatic **PDF tax invoices** after successful payment; **proforma PDFs** when a vendor approves a bid; **credit notes** when an order is marked refunded or cancelled (after a tax invoice exists). GST split on PDFs follows **same state vs different state** rules (standard 18% structure). Invoice numbers run in sequence with your chosen prefixes. PDFs are stored on the server unless you later move to cloud storage. |
| **30 Mar 2026** | **Small fixes & clarity:** Product image handling clarified (correct web paths); customer order screens fixed where needed; documentation for technical team (`IMPLEMENTATION_REFERENCE.md`) and this stakeholder log added. |
| **30 Mar 2026** | **Tracking, emails & alerts (Phase 6):** Buyers can see **shipment tracking** that refreshes from our logistics integration when configured, without exposing carrier names they shouldn’t see. **Branded emails** now go out for order confirmation, bid outcomes, dispatch, payouts to vendors, and tax invoices (with PDF where applicable). **In-app notifications** use consistent categories. **Expired approved bids** are closed automatically on a schedule so buyers get a clear “offer expired” message instead of stale deals sitting open. |

---

## Future changes (add below)

**Instructions for you or your PM:**  
Paste a new block under the line. Use this pattern:

```text
### YYYY-MM-DD — Short title
One or two sentences in simple English: what changed for users or the business, not file names or code.
```

---

### 2026-03-30 — Stakeholder log created
This file was added so business readers can see delivery in simple language and maintain a dated log going forward.

### 2026-03-30 — Phase 6 (tracking, email, notifications, bid expiry)
Shipment tracking for customers is wired to optional courier data with carrier names kept generic in the buyer-facing experience. Important emails (orders, bids, dispatch, vendor payouts, invoices) use a unified branded layout. Approved bids that are not paid in time are marked expired on an hourly schedule, with a customer notification.

<!-- Add your next entry above this comment, or directly below this line -->




