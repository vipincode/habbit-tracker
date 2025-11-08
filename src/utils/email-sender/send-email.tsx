import ENV from "../../config/env";
import { VerificationEmail } from "../../emails/VerificationEmail";
import { sendEmail } from "./resend-sender";

export async function sendVerificationEmail(email: string, verificationUrl: string) {
  const appName = ENV.APP_NAME;

  return sendEmail({
    to: email,
    subject: "Verify your email address",
    react: <VerificationEmail email={email} verificationUrl={verificationUrl} appName={appName} />,
  });
}
