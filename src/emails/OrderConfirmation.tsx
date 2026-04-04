import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";

export type OrderConfirmationLine = {
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export function OrderConfirmation({
  customerName,
  orderNumber,
  orderId,
  items,
  total,
  deliveryAddress,
  appBaseUrl,
}: {
  customerName: string;
  orderNumber: string;
  orderId: string;
  items: OrderConfirmationLine[];
  total: string;
  deliveryAddress: string;
  appBaseUrl: string;
}) {
  const trackUrl = `${appBaseUrl}/customer/orders/${orderId}`;
  return (
    <EmailLayout preview={`Order ${orderNumber} confirmed`} title="Thank you for your order!">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        We&apos;ve received your order and payment is confirmed. Here&apos;s a quick summary.
      </Text>
      <Section
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <table cellPadding="0" cellSpacing="0" style={{ width: "100%", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", color: "#475569" }}>Item</th>
              <th style={{ textAlign: "right", padding: "10px 12px", color: "#475569" }}>Qty</th>
              <th style={{ textAlign: "right", padding: "10px 12px", color: "#475569" }}>Price</th>
              <th style={{ textAlign: "right", padding: "10px 12px", color: "#475569" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={i} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ padding: "10px 12px", color: "#0f172a" }}>{row.name}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#334155" }}>{row.quantity}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#334155" }}>{row.unitPrice}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#0f172a", fontWeight: 600 }}>
                  {row.lineTotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Text style={{ fontSize: "16px", color: "#0f172a", fontWeight: 700, margin: "16px 0 8px", textAlign: "right" }}>
        Total: {total}
      </Text>
      <Hr style={{ borderColor: "#e2e8f0", margin: "16px 0" }} />
      <Text style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px", fontWeight: 600 }}>
        Ship to
      </Text>
      <Text style={{ fontSize: "14px", color: "#334155", lineHeight: "22px", whiteSpace: "pre-line" as const }}>
        {deliveryAddress}
      </Text>
      <EmailButton href={trackUrl}>Track your order</EmailButton>
    </EmailLayout>
  );
}
