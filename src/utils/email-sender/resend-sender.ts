import { Resend } from "resend";
import { render } from "@react-email/render";
import ENV from "../../config/env";

const resend = new Resend(ENV.RESEND_API_KEY!);

interface SendEmailOptions {
  to: string;
  subject: string;
  react?: React.ReactElement; // React Email template
  html?: string; // Optional HTML content
  text?: string; // Optional plain text
  from?: string; // Override default sender
  replyTo?: string; // Optional reply-to address
}

export async function sendEmail({
  to,
  subject,
  react,
  html,
  text,
  from = "VipinCodeLabs <support@vipincodelabs.com>",
  replyTo,
}: SendEmailOptions) {
  try {
    const renderedHtml = html || (react ? await render(react) : "");

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html: renderedHtml,
      text,
      replyTo,
    });

    if (error) throw error;

    console.log("✅ Email sent successfully:", data);
    return data;
  } catch (err) {
    console.error("🟥 Failed to send email:", err);
    throw err;
  }
}
