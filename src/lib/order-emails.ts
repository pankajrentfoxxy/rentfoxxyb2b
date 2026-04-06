import { BalancePaymentReminderEmail } from "@/emails/BalancePaymentReminderEmail";
import { TokenForfeitedEmail } from "@/emails/TokenForfeitedEmail";
import { TokenPaymentConfirmation } from "@/emails/TokenPaymentConfirmation";
import { sendEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/app-url";
import { roundMoney } from "@/constants/payment-options";
import { prisma } from "@/lib/prisma";
import * as React from "react";

export async function sendTokenPaymentConfirmationMail(orderId: string) {
  const o = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { include: { user: true } } },
  });
  if (!o?.customer.user.email) return;

  const base = getAppBaseUrl();
  const name = o.customer.user.name ?? o.customer.user.email;
  const tok = o.tokenAmount ?? 0;
  const bal = roundMoney(o.totalAmount - tok);
  const dueStr = (o.balanceDueAt ?? new Date()).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  void sendEmail({
    to: o.customer.user.email,
    subject: `Token received — complete balance for ${o.orderNumber}`,
    react: React.createElement(TokenPaymentConfirmation, {
      customerName: name,
      orderNumber: o.orderNumber,
      tokenAmount: `₹${tok.toLocaleString("en-IN")}`,
      balanceAmount: `₹${bal.toLocaleString("en-IN")}`,
      balanceDueAt: dueStr,
      ordersUrl: `${base}/customer/orders/${o.id}`,
    }),
  });
}

export async function sendBalanceReminderMail(
  orderId: string,
  urgency: "12h" | "2h",
  orderNumber: string,
  customerEmail: string,
  customerName: string | null,
  balanceAmount: number,
  balanceDueAt: Date,
) {
  const base = getAppBaseUrl();
  void sendEmail({
    to: customerEmail,
    subject:
      urgency === "2h"
        ? `Urgent: pay balance for ${orderNumber} (deadline soon)`
        : `Reminder: balance due soon — ${orderNumber}`,
    react: React.createElement(BalancePaymentReminderEmail, {
      customerName: customerName ?? customerEmail,
      orderNumber,
      balanceAmount: `₹${balanceAmount.toLocaleString("en-IN")}`,
      balanceDueAt: balanceDueAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      urgency,
      ordersUrl: `${base}/customer/orders/${orderId}`,
    }),
  });
}

export async function sendTokenForfeitedMail(orderId: string) {
  const o = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { include: { user: true } } },
  });
  if (!o?.customer.user.email) return;

  const base = getAppBaseUrl();
  const name = o.customer.user.name ?? o.customer.user.email;
  void sendEmail({
    to: o.customer.user.email,
    subject: `Reservation expired — ${o.orderNumber}`,
    react: React.createElement(TokenForfeitedEmail, {
      customerName: name,
      orderNumber: o.orderNumber,
      ordersUrl: `${base}/customer/orders/${o.id}`,
    }),
  });
}
