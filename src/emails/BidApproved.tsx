import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Section, Text } from "@react-email/components";
import * as React from "react";

export function BidApproved({
  customerName,
  productName,
  quantity,
  approvedPricePerUnit,
  totalAmount,
  savingsPerUnit,
  expiresAt,
  paymentLink,
}: {
  customerName: string;
  productName: string;
  quantity: number;
  approvedPricePerUnit: string;
  totalAmount: string;
  savingsPerUnit: string | null;
  expiresAt: string;
  paymentLink: string;
}) {
  return (
    <EmailLayout preview="Your price request was approved" title="Great news!">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        Your price request has been approved on Rentfoxxy. Complete payment before the offer window closes to secure
        your allocation.
      </Text>
      <Section
        style={{
          backgroundColor: "#eff6ff",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px",
          border: "1px solid #bfdbfe",
        }}
      >
        <Text style={{ fontSize: "14px", color: "#1e3a8a", margin: "0 0 8px", fontWeight: 600 }}>
          {productName}
        </Text>
        <Text style={{ fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>
          Quantity: <strong>{quantity}</strong>
        </Text>
        <Text style={{ fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>
          Approved price: <strong>{approvedPricePerUnit}</strong> per unit
        </Text>
        <Text style={{ fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>
          Total (excl. GST at checkout): <strong>{totalAmount}</strong>
        </Text>
        <Text style={{ fontSize: "13px", color: "#64748b", margin: "8px 0 0" }}>Pay before: {expiresAt}</Text>
      </Section>
      {savingsPerUnit ? (
        <Text
          style={{
            fontSize: "15px",
            color: "#15803d",
            fontWeight: 600,
            margin: "0 0 16px",
            backgroundColor: "#ecfdf5",
            padding: "12px 14px",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
          }}
        >
          You save {savingsPerUnit} per unit on this approved rate.
        </Text>
      ) : null}
      <EmailButton href={paymentLink}>Complete payment</EmailButton>
    </EmailLayout>
  );
}
