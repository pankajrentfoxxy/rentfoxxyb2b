import { EmailButton, EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function OrderDispatched({
  customerName,
  orderNumber,
  carrier,
  awb,
  trackingUrl,
  estimatedDelivery,
  trackPortalUrl,
}: {
  customerName: string;
  orderNumber: string;
  carrier: string;
  awb: string;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  trackPortalUrl: string;
}) {
  return (
    <EmailLayout preview={`Order ${orderNumber} is on the way`} title="Your order is on its way!">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 12px" }}>
        Hi {customerName},
      </Text>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        Order <strong>{orderNumber}</strong> has been handed over to our logistics partner and is en route.
      </Text>
      <Text style={{ fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>
        Carrier: <strong>{carrier}</strong>
      </Text>
      <Text style={{ fontSize: "14px", color: "#334155", margin: "0 0 4px" }}>
        Tracking reference: <strong>{awb}</strong>
      </Text>
      {estimatedDelivery ? (
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "8px 0 16px" }}>
          Estimated delivery (indicative): {estimatedDelivery}
        </Text>
      ) : (
        <Text style={{ marginBottom: "16px" }} />
      )}
      {trackingUrl ? (
        <Text style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px" }}>
          <a href={trackingUrl} style={{ color: "#2563eb" }}>
            Open carrier tracking page
          </a>
        </Text>
      ) : null}
      <EmailButton href={trackPortalUrl}>Track your order</EmailButton>
    </EmailLayout>
  );
}
