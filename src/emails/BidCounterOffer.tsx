import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function BidCounterOffer({
  customerName,
  productName,
  counterPricePerUnit,
  bidUrl,
}: {
  customerName: string;
  productName: string;
  counterPricePerUnit: string;
  bidUrl: string;
}) {
  return (
    <EmailLayout preview="Counter-offer on your bid" title="A new price is available">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        There&apos;s a counter-offer on your request for <strong>{productName}</strong>:{" "}
        <strong>{counterPricePerUnit}</strong> per unit. Open your bid to accept or decline.
      </Text>
      <EmailButton href={bidUrl}>Review bid</EmailButton>
    </EmailLayout>
  );
}
