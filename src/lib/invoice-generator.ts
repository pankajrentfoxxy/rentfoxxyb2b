import { allocateInvoiceNumber } from "@/lib/invoice-number";
import { classifyGst } from "@/lib/invoice-gst-split";
import { getAppBaseUrl } from "@/lib/app-url";
import { InvoiceReady } from "@/emails/InvoiceReady";
import { sendEmail, sendSimpleAttachmentEmail } from "@/lib/email";
import { RentfoxxyInvoicePdf, type InvoiceLinePdf, type RentfoxxyInvoicePdfProps } from "@/lib/invoice-pdf";
import { readInvoicePdfIfExists, writeInvoicePdf } from "@/lib/invoice-storage";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import type { InvoiceType, Order, OrderItem, Prisma } from "@prisma/client";
import React from "react";

type OrderForInvoice = Order & {
  items: (OrderItem & {
    listing: { product: { name: string; hsnCode: string } };
  })[];
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  customer: {
    gstin: string | null;
    companyName: string | null;
    user: { name: string | null; email: string };
  };
};

async function loadPlatformCompany() {
  return prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
}

function jurisdictionLine(addressBlock: string): string {
  const line = addressBlock.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)[0];
  const city = line || "Bengaluru";
  return `Subject to jurisdiction. All disputes subject to ${city} courts.`;
}

function orderToLines(items: OrderForInvoice["items"]): InvoiceLinePdf[] {
  return items.map((it, i) => ({
    idx: i + 1,
    description: it.listing.product.name,
    hsn: it.listing.product.hsnCode || "8471",
    qty: it.quantity,
    unitPrice: it.unitPrice,
    amount: it.subtotal,
  }));
}

function buildOrderPdfProps(
  order: OrderForInvoice,
  settings: Awaited<ReturnType<typeof loadPlatformCompany>>,
  docType: InvoiceType,
  invoiceNumber: string,
  issuedAt: Date,
  originalInvoiceNumber?: string,
): RentfoxxyInvoicePdfProps {
  const gst = classifyGst(settings.companyState, order.address.state, order.subtotal);
  return {
    docType,
    invoiceNumber,
    issuedAt,
    orderRef: order.orderNumber,
    originalInvoiceNumber,
    company: {
      name: settings.companyName,
      address: settings.address,
      gstin: settings.gstin,
      pan: settings.pan,
      email: settings.companyEmail,
      phone: settings.companyPhone,
    },
    customer: {
      name: order.customer.user.name ?? order.customer.user.email,
      companyName: order.customer.companyName,
      gstin: order.customer.gstin,
    },
    shipTo: {
      line1: order.address.line1,
      line2: order.address.line2,
      city: order.address.city,
      state: order.address.state,
      pincode: order.address.pincode,
    },
    items: orderToLines(order.items),
    taxableSubtotal: order.subtotal,
    isInterState: gst.isInterState,
    cgst: gst.cgst,
    sgst: gst.sgst,
    igst: gst.igst,
    grandTotal: order.totalAmount,
    jurisdictionNote: jurisdictionLine(settings.address),
  };
}

async function pdfBufferForProps(props: RentfoxxyInvoicePdfProps): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const el = React.createElement(RentfoxxyInvoicePdf, props);
  const buf = await renderToBuffer(el as Parameters<typeof renderToBuffer>[0]);
  return Buffer.from(buf);
}

export async function ensureTaxInvoiceForOrder(orderId: string): Promise<{
  invoiceId: string;
  invoiceNumber: string;
} | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { listing: { include: { product: true } } } },
      address: true,
      customer: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (
    !order ||
    order.status === "PAYMENT_PENDING" ||
    order.status === "TOKEN_PAID" ||
    order.status === "TOKEN_FORFEITED"
  ) {
    return null;
  }

  const existing = await prisma.invoice.findFirst({
    where: { orderId, type: "TAX" },
  });
  if (existing) {
    await persistPdfIfMissing(existing.invoiceNumber, async () => {
      const settings = await loadPlatformCompany();
      const props = buildOrderPdfProps(order, settings, "TAX", existing.invoiceNumber, existing.issuedAt);
      return pdfBufferForProps(props);
    });
    return { invoiceId: existing.id, invoiceNumber: existing.invoiceNumber };
  }

  const settings = await loadPlatformCompany();
  const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const invoiceNumber = await allocateInvoiceNumber(tx, "TAX");
    return tx.invoice.create({
      data: {
        orderId,
        invoiceNumber,
        type: "TAX",
      },
    });
  });

  const props = buildOrderPdfProps(order, settings, "TAX", invoice.invoiceNumber, invoice.issuedAt);
  const buffer = await pdfBufferForProps(props);
  await writeInvoicePdf(invoice.invoiceNumber, buffer);

  const u = order.customer.user;
  const email = u.email;
  const base = getAppBaseUrl();
  if (email) {
    void sendEmail({
      to: email,
      subject: `Tax invoice ${invoice.invoiceNumber}`,
      react: React.createElement(InvoiceReady, {
        customerName: u.name ?? email,
        invoiceNumber: invoice.invoiceNumber,
        orderNumber: order.orderNumber,
        amount: `₹${order.totalAmount.toLocaleString("en-IN")}`,
        invoicesUrl: `${base}/customer/invoices`,
      }),
      attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: buffer }],
    });
  }
  void createNotification({
    userId: order.customer.userId,
    type: NOTIFICATION_TYPES.INVOICE_READY,
    title: "Tax invoice ready",
    message: `${invoice.invoiceNumber} for order ${order.orderNumber} is ready.`,
    link: `/customer/invoices`,
  }).catch(() => undefined);

  return { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
}

