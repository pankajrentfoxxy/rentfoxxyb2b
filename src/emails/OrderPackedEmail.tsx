import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function OrderPackedEmail({
  customerName,
  orderNumber,
  trackUrl,
}: {
  customerName: string;
  orderNumber: string;
  trackUrl: string;
}) {
  return (
    <EmailLayout preview={`${orderNumber} is being packed`} title="Your order is being packed">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        Good news — order <strong>{orderNumber}</strong> has been packed and is getting ready for dispatch.
      </Text>
      <EmailButton href={trackUrl}>Track order</EmailButton>
    </EmailLayout>
  );
}
