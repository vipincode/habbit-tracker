import * as React from "react";
import { Container, Button } from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  email: string;
}

// Template
export default function WelcomeEmail({ name, email }: WelcomeEmailProps) {
  return (
    <Container>
      <Button href="https://example.com" style={{ color: "#61dafb" }}>
        Click me - {name} - {email}
      </Button>
    </Container>
  );
}
