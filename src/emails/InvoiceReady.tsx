import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function InvoiceReady({
  customerName,
  invoiceNumber,
  orderNumber,
  amount,
  invoicesUrl,
}: {
  customerName: string;
  invoiceNumber: string;
  orderNumber: string;
  amount: string;
  invoicesUrl: string;
}) {
  return (
    <EmailLayout preview={`Tax invoice ${invoiceNumber}`} title="Your tax invoice is ready">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        Your tax invoice <strong>{invoiceNumber}</strong> for order <strong>{orderNumber}</strong> is attached
        (PDF). Amount: <strong>{amount}</strong>.
      </Text>
      <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 12px" }}>
        Keep the PDF for your GST records. You can also download copies anytime from your account.
      </Text>
      <EmailButton href={invoicesUrl}>View invoices</EmailButton>
    </EmailLayout>
  );
}
