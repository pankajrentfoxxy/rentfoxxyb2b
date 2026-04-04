import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

const foxSvg =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect fill="#0F2D5E" width="40" height="40" rx="8"/><path fill="#FBBF24" d="M12 22c2-6 8-10 14-8 2 5-1 12-8 14-4-2-6-4-6-6z"/></svg>`,
  );

export function EmailLayout({
  preview,
  title,
  children = null,
}: {
  preview: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ fontFamily: "'Georgia', 'Times New Roman', serif", backgroundColor: "#f1f5f9", margin: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 16px" }}>
          <Section
            style={{
              backgroundColor: "#0F2D5E",
              padding: "20px 24px",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "middle" }}>
                    <Img src={foxSvg} width="36" height="36" alt="" style={{ display: "inline-block" }} />
                    <Heading
                      as="h1"
                      style={{
                        color: "#fff",
                        fontSize: "20px",
                        margin: "0 0 0 12px",
                        display: "inline-block",
                        verticalAlign: "middle",
                        fontWeight: 600,
                      }}
                    >
                      Rentfoxxy
                    </Heading>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>
          <Section
            style={{
              backgroundColor: "#ffffff",
              padding: "28px 24px",
              borderRadius: "0 0 8px 8px",
              border: "1px solid #e2e8f0",
              borderTop: "none",
            }}
          >
            <Heading as="h2" style={{ color: "#0f172a", fontSize: "18px", margin: "0 0 16px" }}>
              {title}
            </Heading>
            {children}
            <Text
              style={{
                color: "#64748b",
                fontSize: "12px",
                marginTop: "28px",
                borderTop: "1px solid #e2e8f0",
                paddingTop: "16px",
              }}
            >
              This email was sent by Rentfoxxy Technology Pvt. Ltd. B2B marketplace communications.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: "#F59E0B",
        color: "#0f172a",
        fontWeight: 600,
        padding: "12px 24px",
        borderRadius: "8px",
        textDecoration: "none",
        marginTop: "12px",
      }}
    >
      {children}
    </Link>
  );
}