async function persistPdfIfMissing(invoiceNumber: string, render: () => Promise<Buffer>): Promise<void> {
  const hit = await readInvoicePdfIfExists(invoiceNumber);
  if (hit) return;
  const buffer = await render();
  await writeInvoicePdf(invoiceNumber, buffer);
}

/** Proforma when bid is approved (no order yet). */
export async function createProformaInvoiceForBid(bidId: string): Promise<{
  invoiceId: string;
  invoiceNumber: string;
} | null> {
  const bid = await prisma.bid.findFirst({
    where: { id: bidId, status: "APPROVED" },
    include: {
      listing: { include: { product: true } },
      customer: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!bid) return null;

  const dupe = await prisma.invoice.findFirst({ where: { bidId } });
  if (dupe) {
    return { invoiceId: dupe.id, invoiceNumber: dupe.invoiceNumber };
  }

  const addr =
    (await prisma.address.findFirst({
      where: { userId: bid.customer.userId },
      orderBy: [{ isDefault: "desc" }, { label: "asc" }],
    })) ?? null;

  const settings = await loadPlatformCompany();
  const shipState = addr?.state ?? settings.companyState;
  const ship = addr ?? {
    line1: "To be confirmed at checkout",
    line2: null as string | null,
    city: "—",
    state: shipState,
    pincode: "—",
  };

  const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const invoiceNumber = await allocateInvoiceNumber(tx, "PROFORMA");
    return tx.invoice.create({
      data: {
        bidId: bid.id,
        invoiceNumber,
        type: "PROFORMA",
      },
    });
  });

  const unit = bid.bidPricePerUnit;
  const lineAmt = bid.totalBidAmount;
  const gst = classifyGst(settings.companyState, ship.state, lineAmt);

  const props: RentfoxxyInvoicePdfProps = {
    docType: "PROFORMA",
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    company: {
      name: settings.companyName,
      address: settings.address,
      gstin: settings.gstin,
      pan: settings.pan,
      email: settings.companyEmail,
      phone: settings.companyPhone,
    },
    customer: {
      name: bid.customer.user.name ?? bid.customer.user.email,
      companyName: bid.customer.companyName,
      gstin: bid.customer.gstin,
    },
    shipTo: {
      line1: ship.line1,
      line2: ship.line2,
      city: ship.city,
      state: ship.state,
      pincode: ship.pincode,
    },
    items: [
      {
        idx: 1,
        description: bid.listing.product.name,
        hsn: bid.listing.product.hsnCode || "8471",
        qty: bid.quantity,
        unitPrice: unit,
        amount: lineAmt,
      },
    ],
    taxableSubtotal: lineAmt,
    isInterState: gst.isInterState,
    cgst: gst.cgst,
    sgst: gst.sgst,
    igst: gst.igst,
    grandTotal: gst.total,
    jurisdictionNote: jurisdictionLine(settings.address),
  };

  const buffer = await pdfBufferForProps(props);
  await writeInvoicePdf(invoice.invoiceNumber, buffer);

  const proformaTo = bid.customer.user.email;
  if (proformaTo) {
    void sendSimpleAttachmentEmail({
      to: proformaTo,
      subject: `Proforma invoice ${invoice.invoiceNumber}`,
      preview: `Proforma ${invoice.invoiceNumber}`,
      title: "Your proforma invoice",
      body: `Your approved bid proforma ${invoice.invoiceNumber} is attached (Rentfoxxy).`,
      attachment: { filename: `${invoice.invoiceNumber}.pdf`, content: buffer },
    });
  }

  return { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
}

export async function createCreditNoteForOrder(orderId: string): Promise<{
  invoiceId: string;
  invoiceNumber: string;
} | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { listing: { include: { product: true } } } },
      address: true,
      customer: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!order) return null;
  if (order.status !== "REFUNDED" && order.status !== "CANCELLED") {
    throw new Error("Order must be REFUNDED or CANCELLED to issue a credit note");
  }

  const taxInv = await prisma.invoice.findFirst({ where: { orderId, type: "TAX" } });
  if (!taxInv) throw new Error("Original tax invoice not found");

  const existingCn = await prisma.invoice.findFirst({ where: { orderId, type: "CREDIT_NOTE" } });
  if (existingCn) {
    await persistPdfIfMissing(existingCn.invoiceNumber, async () => {
      const settings = await loadPlatformCompany();
      const props = buildOrderPdfProps(
        order,
        settings,
        "CREDIT_NOTE",
        existingCn.invoiceNumber,
        existingCn.issuedAt,
        taxInv.invoiceNumber,
      );
      return pdfBufferForProps(props);
    });
    return { invoiceId: existingCn.id, invoiceNumber: existingCn.invoiceNumber };
  }

  const settings = await loadPlatformCompany();
  const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const invoiceNumber = await allocateInvoiceNumber(tx, "CREDIT_NOTE");
    return tx.invoice.create({
      data: {
        orderId,
        invoiceNumber,
        type: "CREDIT_NOTE",
        referencesTaxInvoiceId: taxInv.id,
      },
    });
  });

  const props = buildOrderPdfProps(
    order,
    settings,
    "CREDIT_NOTE",
    invoice.invoiceNumber,
    invoice.issuedAt,
    taxInv.invoiceNumber,
  );
  const buffer = await pdfBufferForProps(props);
  await writeInvoicePdf(invoice.invoiceNumber, buffer);

  const cnTo = order.customer.user.email;
  if (cnTo) {
    void sendSimpleAttachmentEmail({
      to: cnTo,
      subject: `Credit note ${invoice.invoiceNumber}`,
      preview: `Credit note ${invoice.invoiceNumber}`,
      title: "Your credit note",
      body: `Your credit note ${invoice.invoiceNumber} for order ${order.orderNumber} is attached (Rentfoxxy).`,
      attachment: { filename: `${invoice.invoiceNumber}.pdf`, content: buffer },
    });
  }

  return { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
}

