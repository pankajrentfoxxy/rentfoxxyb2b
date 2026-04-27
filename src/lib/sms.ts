import twilio from "twilio";

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; mock?: boolean }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (process.env.NODE_ENV !== "production" || !sid || !token || !from) {
    console.log(`[SMS MOCK] To: ${to}\nMessage: ${message}`);
    return { success: true, mock: true };
  }

  try {
    const client = twilio(sid, token);
    await client.messages.create({ body: message, from, to });
    return { success: true };
  } catch (err) {
    console.error("[SMS] failed:", err);
    return { success: false };
  }
}

export type SendSmsOtpResult = { ok: boolean; mocked: boolean };

/**
 * India OTP — MSG91 v5 (Addendum v1.8).
 * In development, or without MSG91 env in production, logs OTP and returns mocked (no carrier delivery).
 */
export async function sendSMSOTP(phone10: string, otp: string): Promise<SendSmsOtpResult> {
  const mobile = phone10.replace(/\D/g, "").slice(-10);
  const key = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (process.env.NODE_ENV !== "production" || !key || !templateId) {
    console.log(`[SMS OTP MOCK] +91${mobile}: ${otp}`);
    return { ok: true, mocked: true };
  }

  try {
    const response = await fetch("https://api.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: key,
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile: `91${mobile}`,
        otp,
        authkey: key,
      }),
    });
    const data = (await response.json()) as { type?: string; message?: string };
    if (data.type !== "success") {
      console.error("[MSG91 OTP]", data);
    }
    return { ok: data.type === "success", mocked: false };
  } catch (err) {
    console.error("[MSG91 OTP] failed:", err);
    return { ok: false, mocked: false };
  }
}
