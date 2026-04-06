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
