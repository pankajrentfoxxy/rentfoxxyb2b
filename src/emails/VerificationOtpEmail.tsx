import { EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import * as React from "react";

export function VerificationOtpEmail({ otp }: { otp: string }) {
  return (
    <EmailLayout preview="Your Rentfoxxy verification code" title="Verify your email">
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        Use this one-time code to complete your registration:
      </Text>
      <Text
        style={{
          fontSize: "28px",
          letterSpacing: "0.2em",
          fontWeight: 700,
          color: "#0f172a",
          margin: "0 0 16px",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {otp}
      </Text>
      <Text style={{ fontSize: "13px", color: "#64748b", lineHeight: "22px", margin: 0 }}>
        This code expires in 15 minutes. If you didn&apos;t request it, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}
