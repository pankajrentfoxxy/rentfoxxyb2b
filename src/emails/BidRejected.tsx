import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function BidRejected({
  customerName,
  productName,
  browseUrl,
}: {
  customerName: string;
  productName: string;
  browseUrl: string;
}) {
  return (
    <EmailLayout
      preview="Update on your price request"
      title="We could not accommodate your request at this time"
    >
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        We weren&apos;t able to move forward with your request for <strong>{productName}</strong> on this occasion.
        You can explore other listings and submit a new offer when it makes sense for your business.
      </Text>
      <EmailButton href={browseUrl}>Browse other options</EmailButton>
    </EmailLayout>
  );
}
