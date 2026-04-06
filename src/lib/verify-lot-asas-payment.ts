import { getPaymentOptionConfig, parsePaymentOption, roundMoney } from "@/constants/payment-options";
import { asasInventoryCap } from "@/lib/asas-inventory";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { allowInstantPaymentBypass, isRazorpayConfigured } from "@/lib/payment-env";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

type VerifyInput = {
  userId: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  devBypass?: boolean;
};

function verifySignature(
  secret: string | undefined,
  orderId: string | undefined,
  payId: string | undefined,
  sig: string | undefined,
  devBypass: boolean | undefined,
): { ok: boolean; error?: string } {
  if (devBypass) {
    if (process.env.NODE_ENV === "production") return { ok: false, error: "Invalid request" };
    if (isRazorpayConfigured()) return { ok: false, error: "Use Razorpay checkout" };
    if (!allowInstantPaymentBypass()) return { ok: false, error: "Set PAYMENT_DEV_BYPASS=true for local demo" };
    return { ok: true };
  }
  if (!secret) return { ok: false, error: "Payment not configured" };
  if (!orderId || !payId || !sig) return { ok: false, error: "Missing Razorpay fields" };
  const payload = `${orderId}|${payId}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (expected !== sig) return { ok: false, error: "Invalid signature" };
  return { ok: true };
}

export async function verifyLotPurchasePayment(
  lotPurchaseId: string,
  input: VerifyInput,
): Promise<Record<string, unknown> & { httpStatus?: number }> {
  const purchase = await prisma.lotPurchase.findFirst({
    where: {
      id: lotPurchaseId,
      customer: { userId: input.userId },
      status: "PENDING_PAYMENT",
    },
    include: { lot: true, customer: { include: { user: true } } },
  });

  if (!purchase) {
    return { error: "Purchase not found", httpStatus: 404 };
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const sigCheck = verifySignature(
    secret,
    input.razorpay_order_id,
    input.razorpay_payment_id,
    input.razorpay_signature,
    input.devBypass,
  );
  if (!sigCheck.ok) return { error: sigCheck.error ?? "Verify failed", httpStatus: 400 };

  const payOpt = parsePaymentOption(purchase.paymentOption);
  const cfg = getPaymentOptionConfig(payOpt);
  const isToken = payOpt !== "FULL";
  const grand = purchase.grandTotal ?? 0;
  const firstCharge = isToken ? roundMoney(grand * (cfg.tokenPct / 100)) : grand;

  await prisma.$transaction(async (tx) => {
    const newSold = purchase.lot.lotsSold + purchase.lotsCount;
    await tx.lotListing.update({
      where: { id: purchase.lotId },
      data: {
        lotsSold: newSold,
        status: newSold >= purchase.lot.totalLots ? "SOLD_OUT" : "LIVE",
      },
    });

    if (!isToken) {
      await tx.lotPurchase.update({
        where: { id: purchase.id },
        data: {
          status: "PAID",
          amountPaid: grand,
          paymentId: input.razorpay_payment_id ?? `dev_${purchase.id}`,
        },
      });
    } else {
      const due =
        purchase.balanceDueAt ??
        new Date(Date.now() + cfg.windowHours * 3600 * 1000);
      await tx.lotPurchase.update({
        where: { id: purchase.id },
        data: {
          status: "TOKEN_PAID",
          amountPaid: firstCharge,
          tokenAmount: firstCharge,
          balanceDueAt: due,
          paymentId: input.razorpay_payment_id ?? `dev_tok_${purchase.id}`,
        },
      });
    }
  });

  const refreshed = await prisma.lotPurchase.findUnique({ where: { id: purchase.id } });
  const balanceAmount =
    refreshed?.status === "TOKEN_PAID"
      ? roundMoney((refreshed.grandTotal ?? 0) - (refreshed.tokenAmount ?? 0))
      : null;

  if (purchase.customer.userId) {
    await createNotification({
      userId: purchase.customer.userId,
      type: NOTIFICATION_TYPES.ORDER_PLACED,
      title: isToken ? "Token received — lot reserved" : "Lot purchase confirmed",
      message: isToken
        ? `Pay balance ₹${(balanceAmount ?? 0).toLocaleString("en-IN")} by ${(refreshed?.balanceDueAt ?? new Date()).toLocaleString("en-IN")}.`
        : `Your purchase ${refreshed?.reference ?? ""} for ${purchase.lotsCount} lot(s) is confirmed.`,
      link: `/customer/lot-purchases/${purchase.id}`,
    });
  }

  return {
    ok: true,
    success: true,
    orderId: purchase.id,
    purchaseId: purchase.id,
    reference: refreshed?.reference,
    nextStep: isToken ? "BALANCE_PAYMENT" : "COMPLETE",
    balanceDueAt: refreshed?.balanceDueAt?.toISOString() ?? null,
    balanceAmount,
    httpStatus: 200,
  };
}

export async function verifyAsAsPurchasePayment(
  asasPurchaseId: string,
  input: VerifyInput,
): Promise<Record<string, unknown> & { httpStatus?: number }> {
  const purchase = await prisma.asAsPurchase.findFirst({
    where: {
      id: asasPurchaseId,
      customer: { userId: input.userId },
      status: "PENDING_PAYMENT",
    },
    include: {
      asas: { include: { items: { select: { count: true } } } },
      customer: { include: { user: true } },
    },
  });

  if (!purchase) {
    return { error: "Purchase not found", httpStatus: 404 };
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const sigCheck = verifySignature(
    secret,
    input.razorpay_order_id,
    input.razorpay_payment_id,
    input.razorpay_signature,
    input.devBypass,
  );
  if (!sigCheck.ok) return { error: sigCheck.error ?? "Verify failed", httpStatus: 400 };

  const payOpt = parsePaymentOption(purchase.paymentOption);
  const cfg = getPaymentOptionConfig(payOpt);
  const isToken = payOpt !== "FULL";
  const grand = purchase.grandTotal ?? 0;
  const firstCharge = isToken ? roundMoney(grand * (cfg.tokenPct / 100)) : grand;

  await prisma.$transaction(async (tx) => {
    const cap = asasInventoryCap(purchase.asas, purchase.asas.items);
    const newSold = purchase.asas.unitsSold + purchase.quantity;
    await tx.asAsListing.update({
      where: { id: purchase.asasId },
      data: {
        totalUnits: cap,
        unitsSold: newSold,
        status: newSold >= cap ? "SOLD_OUT" : "LIVE",
      },
    });

    if (!isToken) {
      await tx.asAsPurchase.update({
        where: { id: purchase.id },
        data: {
          status: "PAID",
          amountPaid: grand,
          paymentId: input.razorpay_payment_id ?? `dev_${purchase.id}`,
        },
      });
    } else {
      const due =
        purchase.balanceDueAt ?? new Date(Date.now() + cfg.windowHours * 3600 * 1000);
      await tx.asAsPurchase.update({
        where: { id: purchase.id },
        data: {
          status: "TOKEN_PAID",
          amountPaid: firstCharge,
          tokenAmount: firstCharge,
          balanceDueAt: due,
          paymentId: input.razorpay_payment_id ?? `dev_tok_${purchase.id}`,
        },
      });
    }
  });

  const refreshed = await prisma.asAsPurchase.findUnique({ where: { id: purchase.id } });
  const balanceAmount =
    refreshed?.status === "TOKEN_PAID"
      ? roundMoney((refreshed.grandTotal ?? 0) - (refreshed.tokenAmount ?? 0))
      : null;

  if (purchase.customer.userId) {
    await createNotification({
      userId: purchase.customer.userId,
      type: NOTIFICATION_TYPES.ORDER_PLACED,
      title: isToken ? "Token received — AsAs reserved" : "AsAs purchase confirmed",
      message: isToken
        ? `Pay balance ₹${(balanceAmount ?? 0).toLocaleString("en-IN")}.`
        : `Purchase ${refreshed?.reference ?? ""} confirmed.`,
      link: `/customer/asas-purchases/${purchase.id}`,
    });
  }

  return {
    ok: true,
    success: true,
    orderId: purchase.id,
    purchaseId: purchase.id,
    reference: refreshed?.reference,
    nextStep: isToken ? "BALANCE_PAYMENT" : "COMPLETE",
    balanceDueAt: refreshed?.balanceDueAt?.toISOString() ?? null,
    balanceAmount,
    httpStatus: 200,
  };
}
