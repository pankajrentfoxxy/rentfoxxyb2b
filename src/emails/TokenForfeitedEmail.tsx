import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function TokenForfeitedEmail({
  customerName,
  orderNumber,
  ordersUrl,
}: {
  customerName: string;
  orderNumber: string;
  ordersUrl: string;
}) {
  return (
    <EmailLayout preview={`Reservation released — ${orderNumber}`} title="Balance deadline passed">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        The balance for order <strong>{orderNumber}</strong> was not paid by the deadline. The reservation has
        been released and any token paid is non-refundable per the terms you accepted at checkout.
      </Text>
      <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 16px" }}>
        You can still place a new order or bid from the catalog anytime.
      </Text>
      <EmailButton href={ordersUrl}>View order details</EmailButton>
    </EmailLayout>
  );
}
