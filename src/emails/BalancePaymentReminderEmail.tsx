import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function BalancePaymentReminderEmail({
  customerName,
  orderNumber,
  balanceAmount,
  balanceDueAt,
  urgency,
  ordersUrl,
}: {
  customerName: string;
  orderNumber: string;
  balanceAmount: string;
  balanceDueAt: string;
  urgency: "48h" | "24h" | "2h";
  ordersUrl: string;
}) {
  const headline =
    urgency === "2h"
      ? "Urgent: balance due in about 2 hours"
      : urgency === "24h"
        ? "Reminder: balance due within 24 hours"
        : "Reminder: balance due within 48 hours (7-day window)";
  return (
    <EmailLayout preview={headline} title={headline}>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        Order <strong>{orderNumber}</strong> — please pay the remaining <strong>{balanceAmount}</strong> by{" "}
        <strong>{balanceDueAt}</strong> to keep your reservation.
      </Text>
      {urgency === "2h" ? (
        <Text style={{ fontSize: "14px", color: "#b91c1c", margin: "0 0 16px" }}>
          Missing the deadline may result in forfeiture of your token amount (5% non-refundable per policy).
        </Text>
      ) : null}
      <EmailButton href={ordersUrl}>Pay balance now</EmailButton>
    </EmailLayout>
  );
}
