import { EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function PayoutReleased({
  vendorName,
  amountGross,
  orderNumber,
  utrNumber,
  commissionRate,
  commissionAmount,
  netAmount,
}: {
  vendorName: string;
  amountGross: string;
  orderNumber: string;
  utrNumber: string;
  commissionRate: string;
  commissionAmount: string;
  netAmount: string;
}) {
  return (
    <EmailLayout preview={`Payout released for ${orderNumber}`} title="Settlement summary">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {vendorName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        Your payout for order <strong>{orderNumber}</strong> has been released on Rentfoxxy.
      </Text>
      <table cellPadding="0" cellSpacing="0" style={{ width: "100%", fontSize: "14px", marginBottom: "8px" }}>
        <tbody>
          <tr>
            <td style={{ padding: "6px 0", color: "#64748b" }}>Order value (gross)</td>
            <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600 }}>{amountGross}</td>
          </tr>
          <tr>
            <td style={{ padding: "6px 0", color: "#64748b" }}>Platform fee ({commissionRate})</td>
            <td style={{ padding: "6px 0", textAlign: "right" }}>− {commissionAmount}</td>
          </tr>
          <tr style={{ borderTop: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 0", fontWeight: 700 }}>Net credited</td>
            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700 }}>{netAmount}</td>
          </tr>
        </tbody>
      </table>
      <Text style={{ fontSize: "14px", color: "#334155", margin: "16px 0 0" }}>
        Bank reference (UTR): <strong>{utrNumber}</strong>
      </Text>
    </EmailLayout>
  );
}
