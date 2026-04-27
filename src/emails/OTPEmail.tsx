import { EmailLayout } from "@/emails/EmailLayout";
import { Section, Text } from "@react-email/components";
import * as React from "react";

export type OtpEmailPurpose = "email_verify" | "mobile_verify" | "login";

const titles: Record<OtpEmailPurpose, string> = {
  email_verify: "Verify your email",
  mobile_verify: "Your OTP code",
  login: "Your login code",
};

export function OTPEmail({ otp, purpose }: { otp: string; purpose: OtpEmailPurpose }) {
  return (
    <EmailLayout preview="Your Rentfoxxy verification code" title={titles[purpose]}>
      <Section
        style={{
          background: "#0A1628",
          borderRadius: 8,
          padding: "20px 24px",
          marginBottom: 24,
        }}
      >
        <Text style={{ color: "#F8FAFC", fontSize: 18, fontWeight: 600, margin: 0 }}>
          {titles[purpose]}
        </Text>
      </Section>
      <Text style={{ fontSize: "15px", color: "#334155", lineHeight: "24px", margin: "0 0 16px" }}>
        Use this code to continue:
      </Text>
      <div
        style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          padding: "16px 24px",
          textAlign: "center" as const,
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: 8,
          color: "#0A1628",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          marginBottom: 16,
        }}
      >
        {otp}
      </div>
      <Text style={{ fontSize: "13px", color: "#64748b", lineHeight: "22px", margin: "0 0 8px" }}>
        Valid for 10 minutes. Do not share this code.
      </Text>
      <Text style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "22px", margin: 0 }}>
        If you did not request this, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