export async function getOrRenderInvoicePdf(invoiceNumber: string): Promise<Buffer | null> {
  const existing = await readInvoicePdfIfExists(invoiceNumber);
  if (existing) return existing;

  const inv = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: {
      order: {
        include: {
          items: { include: { listing: { include: { product: true } } } },
          address: true,
          customer: { include: { user: { select: { name: true, email: true } } } },
        },
      },
      bid: {
        include: {
          listing: { include: { product: true } },
          customer: { include: { user: { select: { name: true, email: true } } } },
        },
      },
    },
  });
  if (!inv) return null;

  const settings = await loadPlatformCompany();

  if (inv.type === "TAX" || inv.type === "CREDIT_NOTE") {
    if (!inv.order) return null;
    const original =
      inv.type === "CREDIT_NOTE" && inv.referencesTaxInvoiceId
        ? (await prisma.invoice.findUnique({ where: { id: inv.referencesTaxInvoiceId } }))?.invoiceNumber
        : undefined;
    const props = buildOrderPdfProps(
      inv.order as OrderForInvoice,
      settings,
      inv.type,
      inv.invoiceNumber,
      inv.issuedAt,
      original,
    );
    const buf = await pdfBufferForProps(props);
    await writeInvoicePdf(inv.invoiceNumber, buf);
    return buf;
  }

  if (inv.type === "PROFORMA" && inv.bid) {
    const bid = inv.bid;
    const addr =
      (await prisma.address.findFirst({
        where: { userId: bid.customer.userId },
        orderBy: [{ isDefault: "desc" }, { label: "asc" }],
      })) ?? null;
    const shipState = addr?.state ?? settings.companyState;
    const ship = addr ?? {
      line1: "To be confirmed at checkout",
      line2: null as string | null,
      city: "—",
      state: shipState,
      pincode: "—",
    };
    const gst = classifyGst(settings.companyState, ship.state, bid.totalBidAmount);
    const props: RentfoxxyInvoicePdfProps = {
      docType: "PROFORMA",
      invoiceNumber: inv.invoiceNumber,
      issuedAt: inv.issuedAt,
      company: {
        name: settings.companyName,
        address: settings.address,
        gstin: settings.gstin,
        pan: settings.pan,
        email: settings.companyEmail,
        phone: settings.companyPhone,
      },
      customer: {
        name: bid.customer.user.name ?? bid.customer.user.email,
        companyName: bid.customer.companyName,
        gstin: bid.customer.gstin,
      },
      shipTo: {
        line1: ship.line1,
        line2: ship.line2,
        city: ship.city,
        state: ship.state,
        pincode: ship.pincode,
      },
      items: [
        {
          idx: 1,
          description: bid.listing.product.name,
          hsn: bid.listing.product.hsnCode || "8471",
          qty: bid.quantity,
          unitPrice: bid.bidPricePerUnit,
          amount: bid.totalBidAmount,
        },
      ],
      taxableSubtotal: bid.totalBidAmount,
      isInterState: gst.isInterState,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      grandTotal: gst.total,
      jurisdictionNote: jurisdictionLine(settings.address),
    };
    const buf = await pdfBufferForProps(props);
    await writeInvoicePdf(inv.invoiceNumber, buf);
    return buf;
  }

  return null;
}
