import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const logoUrl =
  process.env.EMAIL_LOGO_URL || `${baseUrl}/lebenshilfe-muenchen-logo_2026.png`;

type Props = {
  preview: string;
  children: ReactNode;
};

export function BrandLayout({ preview, children }: Props) {
  return (
    <Html lang="de">
      <Head>
        <meta
          name="color-scheme"
          content="light"
        />
        <meta
          name="supported-color-schemes"
          content="light"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={card}>
          <Section style={header}>
            <Img
              src={logoUrl}
              alt="Lebenshilfe München"
              width="200"
              style={logo}
            />
          </Section>
          <Hr style={divider} />
          <Section style={content}>{children}</Section>
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerBrand}>Lebenshilfe München e.V.</Text>
            <Text style={footerSmall}>
              Diese E-Mail wurde automatisch versendet. Bei Fragen wenden Sie
              sich bitte an Ihre Ansprechperson.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#F5F5F5",
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: "40px 16px",
};

const card = {
  margin: "0 auto",
  maxWidth: "560px",
  width: "100%",
  backgroundColor: "#FFFFFF",
  borderRadius: "14px",
  border: "1px solid #E5E5E5",
  overflow: "hidden",
};

const header = {
  padding: "36px 40px 28px",
};

const logo = {
  height: "auto",
  display: "block",
};

const divider = {
  borderColor: "#EFEFEF",
  borderTopWidth: "1px",
  margin: 0,
};

const content = {
  padding: "36px 40px 32px",
};

const footer = {
  padding: "24px 40px 32px",
};

const footerBrand = {
  fontSize: "13px",
  color: "#0069B4",
  margin: 0,
  fontWeight: 600,
  letterSpacing: "-0.005em",
};

const footerSmall = {
  fontSize: "12px",
  color: "#A3A3A3",
  margin: "6px 0 0",
  lineHeight: "18px",
};
