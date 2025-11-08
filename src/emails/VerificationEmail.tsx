import React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
} from "@react-email/components";

interface VerificationEmailProps {
  email: string;
  verificationUrl: string;
  appName?: string;
  logoUrl?: string | null;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({
  email,
  verificationUrl,
  appName = "My App",
  logoUrl = null,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email for {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Section style={{ padding: "24px 0", textAlign: "center" }}>
              <Img src={logoUrl} alt={appName} width="96" height="96" />
            </Section>
          )}

          <Section style={{ padding: "12px 0" }}>
            <Text style={h1}>Verify your email</Text>
            <Text style={paragraph}>
              Hi {email.split("@")[0] || ""}, please confirm your email address to activate your{" "}
              {appName} account.
            </Text>
          </Section>

          <Section style={{ padding: "12px 0", textAlign: "center" }}>
            <Button
              href={verificationUrl}
              target="_blank"
              rel="noopener"
              style={{
                ...button,
                padding: "12px 20px",
                display: "inline-block",
              }}
            >
              Verify email
            </Button>
          </Section>

          <Section style={{ padding: "12px 0" }}>
            <Text style={paragraph}>
              If the button doesn’t work, paste this link into your browser:
            </Text>
            <Text style={muted}>
              <a href={verificationUrl} style={link}>
                {verificationUrl}
              </a>
            </Text>
          </Section>

          <Hr style={{ borderColor: "#eaeaea", margin: "20px 0" }} />

          <Section style={{ padding: "12px 0" }}>
            <Text style={small}>
              If you didn’t create an account with {appName}, you can ignore this email. This
              verification link will expire in 1 hour.
            </Text>
            <Text style={footer}>— {appName} team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

/* Inline styles (kept simple for email clients) */
const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 8,
  margin: "40px auto",
  padding: "24px",
  maxWidth: 560,
};

const h1: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  margin: "0 0 8px",
};

const paragraph: React.CSSProperties = {
  fontSize: 15,
  lineHeight: "22px",
  margin: "8px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#2563eb",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: 6,
  display: "inline-block",
  fontWeight: 600,
};

const muted: React.CSSProperties = {
  fontSize: 13,
  color: "#555",
  wordBreak: "break-all",
};

const small: React.CSSProperties = {
  fontSize: 12,
  color: "#666",
};

const footer: React.CSSProperties = {
  fontSize: 13,
  color: "#333",
  marginTop: 8,
};

const link: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
};
