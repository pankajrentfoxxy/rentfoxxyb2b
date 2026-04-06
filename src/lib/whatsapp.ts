const WHATSAPP_API = "https://graph.facebook.com/v18.0";

export async function sendWhatsAppTemplate(input: {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: unknown[];
}): Promise<{ success: boolean; mock?: boolean }> {
  const { to, templateName, languageCode = "en", components = [] } = input;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[WA MOCK] To: ${to}, Template: ${templateName}`);
    return { success: true, mock: true };
  }

  const waToken = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!waToken || !phoneId) {
    console.log(`[WA SKIP] Missing WHATSAPP_TOKEN / WHATSAPP_PHONE_ID`);
    return { success: false };
  }

  const res = await fetch(`${WHATSAPP_API}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${waToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    }),
  });

  return res.ok ? { success: true } : { success: false };
}
