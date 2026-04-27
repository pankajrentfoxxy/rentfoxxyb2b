import { EmailLayout } from "@/emails/EmailLayout";
import { absoluteAppPath } from "@/lib/app-url";
import { Text } from "@react-email/components";
import * as React from "react";

export function PriceAlertEmail({
  productName,
  productSlug,
  currentPrice,
  targetPrice,
}: {
  productName: string;
  productSlug: string;
  currentPrice: number;
  targetPrice: number;
}) {
  const url = absoluteAppPath(`/products/${productSlug}`);
  return (
    <EmailLayout preview={`Price alert: ${productName}`} title="Price drop alert">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px" }}>
        Good news — <strong>{productName}</strong> is now at{" "}
        <strong>₹{currentPrice.toLocaleString("en-IN")}</strong> per unit (lowest active listing), at or below your
        target of ₹{targetPrice.toLocaleString("en-IN")}.
      </Text>
      <Text style={{ fontSize: "14px", color: "#1D4ED8", marginTop: 16 }}>
        <a href={url} style={{ color: "#1D4ED8" }}>
          View product →
        </a>
      </Text>
    </EmailLayout>
  );
}
