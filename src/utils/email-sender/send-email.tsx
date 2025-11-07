import { sendEmail } from "./resend-sender";
import WelcomeEmail from "../../emails/welcome-email";

// Send Welcome Email
export async function sendWelcomeEmail(to: string, name: string, email: string) {
  return sendEmail({
    to,
    subject: "Welcome to VipinCodeLabs 🎉",
    react: <WelcomeEmail name={name} email={email} />,
  });
}
