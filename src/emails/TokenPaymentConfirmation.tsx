import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function TokenPaymentConfirmation({
  customerName,
  orderNumber,
  tokenAmount,
  balanceAmount,
  balanceDueAt,
  ordersUrl,
}: {
  customerName: string;
  orderNumber: string;
  tokenAmount: string;
  balanceAmount: string;
  balanceDueAt: string;
  ordersUrl: string;
}) {
  return (
    <EmailLayout preview={`Token received for ${orderNumber}`} title="Stock reserved">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        We&apos;ve received your <strong>{tokenAmount}</strong> token payment for order{" "}
        <strong>{orderNumber}</strong>. Your stock is reserved.
      </Text>
      <Text style={{ fontSize: "15px", color: "#0f172a", fontWeight: 600, margin: "0 0 8px" }}>
        Balance due: {balanceAmount}
      </Text>
      <Text style={{ fontSize: "14px", color: "#b45309", margin: "0 0 16px" }}>
        Pay the balance by <strong>{balanceDueAt}</strong>. If the deadline passes, the token is
        non-refundable and the reservation may be released.
      </Text>
      <EmailButton href={ordersUrl}>Pay balance</EmailButton>
    </EmailLayout>
  );
}
