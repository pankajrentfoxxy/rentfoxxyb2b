import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function OrderDeliveredEmail({
  customerName,
  orderNumber,
  orderUrl,
}: {
  customerName: string;
  orderNumber: string;
  orderUrl: string;
}) {
  return (
    <EmailLayout preview={`${orderNumber} delivered`} title="Your order was delivered">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        Order <strong>{orderNumber}</strong> has been marked <strong>delivered</strong>. We hope everything
        arrived as expected.
      </Text>
      <Text style={{ fontSize: "14px", color: "#64748b", lineHeight: "22px", margin: "0 0 16px" }}>
        You&apos;ll be able to leave a short product review from your order page for a few days — it helps
        other B2B buyers choose with confidence.
      </Text>
      <EmailButton href={orderUrl}>Open order</EmailButton>
    </EmailLayout>
  );
}
