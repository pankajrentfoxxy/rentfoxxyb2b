import { EmailLayout } from "@/emails/EmailLayout";
import { Text } from "@react-email/components";
import { render } from "@react-email/render";
import { fromEmail, getResend } from "@/lib/resend";
import * as React from "react";

export type EmailAttachment = { filename: string; content: Buffer };

export async function sendEmail(input: {
  to: string;
  subject: string;
  react: React.ReactElement;
  attachments?: EmailAttachment[];
}) {
  if (!process.env.RESEND_API_KEY || !input.to) return;
  try {
    const html = await render(input.react);
    const resend = getResend();
    await resend.emails.send({
      from: fromEmail(),
      to: input.to,
      subject: input.subject,
      html,
      attachments: input.attachments,
    });
  } catch {
    /* optional channel */
  }
}

export async function sendSimpleAttachmentEmail(input: {
  to: string;
  subject: string;
  preview: string;
  title: string;
  body: string;
  attachment: EmailAttachment;
}) {
  await sendEmail({
    to: input.to,
    subject: input.subject,
    react: React.createElement(
      EmailLayout,
      { preview: input.preview, title: input.title },
      React.createElement(Text, { style: { fontSize: "15px", color: "#334155", lineHeight: "24px" } }, input.body),
    ),
    attachments: [input.attachment],
  });
}
